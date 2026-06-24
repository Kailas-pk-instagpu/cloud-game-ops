
CREATE TYPE public.app_role AS ENUM ('cafe_owner', 'manager');
CREATE TYPE public.seat_status AS ENUM ('available', 'occupied', 'maintenance');
CREATE TYPE public.session_status AS ENUM ('active', 'ended');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_2fa_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- SIGNUP TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'manager'::public.app_role))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- BRANCHES (policies referencing branch_managers added later)
CREATE TABLE public.branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT,
  address TEXT,
  seat_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.branches TO authenticated;
GRANT ALL ON public.branches TO service_role;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "branches_owner_all" ON public.branches FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- BRANCH MANAGERS
CREATE TABLE public.branch_managers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES public.branches ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (branch_id, manager_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.branch_managers TO authenticated;
GRANT ALL ON public.branch_managers TO service_role;
ALTER TABLE public.branch_managers ENABLE ROW LEVEL SECURITY;

-- helpers (must exist before policies that use them)
CREATE OR REPLACE FUNCTION public.is_branch_manager(_branch_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.branch_managers WHERE branch_id = _branch_id AND manager_id = _user_id)
$$;
CREATE OR REPLACE FUNCTION public.is_branch_owner(_branch_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.branches WHERE id = _branch_id AND owner_id = _user_id)
$$;

CREATE POLICY "branches_manager_select" ON public.branches FOR SELECT TO authenticated
  USING (public.is_branch_manager(id, auth.uid()));
CREATE POLICY "branch_managers_owner_all" ON public.branch_managers FOR ALL TO authenticated
  USING (public.is_branch_owner(branch_id, auth.uid()))
  WITH CHECK (public.is_branch_owner(branch_id, auth.uid()));
CREATE POLICY "branch_managers_self_select" ON public.branch_managers FOR SELECT TO authenticated
  USING (manager_id = auth.uid());

-- SEATS
CREATE TABLE public.seats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES public.branches ON DELETE CASCADE,
  number INT NOT NULL,
  gpu_model TEXT NOT NULL DEFAULT 'RTX 4070',
  status public.seat_status NOT NULL DEFAULT 'available',
  player_name TEXT,
  cost_per_minute NUMERIC(10,2) NOT NULL DEFAULT 0.20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (branch_id, number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seats TO authenticated;
GRANT ALL ON public.seats TO service_role;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seats_branch_access" ON public.seats FOR ALL TO authenticated
  USING (public.is_branch_owner(branch_id, auth.uid()) OR public.is_branch_manager(branch_id, auth.uid()))
  WITH CHECK (public.is_branch_owner(branch_id, auth.uid()) OR public.is_branch_manager(branch_id, auth.uid()));

-- SESSIONS
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES public.branches ON DELETE CASCADE,
  seat_id UUID NOT NULL REFERENCES public.seats ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  cost_per_minute NUMERIC(10,2) NOT NULL,
  locked_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  status public.session_status NOT NULL DEFAULT 'active',
  started_by UUID REFERENCES auth.users
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;
GRANT ALL ON public.sessions TO service_role;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_branch_access" ON public.sessions FOR ALL TO authenticated
  USING (public.is_branch_owner(branch_id, auth.uid()) OR public.is_branch_manager(branch_id, auth.uid()))
  WITH CHECK (public.is_branch_owner(branch_id, auth.uid()) OR public.is_branch_manager(branch_id, auth.uid()));

-- SETTLEMENTS
CREATE TABLE public.settlements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  duration_sec INT NOT NULL,
  cost_per_minute NUMERIC(10,2) NOT NULL,
  locked_amount NUMERIC(10,2) NOT NULL,
  usage_cost NUMERIC(10,2) NOT NULL,
  refund NUMERIC(10,2) NOT NULL,
  settled_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settlements TO authenticated;
GRANT ALL ON public.settlements TO service_role;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settlements_branch_access" ON public.settlements FOR ALL TO authenticated
  USING (public.is_branch_owner(branch_id, auth.uid()) OR public.is_branch_manager(branch_id, auth.uid()))
  WITH CHECK (public.is_branch_owner(branch_id, auth.uid()) OR public.is_branch_manager(branch_id, auth.uid()));

-- BOOKINGS
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES public.branches ON DELETE CASCADE,
  seat_id UUID REFERENCES public.seats ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_min INT NOT NULL DEFAULT 60,
  status public.booking_status NOT NULL DEFAULT 'confirmed',
  notes TEXT,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings_branch_access" ON public.bookings FOR ALL TO authenticated
  USING (public.is_branch_owner(branch_id, auth.uid()) OR public.is_branch_manager(branch_id, auth.uid()))
  WITH CHECK (public.is_branch_owner(branch_id, auth.uid()) OR public.is_branch_manager(branch_id, auth.uid()));

-- SHIFTS
CREATE TABLE public.shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES public.branches ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  weekdays TEXT[] NOT NULL DEFAULT '{}',
  manager_ids UUID[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shifts TO authenticated;
GRANT ALL ON public.shifts TO service_role;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shifts_branch_access" ON public.shifts FOR ALL TO authenticated
  USING (public.is_branch_owner(branch_id, auth.uid()) OR public.is_branch_manager(branch_id, auth.uid()))
  WITH CHECK (public.is_branch_owner(branch_id, auth.uid()) OR public.is_branch_manager(branch_id, auth.uid()));

-- HANDOVER NOTES (manager-only writes)
CREATE TABLE public.handover_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES public.branches ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.handover_notes TO authenticated;
GRANT ALL ON public.handover_notes TO service_role;
ALTER TABLE public.handover_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "handover_select_branch" ON public.handover_notes FOR SELECT TO authenticated
  USING (public.is_branch_owner(branch_id, auth.uid()) OR public.is_branch_manager(branch_id, auth.uid()));
CREATE POLICY "handover_manager_write" ON public.handover_notes FOR INSERT TO authenticated
  WITH CHECK (public.is_branch_manager(branch_id, auth.uid()) AND author_id = auth.uid());
CREATE POLICY "handover_author_update" ON public.handover_notes FOR UPDATE TO authenticated
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "handover_author_delete" ON public.handover_notes FOR DELETE TO authenticated
  USING (author_id = auth.uid());

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own_all" ON public.notifications FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.seats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settlements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.handover_notes;

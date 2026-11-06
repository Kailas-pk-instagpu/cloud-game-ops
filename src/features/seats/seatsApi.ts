import { bffFetch } from '@/shared/lib/bff';

/**
 * Seats from the backend (cafe-management-service through the BFF), P1-4 step 1 (2026-11-06).
 *   GET  /api/v1/cafes/:id/seats      a cafe's seats + GPU profiles (seats.config.view; Cafes page)
 *   GET  /api/v1/seats[?cafe_id=]     the Seat Management grid (seats.operate.view; a Floor Manager: their cafes)
 *   PATCH /api/v1/seats/:id           { label?, maintenance? } (seats.config.edit: owner, Super Admin)
 *   PUT  /api/v1/seats/:id/setup      { hostname?, horizon_login?, gpu_profile? } (seats.setup: Super Admin)
 * Seats are created when the Super Admin approves the cafe (the number it asked for) and stay "setting up" until each is linked to
 * its thin client. hostname / horizon_login come only to platform staff.
 */
export type SeatStatus = 'setting_up' | 'available' | 'occupied' | 'maintenance';

export interface ApiSeat {
  id: string;
  cafe_id: string;
  cafe_name: string;
  code: string;
  number: number;
  label: string | null;
  status: SeatStatus;
  gpu_profile: string | null;
  gpu_name: string | null;
  hostname?: string | null;
  horizon_login?: string | null;
  /** Platform staff only: what Horizon says about the seat's AD login (step 2). */
  horizon?: { login_found: boolean | null; state: 'CONNECTED' | 'DISCONNECTED' | null; checked_at: string | null };
  setup_reason?: 'no_hostname' | 'no_login' | 'login_not_in_ad' | 'waiting_for_horizon' | null;
  updated_at: string;
}

export interface GpuProfile {
  code: string;
  name: string;
}

const change = <T>(path: string, method: string, json: unknown) =>
  bffFetch<T>(`/api/v1${path}`, { method, json, headers: { 'idempotency-key': crypto.randomUUID() } });

export const seatsApi = {
  forCafe: (cafeId: string) => bffFetch<{ seats: ApiSeat[]; gpu_profiles: GpuProfile[] }>(`/api/v1/cafes/${cafeId}/seats`),
  operate: (cafeId?: string) => bffFetch<ApiSeat[]>(`/api/v1/seats${cafeId ? `?cafe_id=${cafeId}` : ''}`),
  edit: (id: string, input: { label?: string | null; maintenance?: boolean }) => change<ApiSeat>(`/seats/${id}`, 'PATCH', input),
  setup: (id: string, input: { hostname?: string | null; horizon_login?: string | null; gpu_profile?: string | null }) =>
    change<ApiSeat>(`/seats/${id}/setup`, 'PUT', input),
};

/** Why a seat is still setting up (platform staff only). */
export const SETUP_REASON: Record<NonNullable<ApiSeat['setup_reason']>, string> = {
  no_hostname: 'Waiting for the thin client hostname.',
  no_login: 'Waiting for the Horizon login.',
  login_not_in_ad: 'The Horizon login was not found in Active Directory: create the AD account or correct the login.',
  waiting_for_horizon: 'Waiting for Horizon to confirm the login (within a minute).',
};

/** A seat's name on screen: the owner's name for it, else its number. */
export const seatTitle = (s: ApiSeat) => s.label || `Seat ${s.number}`;

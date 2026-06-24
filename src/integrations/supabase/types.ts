export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          branch_id: string
          created_at: string
          created_by: string | null
          customer_name: string
          customer_phone: string | null
          duration_min: number
          id: string
          notes: string | null
          scheduled_at: string
          seat_id: string | null
          status: Database["public"]["Enums"]["booking_status"]
        }
        Insert: {
          branch_id: string
          created_at?: string
          created_by?: string | null
          customer_name: string
          customer_phone?: string | null
          duration_min?: number
          id?: string
          notes?: string | null
          scheduled_at: string
          seat_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
        }
        Update: {
          branch_id?: string
          created_at?: string
          created_by?: string | null
          customer_name?: string
          customer_phone?: string | null
          duration_min?: number
          id?: string
          notes?: string | null
          scheduled_at?: string
          seat_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
        }
        Relationships: [
          {
            foreignKeyName: "bookings_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_seat_id_fkey"
            columns: ["seat_id"]
            isOneToOne: false
            referencedRelation: "seats"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_managers: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          manager_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          manager_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          manager_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_managers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          id: string
          name: string
          owner_id: string
          seat_count: number
          status: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          name: string
          owner_id: string
          seat_count?: number
          status?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          seat_count?: number
          status?: string
        }
        Relationships: []
      }
      handover_notes: {
        Row: {
          author_id: string
          author_name: string
          branch_id: string
          created_at: string
          id: string
          note: string
        }
        Insert: {
          author_id: string
          author_name: string
          branch_id: string
          created_at?: string
          id?: string
          note: string
        }
        Update: {
          author_id?: string
          author_name?: string
          branch_id?: string
          created_at?: string
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "handover_notes_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_2fa_enabled: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_2fa_enabled?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_2fa_enabled?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      seats: {
        Row: {
          branch_id: string
          cost_per_minute: number
          created_at: string
          gpu_model: string
          id: string
          number: number
          player_name: string | null
          status: Database["public"]["Enums"]["seat_status"]
        }
        Insert: {
          branch_id: string
          cost_per_minute?: number
          created_at?: string
          gpu_model?: string
          id?: string
          number: number
          player_name?: string | null
          status?: Database["public"]["Enums"]["seat_status"]
        }
        Update: {
          branch_id?: string
          cost_per_minute?: number
          created_at?: string
          gpu_model?: string
          id?: string
          number?: number
          player_name?: string | null
          status?: Database["public"]["Enums"]["seat_status"]
        }
        Relationships: [
          {
            foreignKeyName: "seats_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          branch_id: string
          cost_per_minute: number
          customer_name: string
          ended_at: string | null
          id: string
          locked_amount: number
          seat_id: string
          started_at: string
          started_by: string | null
          status: Database["public"]["Enums"]["session_status"]
        }
        Insert: {
          branch_id: string
          cost_per_minute: number
          customer_name: string
          ended_at?: string | null
          id?: string
          locked_amount?: number
          seat_id: string
          started_at?: string
          started_by?: string | null
          status?: Database["public"]["Enums"]["session_status"]
        }
        Update: {
          branch_id?: string
          cost_per_minute?: number
          customer_name?: string
          ended_at?: string | null
          id?: string
          locked_amount?: number
          seat_id?: string
          started_at?: string
          started_by?: string | null
          status?: Database["public"]["Enums"]["session_status"]
        }
        Relationships: [
          {
            foreignKeyName: "sessions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_seat_id_fkey"
            columns: ["seat_id"]
            isOneToOne: false
            referencedRelation: "seats"
            referencedColumns: ["id"]
          },
        ]
      }
      settlements: {
        Row: {
          branch_id: string
          cost_per_minute: number
          created_at: string
          customer_name: string
          duration_sec: number
          id: string
          locked_amount: number
          refund: number
          session_id: string
          settled_by: string | null
          usage_cost: number
        }
        Insert: {
          branch_id: string
          cost_per_minute: number
          created_at?: string
          customer_name: string
          duration_sec: number
          id?: string
          locked_amount: number
          refund: number
          session_id: string
          settled_by?: string | null
          usage_cost: number
        }
        Update: {
          branch_id?: string
          cost_per_minute?: number
          created_at?: string
          customer_name?: string
          duration_sec?: number
          id?: string
          locked_amount?: number
          refund?: number
          session_id?: string
          settled_by?: string | null
          usage_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "settlements_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          active: boolean
          branch_id: string
          created_at: string
          created_by: string | null
          end_time: string
          id: string
          manager_ids: string[]
          name: string
          start_time: string
          weekdays: string[]
        }
        Insert: {
          active?: boolean
          branch_id: string
          created_at?: string
          created_by?: string | null
          end_time: string
          id?: string
          manager_ids?: string[]
          name: string
          start_time: string
          weekdays?: string[]
        }
        Update: {
          active?: boolean
          branch_id?: string
          created_at?: string
          created_by?: string | null
          end_time?: string
          id?: string
          manager_ids?: string[]
          name?: string
          start_time?: string
          weekdays?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "shifts_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_branch_manager: {
        Args: { _branch_id: string; _user_id: string }
        Returns: boolean
      }
      is_branch_owner: {
        Args: { _branch_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "cafe_owner" | "manager"
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      seat_status: "available" | "occupied" | "maintenance"
      session_status: "active" | "ended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["cafe_owner", "manager"],
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      seat_status: ["available", "occupied", "maintenance"],
      session_status: ["active", "ended"],
    },
  },
} as const

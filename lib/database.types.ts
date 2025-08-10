export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string
          date_of_birth: string
          gender: string
          street_address: string
          emergency_contact_name: string
          emergency_contact_number: string
          profile_picture_url: string | null
          role: string
          membership_status: string
          joining_fee_paid: boolean
          last_payment_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          phone: string
          date_of_birth: string
          gender: string
          street_address: string
          emergency_contact_name: string
          emergency_contact_number: string
          profile_picture_url?: string | null
          role?: string
          membership_status?: string
          joining_fee_paid?: boolean
          last_payment_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string
          date_of_birth?: string
          gender?: string
          street_address?: string
          emergency_contact_name?: string
          emergency_contact_number?: string
          profile_picture_url?: string | null
          role?: string
          membership_status?: string
          joining_fee_paid?: boolean
          last_payment_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      receipts: {
        Row: {
          id: string
          user_id: string
          filename: string
          file_url: string
          amount: number
          description: string | null
          status: string
          upload_date: string
          verified_date: string | null
          verified_by: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          filename: string
          file_url: string
          amount: number
          description?: string | null
          status?: string
          upload_date?: string
          verified_date?: string | null
          verified_by?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          filename?: string
          file_url?: string
          amount?: number
          description?: string | null
          status?: string
          upload_date?: string
          verified_date?: string | null
          verified_by?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          receipt_id: string | null
          amount: number
          payment_type: string
          payment_method: string | null
          payment_date: string
          month_year: string | null
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          receipt_id?: string | null
          amount: number
          payment_type: string
          payment_method?: string | null
          payment_date: string
          month_year?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          receipt_id?: string | null
          amount?: number
          payment_type?: string
          payment_method?: string | null
          payment_date?: string
          month_year?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      membership_history: {
        Row: {
          id: string
          user_id: string
          start_date: string
          end_date: string | null
          status: string
          monthly_fee: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          start_date: string
          end_date?: string | null
          status: string
          monthly_fee: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          start_date?: string
          end_date?: string | null
          status?: string
          monthly_fee?: number
          created_at?: string
          updated_at?: string
        }
      }
      memberships: {
        Row: {
          id: string
          user_id: string
          plan_name: string
          monthly_fee: number
          start_date: string
          end_date: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_name: string
          monthly_fee: number
          start_date: string
          end_date?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_name?: string
          monthly_fee?: number
          start_date?: string
          end_date?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      admin_logs: {
        Row: {
          id: string
          admin_id: string
          action: string
          target_type: string
          target_id: string
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action: string
          target_type: string
          target_id: string
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          action?: string
          target_type?: string
          target_id?: string
          details?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_monthly_revenue: {
        Args: {
          target_year?: number
        }
        Returns: {
          month_year: string
          revenue: number
          payment_count: number
        }[]
      }
      get_unpaid_members_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_paid_members_current_month: {
        Args: {
          p_month_year: string
        }
        Returns: {
          id: string
          full_name: string  // Changed from text to string to match VARCHAR
          email: string      // Changed from text to string to match VARCHAR
          profile_picture_url: string | null
          paid_amount: number
        }[]
      }
      get_unpaid_members_current_month: {
        Args: {
          p_month_year: string
        }
        Returns: {
          id: string
          full_name: string  // Changed from text to string to match VARCHAR
          email: string      // Changed from text to string to match VARCHAR
          profile_picture_url: string | null
        }[]
      }
      get_members_for_deactivation: {
        Args: {
          num_months: number
        }
        Returns: {
          id: string
          full_name: string  // Changed from text to string to match VARCHAR
          email: string      // Changed from text to string to match VARCHAR
          profile_picture_url: string | null
          membership_status: string  // Changed from text to string to match VARCHAR
          last_payment_date: string | null
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][TableName] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : never
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never
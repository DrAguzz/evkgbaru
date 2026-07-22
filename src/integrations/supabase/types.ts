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
      app_settings: {
        Row: {
          id: number
          splash_image_url: string | null
          splash_subtitle: string | null
          splash_title: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          splash_image_url?: string | null
          splash_subtitle?: string | null
          splash_title?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          splash_image_url?: string | null
          splash_subtitle?: string | null
          splash_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_date: string
          booking_no: string
          booking_status: string
          booking_time: string
          created_at: string
          discount_amount: number
          id: string
          package_id: string
          pax: number
          payment_status: string
          pickup_hub_id: string | null
          promo_code: string | null
          rider_id: string | null
          special_request: string | null
          total_price: number
          tourist_id: string
          updated_at: string
        }
        Insert: {
          booking_date: string
          booking_no?: string
          booking_status?: string
          booking_time: string
          created_at?: string
          discount_amount?: number
          id?: string
          package_id: string
          pax?: number
          payment_status?: string
          pickup_hub_id?: string | null
          promo_code?: string | null
          rider_id?: string | null
          special_request?: string | null
          total_price?: number
          tourist_id: string
          updated_at?: string
        }
        Update: {
          booking_date?: string
          booking_no?: string
          booking_status?: string
          booking_time?: string
          created_at?: string
          discount_amount?: number
          id?: string
          package_id?: string
          pax?: number
          payment_status?: string
          pickup_hub_id?: string | null
          promo_code?: string | null
          rider_id?: string | null
          special_request?: string | null
          total_price?: number
          tourist_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "tour_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_pickup_hub_id_fkey"
            columns: ["pickup_hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_tourist_profile_fkey"
            columns: ["tourist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hubs: {
        Row: {
          address: string | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          operating_hour: string | null
          pic_name: string | null
          pic_phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          operating_hour?: string | null
          pic_name?: string | null
          pic_phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          operating_hour?: string | null
          pic_name?: string | null
          pic_phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          id: string
          image: string | null
          latitude: number | null
          longitude: number | null
          name: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          status: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      package_routes: {
        Row: {
          created_at: string
          estimated_minutes: number
          id: string
          is_checkpoint: boolean
          location_id: string
          package_id: string
          sequence_no: number
        }
        Insert: {
          created_at?: string
          estimated_minutes?: number
          id?: string
          is_checkpoint?: boolean
          location_id: string
          package_id: string
          sequence_no: number
        }
        Update: {
          created_at?: string
          estimated_minutes?: number
          id?: string
          is_checkpoint?: boolean
          location_id?: string
          package_id?: string
          sequence_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "package_routes_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_routes_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "tour_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          id: string
          paid_at: string | null
          payment_gateway: string | null
          payment_method: string
          status: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_gateway?: string | null
          payment_method: string
          status?: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_gateway?: string | null
          payment_method?: string
          status?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          nationality: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          nationality?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          nationality?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          max_uses: number | null
          min_amount: number
          status: string
          updated_at: string
          used_count: number
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          max_uses?: number | null
          min_amount?: number
          status?: string
          updated_at?: string
          used_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          max_uses?: number | null
          min_amount?: number
          status?: string
          updated_at?: string
          used_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          rider_id: string | null
          tourist_id: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          rider_id?: string | null
          tourist_id: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          rider_id?: string | null
          tourist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      riders: {
        Row: {
          commission_rate: number
          created_at: string
          hub_id: string | null
          id: string
          license_type: string | null
          license_valid_until: string | null
          name: string
          phone: string | null
          rating: number
          status: string
          updated_at: string
          user_id: string | null
          vehicle_id: string | null
          vehicle_type: string | null
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          hub_id?: string | null
          id?: string
          license_type?: string | null
          license_valid_until?: string | null
          name: string
          phone?: string | null
          rating?: number
          status?: string
          updated_at?: string
          user_id?: string | null
          vehicle_id?: string | null
          vehicle_type?: string | null
        }
        Update: {
          commission_rate?: number
          created_at?: string
          hub_id?: string | null
          id?: string
          license_type?: string | null
          license_valid_until?: string | null
          name?: string
          phone?: string | null
          rating?: number
          status?: string
          updated_at?: string
          user_id?: string | null
          vehicle_id?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "riders_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
        ]
      }
      splash_screens: {
        Row: {
          created_at: string
          id: string
          image_url: string
          sort_order: number
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          sort_order?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tour_packages: {
        Row: {
          category: string
          created_at: string
          description: string | null
          discount_percentage: number | null
          duration_minutes: number
          end_hub_id: string | null
          id: string
          image: string | null
          is_promo: boolean
          max_pax: number
          min_pax: number
          package_name: string
          price: number
          promo_price: number | null
          start_hub_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          duration_minutes?: number
          end_hub_id?: string | null
          id?: string
          image?: string | null
          is_promo?: boolean
          max_pax?: number
          min_pax?: number
          package_name: string
          price?: number
          promo_price?: number | null
          start_hub_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          duration_minutes?: number
          end_hub_id?: string | null
          id?: string
          image?: string | null
          is_promo?: boolean
          max_pax?: number
          min_pax?: number
          package_name?: string
          price?: number
          promo_price?: number | null
          start_hub_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_packages_end_hub_id_fkey"
            columns: ["end_hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_packages_start_hub_id_fkey"
            columns: ["start_hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_progress: {
        Row: {
          arrival_time: string | null
          booking_id: string
          created_at: string
          id: string
          location_id: string | null
          photo: string | null
          remarks: string | null
          rider_id: string | null
          sequence_no: number
          status: string
        }
        Insert: {
          arrival_time?: string | null
          booking_id: string
          created_at?: string
          id?: string
          location_id?: string | null
          photo?: string | null
          remarks?: string | null
          rider_id?: string | null
          sequence_no?: number
          status: string
        }
        Update: {
          arrival_time?: string | null
          booking_id?: string
          created_at?: string
          id?: string
          location_id?: string | null
          photo?: string | null
          remarks?: string | null
          rider_id?: string | null
          sequence_no?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_progress_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_progress_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_progress_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      claim_admin_role: { Args: never; Returns: undefined }
      claim_rider_profile: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "tourist"
        | "rider"
        | "hub_manager"
        | "admin"
        | "super_admin"
        | "customer"
        | "hub_admin"
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
      app_role: [
        "tourist",
        "rider",
        "hub_manager",
        "admin",
        "super_admin",
        "customer",
        "hub_admin",
      ],
    },
  },
} as const

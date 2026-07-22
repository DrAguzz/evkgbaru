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
          default_insurance_provider: string
          id: number
          pickup_rate_per_km: number
          splash_image_url: string | null
          splash_subtitle: string | null
          splash_title: string | null
          updated_at: string
          waiting_list_response_minutes: number
        }
        Insert: {
          default_insurance_provider?: string
          id?: number
          pickup_rate_per_km?: number
          splash_image_url?: string | null
          splash_subtitle?: string | null
          splash_title?: string | null
          updated_at?: string
          waiting_list_response_minutes?: number
        }
        Update: {
          default_insurance_provider?: string
          id?: number
          pickup_rate_per_km?: number
          splash_image_url?: string | null
          splash_subtitle?: string | null
          splash_title?: string | null
          updated_at?: string
          waiting_list_response_minutes?: number
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
          hub_id: string | null
          id: string
          insurance_coverage_date: string | null
          insurance_policy_no: string | null
          insurance_provider: string | null
          insurance_status: string | null
          meeting_method: string
          notes: string | null
          package_id: string
          pax: number
          payment_status: string
          pickup_address: string | null
          pickup_distance_km: number | null
          pickup_fee: number | null
          pickup_hub_id: string | null
          pickup_latitude: number | null
          pickup_location_name: string | null
          pickup_longitude: number | null
          pickup_time: string | null
          promo_code: string | null
          rider_id: string | null
          special_request: string | null
          time_slot_id: string | null
          total_price: number
          tourist_id: string
          updated_at: string
          vehicle_id: string | null
          vehicle_type_id: string | null
        }
        Insert: {
          booking_date: string
          booking_no?: string
          booking_status?: string
          booking_time: string
          created_at?: string
          discount_amount?: number
          hub_id?: string | null
          id?: string
          insurance_coverage_date?: string | null
          insurance_policy_no?: string | null
          insurance_provider?: string | null
          insurance_status?: string | null
          meeting_method?: string
          notes?: string | null
          package_id: string
          pax?: number
          payment_status?: string
          pickup_address?: string | null
          pickup_distance_km?: number | null
          pickup_fee?: number | null
          pickup_hub_id?: string | null
          pickup_latitude?: number | null
          pickup_location_name?: string | null
          pickup_longitude?: number | null
          pickup_time?: string | null
          promo_code?: string | null
          rider_id?: string | null
          special_request?: string | null
          time_slot_id?: string | null
          total_price?: number
          tourist_id: string
          updated_at?: string
          vehicle_id?: string | null
          vehicle_type_id?: string | null
        }
        Update: {
          booking_date?: string
          booking_no?: string
          booking_status?: string
          booking_time?: string
          created_at?: string
          discount_amount?: number
          hub_id?: string | null
          id?: string
          insurance_coverage_date?: string | null
          insurance_policy_no?: string | null
          insurance_provider?: string | null
          insurance_status?: string | null
          meeting_method?: string
          notes?: string | null
          package_id?: string
          pax?: number
          payment_status?: string
          pickup_address?: string | null
          pickup_distance_km?: number | null
          pickup_fee?: number | null
          pickup_hub_id?: string | null
          pickup_latitude?: number | null
          pickup_location_name?: string | null
          pickup_longitude?: number | null
          pickup_time?: string | null
          promo_code?: string | null
          rider_id?: string | null
          special_request?: string | null
          time_slot_id?: string | null
          total_price?: number
          tourist_id?: string
          updated_at?: string
          vehicle_id?: string | null
          vehicle_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "bookings_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "package_time_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_tourist_profile_fkey"
            columns: ["tourist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_vehicle_type_id_fkey"
            columns: ["vehicle_type_id"]
            isOneToOne: false
            referencedRelation: "vehicle_types"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          booking_id: string
          checked_in_at: string
          created_at: string
          id: string
          identity_document: string | null
          identity_verified: boolean
          notes: string | null
          payment_verified: boolean
          verified_by: string | null
        }
        Insert: {
          booking_id: string
          checked_in_at?: string
          created_at?: string
          id?: string
          identity_document?: string | null
          identity_verified?: boolean
          notes?: string | null
          payment_verified?: boolean
          verified_by?: string | null
        }
        Update: {
          booking_id?: string
          checked_in_at?: string
          created_at?: string
          id?: string
          identity_document?: string | null
          identity_verified?: boolean
          notes?: string | null
          payment_verified?: boolean
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      hubs: {
        Row: {
          address: string | null
          created_at: string
          has_briefing_area: boolean
          has_charging: boolean
          has_checkin_counter: boolean
          id: string
          latitude: number | null
          longitude: number | null
          max_capacity: number | null
          name: string
          operating_hour: string | null
          operating_hours: Json | null
          pic_name: string | null
          pic_phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          has_briefing_area?: boolean
          has_charging?: boolean
          has_checkin_counter?: boolean
          id?: string
          latitude?: number | null
          longitude?: number | null
          max_capacity?: number | null
          name: string
          operating_hour?: string | null
          operating_hours?: Json | null
          pic_name?: string | null
          pic_phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          has_briefing_area?: boolean
          has_charging?: boolean
          has_checkin_counter?: boolean
          id?: string
          latitude?: number | null
          longitude?: number | null
          max_capacity?: number | null
          name?: string
          operating_hour?: string | null
          operating_hours?: Json | null
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
      package_time_slots: {
        Row: {
          capacity: number
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          package_id: string
          start_time: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          package_id: string
          start_time: string
        }
        Update: {
          capacity?: number
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          package_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_time_slots_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          images: Json
          max_participants: number
          meeting_hub_id: string | null
          name: string
          price: number
          slug: string
          status: string
          updated_at: string
          vehicle_type_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          images?: Json
          max_participants?: number
          meeting_hub_id?: string | null
          name: string
          price?: number
          slug: string
          status?: string
          updated_at?: string
          vehicle_type_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          images?: Json
          max_participants?: number
          meeting_hub_id?: string | null
          name?: string
          price?: number
          slug?: string
          status?: string
          updated_at?: string
          vehicle_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "packages_meeting_hub_id_fkey"
            columns: ["meeting_hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packages_vehicle_type_id_fkey"
            columns: ["vehicle_type_id"]
            isOneToOne: false
            referencedRelation: "vehicle_types"
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
          payment_reference: string | null
          provider_txn_id: string | null
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
          payment_reference?: string | null
          provider_txn_id?: string | null
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
          payment_reference?: string | null
          provider_txn_id?: string | null
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
          address: string | null
          avatar_url: string | null
          created_at: string
          dob: string | null
          email: string
          gender: string | null
          id: string
          name: string
          nationality: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          dob?: string | null
          email: string
          gender?: string | null
          id: string
          name: string
          nationality?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          dob?: string | null
          email?: string
          gender?: string | null
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
      rider_applications: {
        Row: {
          address: string | null
          created_at: string
          declaration_accepted_at: string
          dob: string | null
          documents: Json
          driving_experience_years: number | null
          email: string
          employment_type: Database["public"]["Enums"]["rider_employment_type"]
          full_name: string
          gender: string | null
          hub_id: string | null
          ic_passport: string
          id: string
          interview_at: string | null
          languages: string[]
          license_number: string | null
          phone: string
          photo_url: string | null
          resume_url: string | null
          review_notes: string | null
          reviewer_id: string | null
          status: Database["public"]["Enums"]["rider_application_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          declaration_accepted_at: string
          dob?: string | null
          documents?: Json
          driving_experience_years?: number | null
          email: string
          employment_type: Database["public"]["Enums"]["rider_employment_type"]
          full_name: string
          gender?: string | null
          hub_id?: string | null
          ic_passport: string
          id?: string
          interview_at?: string | null
          languages?: string[]
          license_number?: string | null
          phone: string
          photo_url?: string | null
          resume_url?: string | null
          review_notes?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["rider_application_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          declaration_accepted_at?: string
          dob?: string | null
          documents?: Json
          driving_experience_years?: number | null
          email?: string
          employment_type?: Database["public"]["Enums"]["rider_employment_type"]
          full_name?: string
          gender?: string | null
          hub_id?: string | null
          ic_passport?: string
          id?: string
          interview_at?: string | null
          languages?: string[]
          license_number?: string | null
          phone?: string
          photo_url?: string | null
          resume_url?: string | null
          review_notes?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["rider_application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rider_applications_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
        ]
      }
      riders: {
        Row: {
          application_id: string | null
          commission_rate: number
          created_at: string
          employment_type:
            | Database["public"]["Enums"]["rider_employment_type"]
            | null
          hub_id: string | null
          id: string
          license_type: string | null
          license_valid_until: string | null
          name: string
          phone: string | null
          rating: number
          rider_code: string | null
          status: string
          updated_at: string
          user_id: string | null
          vehicle_id: string | null
          vehicle_type: string | null
        }
        Insert: {
          application_id?: string | null
          commission_rate?: number
          created_at?: string
          employment_type?:
            | Database["public"]["Enums"]["rider_employment_type"]
            | null
          hub_id?: string | null
          id?: string
          license_type?: string | null
          license_valid_until?: string | null
          name: string
          phone?: string | null
          rating?: number
          rider_code?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          vehicle_id?: string | null
          vehicle_type?: string | null
        }
        Update: {
          application_id?: string | null
          commission_rate?: number
          created_at?: string
          employment_type?:
            | Database["public"]["Enums"]["rider_employment_type"]
            | null
          hub_id?: string | null
          id?: string
          license_type?: string | null
          license_valid_until?: string | null
          name?: string
          phone?: string | null
          rating?: number
          rider_code?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          vehicle_id?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "riders_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "rider_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "riders_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_briefings: {
        Row: {
          booking_id: string
          briefed_by: string | null
          briefing_time: string
          created_at: string
          id: string
          notes: string | null
          status: string
        }
        Insert: {
          booking_id: string
          briefed_by?: string | null
          briefing_time?: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
        }
        Update: {
          booking_id?: string
          briefed_by?: string | null
          briefing_time?: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_briefings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      sos_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          booking_id: string
          created_at: string
          emergency_contact: string | null
          id: string
          latitude: number | null
          longitude: number | null
          message: string | null
          resolved_at: string | null
          rider_id: string | null
          status: string
          tourist_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          booking_id: string
          created_at?: string
          emergency_contact?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          message?: string | null
          resolved_at?: string | null
          rider_id?: string | null
          status?: string
          tourist_id: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          booking_id?: string
          created_at?: string
          emergency_contact?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          message?: string | null
          resolved_at?: string | null
          rider_id?: string | null
          status?: string
          tourist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sos_alerts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sos_alerts_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
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
          hub_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          hub_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          hub_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_types: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          created_at: string
          hub_id: string | null
          id: string
          identifier: string
          status: string
          updated_at: string
          vehicle_type_id: string
        }
        Insert: {
          created_at?: string
          hub_id?: string | null
          id?: string
          identifier: string
          status?: string
          updated_at?: string
          vehicle_type_id: string
        }
        Update: {
          created_at?: string
          hub_id?: string | null
          id?: string
          identifier?: string
          status?: string
          updated_at?: string
          vehicle_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_vehicle_type_id_fkey"
            columns: ["vehicle_type_id"]
            isOneToOne: false
            referencedRelation: "vehicle_types"
            referencedColumns: ["id"]
          },
        ]
      }
      waiting_list: {
        Row: {
          booking_date: string
          created_at: string
          customer_id: string
          id: string
          notified_at: string | null
          package_id: string
          pax: number
          queue_number: number
          respond_by: string | null
          status: string
          time_slot_id: string
          updated_at: string
        }
        Insert: {
          booking_date: string
          created_at?: string
          customer_id: string
          id?: string
          notified_at?: string | null
          package_id: string
          pax?: number
          queue_number: number
          respond_by?: string | null
          status?: string
          time_slot_id: string
          updated_at?: string
        }
        Update: {
          booking_date?: string
          created_at?: string
          customer_id?: string
          id?: string
          notified_at?: string | null
          package_id?: string
          pax?: number
          queue_number?: number
          respond_by?: string | null
          status?: string
          time_slot_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "waiting_list_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiting_list_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "package_time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_rider_code: {
        Args: { _type: Database["public"]["Enums"]["rider_employment_type"] }
        Returns: string
      }
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
      rider_application_status:
        | "submitted"
        | "under_review"
        | "interview_scheduled"
        | "approved"
        | "rejected"
      rider_employment_type: "full_time" | "part_time"
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
      rider_application_status: [
        "submitted",
        "under_review",
        "interview_scheduled",
        "approved",
        "rejected",
      ],
      rider_employment_type: ["full_time", "part_time"],
    },
  },
} as const

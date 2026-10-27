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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      albums: {
        Row: {
          album_date: string | null
          cover_photo_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          event_id: string | null
          id: string
          site_id: string
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          album_date?: string | null
          cover_photo_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          event_id?: string | null
          id?: string
          site_id?: string
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
        }
        Update: {
          album_date?: string | null
          cover_photo_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          event_id?: string | null
          id?: string
          site_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "albums_cover_photo_fkey"
            columns: ["cover_photo_id", "site_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id", "site_id"]
          },
          {
            foreignKeyName: "albums_event_fkey"
            columns: ["event_id", "site_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id", "site_id"]
          },
          {
            foreignKeyName: "albums_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          created_at: string
          deleted_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          level: Database["public"]["Enums"]["announcement_level"]
          link_label: string | null
          link_url: string | null
          message: string
          site_id: string
          starts_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          level?: Database["public"]["Enums"]["announcement_level"]
          link_label?: string | null
          link_url?: string | null
          message: string
          site_id?: string
          starts_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          level?: Database["public"]["Enums"]["announcement_level"]
          link_label?: string | null
          link_url?: string | null
          message?: string
          site_id?: string
          starts_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          message: string
          name: string
          phone: string | null
          read_at: string | null
          site_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          message: string
          name: string
          phone?: string | null
          read_at?: string | null
          site_id?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          message?: string
          name?: string
          phone?: string | null
          read_at?: string | null
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          audience: Database["public"]["Enums"]["course_audience"]
          created_at: string
          day_of_week: number | null
          deleted_at: string | null
          description: string
          end_time: string | null
          id: string
          image_path: string | null
          location: string | null
          schedule_text: string | null
          site_id: string
          sort_order: number
          speaker: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["course_audience"]
          created_at?: string
          day_of_week?: number | null
          deleted_at?: string | null
          description?: string
          end_time?: string | null
          id?: string
          image_path?: string | null
          location?: string | null
          schedule_text?: string | null
          site_id?: string
          sort_order?: number
          speaker?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["course_audience"]
          created_at?: string
          day_of_week?: number | null
          deleted_at?: string | null
          description?: string
          end_time?: string | null
          id?: string
          image_path?: string | null
          location?: string | null
          schedule_text?: string | null
          site_id?: string
          sort_order?: number
          speaker?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number | null
          category: Database["public"]["Enums"]["event_category"]
          created_at: string
          deleted_at: string | null
          description: string
          ends_at: string | null
          id: string
          image_path: string | null
          location: string | null
          price_text: string | null
          registration_deadline: string | null
          registration_enabled: boolean
          site_id: string
          slug: string
          starts_at: string
          status: Database["public"]["Enums"]["content_status"]
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          category?: Database["public"]["Enums"]["event_category"]
          created_at?: string
          deleted_at?: string | null
          description?: string
          ends_at?: string | null
          id?: string
          image_path?: string | null
          location?: string | null
          price_text?: string | null
          registration_deadline?: string | null
          registration_enabled?: boolean
          site_id?: string
          slug: string
          starts_at: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          category?: Database["public"]["Enums"]["event_category"]
          created_at?: string
          deleted_at?: string | null
          description?: string
          ends_at?: string | null
          id?: string
          image_path?: string | null
          location?: string | null
          price_text?: string | null
          registration_deadline?: string | null
          registration_enabled?: boolean
          site_id?: string
          slug?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          body: string
          image_path: string | null
          site_id: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          image_path?: string | null
          site_id?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          image_path?: string | null
          site_id?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          album_id: string
          caption: string | null
          created_at: string
          height: number | null
          id: string
          site_id: string
          sort_order: number
          storage_path: string
          width: number | null
        }
        Insert: {
          album_id: string
          caption?: string | null
          created_at?: string
          height?: number | null
          id?: string
          site_id?: string
          sort_order?: number
          storage_path: string
          width?: number | null
        }
        Update: {
          album_id?: string
          caption?: string | null
          created_at?: string
          height?: number | null
          id?: string
          site_id?: string
          sort_order?: number
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_album_fkey"
            columns: ["album_id", "site_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id", "site_id"]
          },
          {
            foreignKeyName: "photos_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          device: string | null
          endpoint: string
          id: string
          p256dh: string
          site_id: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          device?: string | null
          endpoint: string
          id?: string
          p256dh: string
          site_id?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          device?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          site_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string
          id: number
          key: string
          site_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          key: string
          site_id?: string
        }
        Update: {
          created_at?: string
          id?: never
          key?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_limits_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          created_at: string
          email: string | null
          event_id: string
          id: string
          name: string
          party_size: number
          phone: string | null
          site_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          event_id: string
          id?: string
          name: string
          party_size?: number
          phone?: string | null
          site_id?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          event_id?: string
          id?: string
          name?: string
          party_size?: number
          phone?: string | null
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_event_fkey"
            columns: ["event_id", "site_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id", "site_id"]
          },
          {
            foreignKeyName: "registrations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_weeks: {
        Row: {
          closing: string | null
          date: string
          extra_lines: Json
          hidden: string[]
          kidouch: string | null
          note: string | null
          site_id: string
          times: Json
          title: string | null
          updated_at: string
        }
        Insert: {
          closing?: string | null
          date: string
          extra_lines?: Json
          hidden?: string[]
          kidouch?: string | null
          note?: string | null
          site_id?: string
          times?: Json
          title?: string | null
          updated_at?: string
        }
        Update: {
          closing?: string | null
          date?: string
          extra_lines?: Json
          hidden?: string[]
          kidouch?: string | null
          note?: string | null
          site_id?: string
          times?: Json
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_weeks_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      service_times: {
        Row: {
          created_at: string
          day_type: Database["public"]["Enums"]["service_day"]
          deleted_at: string | null
          id: string
          note: string | null
          office: Database["public"]["Enums"]["service_office"]
          site_id: string
          sort_order: number
          time: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_type: Database["public"]["Enums"]["service_day"]
          deleted_at?: string | null
          id?: string
          note?: string | null
          office: Database["public"]["Enums"]["service_office"]
          site_id?: string
          sort_order?: number
          time?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_type?: Database["public"]["Enums"]["service_day"]
          deleted_at?: string | null
          id?: string
          note?: string | null
          office?: Database["public"]["Enums"]["service_office"]
          site_id?: string
          sort_order?: number
          time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_times_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          address_city: string | null
          address_postal_code: string | null
          address_street: string | null
          arvit_after_end: number
          candle_minutes: number
          chaharit_time: string
          color_accent: string
          color_primary: string
          cours_before_end: number | null
          cours_time: string
          donation_url: string | null
          email: string | null
          end_margin_minutes: number
          friday_minha_offset: number
          friday_minha_rounding: number
          havdalah_minutes: number | null
          latitude: number
          logo_path: string | null
          longitude: number
          minha_before_end: number | null
          minha_time: string
          name: string
          phone: string | null
          services_note: string | null
          short_name: string
          site_id: string
          social: Json
          tagline: string | null
          tania_time: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address_city?: string | null
          address_postal_code?: string | null
          address_street?: string | null
          arvit_after_end?: number
          candle_minutes?: number
          chaharit_time?: string
          color_accent?: string
          color_primary?: string
          cours_before_end?: number | null
          cours_time?: string
          donation_url?: string | null
          email?: string | null
          end_margin_minutes?: number
          friday_minha_offset?: number
          friday_minha_rounding?: number
          havdalah_minutes?: number | null
          latitude: number
          logo_path?: string | null
          longitude: number
          minha_before_end?: number | null
          minha_time?: string
          name: string
          phone?: string | null
          services_note?: string | null
          short_name: string
          site_id?: string
          social?: Json
          tagline?: string | null
          tania_time?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address_city?: string | null
          address_postal_code?: string | null
          address_street?: string | null
          arvit_after_end?: number
          candle_minutes?: number
          chaharit_time?: string
          color_accent?: string
          color_primary?: string
          cours_before_end?: number | null
          cours_time?: string
          donation_url?: string | null
          email?: string | null
          end_margin_minutes?: number
          friday_minha_offset?: number
          friday_minha_rounding?: number
          havdalah_minutes?: number | null
          latitude?: number
          logo_path?: string | null
          longitude?: number
          minha_before_end?: number | null
          minha_time?: string
          name?: string
          phone?: string | null
          services_note?: string | null
          short_name?: string
          site_id?: string
          social?: Json
          tagline?: string | null
          tania_time?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: true
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      settings_private: {
        Row: {
          notification_email: string
          site_id: string
          updated_at: string
        }
        Insert: {
          notification_email: string
          site_id?: string
          updated_at?: string
        }
        Update: {
          notification_email?: string
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "settings_private_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: true
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          created_at: string
          domain: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_sites: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["app_role"]
          site_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          site_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          site_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sites_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_admin: { Args: { p_site_id: string }; Returns: boolean }
      can_edit: { Args: { p_site_id: string }; Returns: boolean }
      can_edit_storage_path: { Args: { p_name: string }; Returns: boolean }
      check_rate_limit: {
        Args: { p_key: string; p_max: number; p_window: string }
        Returns: boolean
      }
      event_seats_taken: { Args: { p_event_id: string }; Returns: number }
      has_site_role: {
        Args: {
          p_roles: Database["public"]["Enums"]["app_role"][]
          p_site_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_editor: { Args: never; Returns: boolean }
      is_member_of_request_site: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      purge_expired: {
        Args: never
        Returns: {
          orphan_path: string
        }[]
      }
      register_for_event: {
        Args: {
          p_email: string
          p_event_id: string
          p_name: string
          p_party_size: number
          p_phone: string
        }
        Returns: string
      }
      request_site_id: { Args: never; Returns: string }
    }
    Enums: {
      announcement_level: "info" | "important"
      app_role: "admin" | "editor"
      content_status: "draft" | "published"
      course_audience: "tous" | "hommes" | "femmes" | "enfants" | "jeunes"
      event_category: "general" | "cteen"
      service_day: "semaine" | "dimanche" | "vendredi" | "chabbat" | "fete"
      service_office: "chaharit" | "minha" | "arvit"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      announcement_level: ["info", "important"],
      app_role: ["admin", "editor"],
      content_status: ["draft", "published"],
      course_audience: ["tous", "hommes", "femmes", "enfants", "jeunes"],
      event_category: ["general", "cteen"],
      service_day: ["semaine", "dimanche", "vendredi", "chabbat", "fete"],
      service_office: ["chaharit", "minha", "arvit"],
    },
  },
} as const

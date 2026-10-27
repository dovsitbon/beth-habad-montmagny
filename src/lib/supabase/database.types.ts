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
          site_id: string
          album_date: string | null
          cover_photo_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          event_id: string | null
          id: string
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          site_id?: string
          album_date?: string | null
          cover_photo_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          event_id?: string | null
          id?: string
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
        }
        Update: {
          site_id?: string
          album_date?: string | null
          cover_photo_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          event_id?: string | null
          id?: string
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "albums_cover_photo_fk"
            columns: ["cover_photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "albums_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          site_id: string
          created_at: string
          deleted_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          level: Database["public"]["Enums"]["announcement_level"]
          link_label: string | null
          link_url: string | null
          message: string
          starts_at: string
          updated_at: string
        }
        Insert: {
          site_id?: string
          created_at?: string
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          level?: Database["public"]["Enums"]["announcement_level"]
          link_label?: string | null
          link_url?: string | null
          message: string
          starts_at?: string
          updated_at?: string
        }
        Update: {
          site_id?: string
          created_at?: string
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          level?: Database["public"]["Enums"]["announcement_level"]
          link_label?: string | null
          link_url?: string | null
          message?: string
          starts_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          site_id: string
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          message: string
          name: string
          phone: string | null
          read_at: string | null
        }
        Insert: {
          site_id?: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          message: string
          name: string
          phone?: string | null
          read_at?: string | null
        }
        Update: {
          site_id?: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          message?: string
          name?: string
          phone?: string | null
          read_at?: string | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          site_id: string
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
          sort_order: number
          speaker: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          site_id?: string
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
          sort_order?: number
          speaker?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
        }
        Update: {
          site_id?: string
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
          sort_order?: number
          speaker?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          site_id: string
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
          slug: string
          starts_at: string
          status: Database["public"]["Enums"]["content_status"]
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          site_id?: string
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
          slug: string
          starts_at: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          site_id?: string
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
          slug?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      pages: {
        Row: {
          site_id: string
          body: string
          image_path: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          site_id?: string
          body?: string
          image_path?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          site_id?: string
          body?: string
          image_path?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      photos: {
        Row: {
          site_id: string
          album_id: string
          caption: string | null
          created_at: string
          height: number | null
          id: string
          sort_order: number
          storage_path: string
          width: number | null
        }
        Insert: {
          site_id?: string
          album_id: string
          caption?: string | null
          created_at?: string
          height?: number | null
          id?: string
          sort_order?: number
          storage_path: string
          width?: number | null
        }
        Update: {
          site_id?: string
          album_id?: string
          caption?: string | null
          created_at?: string
          height?: number | null
          id?: string
          sort_order?: number
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
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
          site_id: string
          auth: string
          created_at: string
          device: string | null
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          site_id?: string
          auth: string
          created_at?: string
          device?: string | null
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          site_id?: string
          auth?: string
          created_at?: string
          device?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: [
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
          site_id: string
          created_at: string
          id: number
          key: string
        }
        Insert: {
          site_id?: string
          created_at?: string
          id?: never
          key: string
        }
        Update: {
          site_id?: string
          created_at?: string
          id?: never
          key?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          site_id: string
          created_at: string
          email: string | null
          event_id: string
          id: string
          name: string
          party_size: number
          phone: string | null
        }
        Insert: {
          site_id?: string
          created_at?: string
          email?: string | null
          event_id: string
          id?: string
          name: string
          party_size?: number
          phone?: string | null
        }
        Update: {
          site_id?: string
          created_at?: string
          email?: string | null
          event_id?: string
          id?: string
          name?: string
          party_size?: number
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      service_times: {
        Row: {
          site_id: string
          created_at: string
          day_type: Database["public"]["Enums"]["service_day"]
          deleted_at: string | null
          id: string
          note: string | null
          office: Database["public"]["Enums"]["service_office"]
          sort_order: number
          time: string | null
          updated_at: string
        }
        Insert: {
          site_id?: string
          created_at?: string
          day_type: Database["public"]["Enums"]["service_day"]
          deleted_at?: string | null
          id?: string
          note?: string | null
          office: Database["public"]["Enums"]["service_office"]
          sort_order?: number
          time?: string | null
          updated_at?: string
        }
        Update: {
          site_id?: string
          created_at?: string
          day_type?: Database["public"]["Enums"]["service_day"]
          deleted_at?: string | null
          id?: string
          note?: string | null
          office?: Database["public"]["Enums"]["service_office"]
          sort_order?: number
          time?: string | null
          updated_at?: string
        }
        Relationships: []
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
      settings: {
        Row: {
          site_id: string
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
          social: Json
          tagline: string | null
          tania_time: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          site_id?: string
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
          social?: Json
          tagline?: string | null
          tania_time?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          site_id?: string
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
          social?: Json
          tagline?: string | null
          tania_time?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      settings_private: {
        Row: {
          site_id: string
          notification_email: string
          updated_at: string
        }
        Insert: {
          site_id?: string
          notification_email: string
          updated_at?: string
        }
        Update: {
          site_id?: string
          notification_email?: string
          updated_at?: string
        }
        Relationships: []
      }
      schedule_weeks: {
        Row: {
          site_id: string
          closing: string | null
          date: string
          extra_lines: Json
          hidden: string[]
          kidouch: string | null
          note: string | null
          times: Json
          title: string | null
          updated_at: string
        }
        Insert: {
          site_id?: string
          closing?: string | null
          date: string
          extra_lines?: Json
          hidden?: string[]
          kidouch?: string | null
          note?: string | null
          times?: Json
          title?: string | null
          updated_at?: string
        }
        Update: {
          site_id?: string
          closing?: string | null
          date?: string
          extra_lines?: Json
          hidden?: string[]
          kidouch?: string | null
          note?: string | null
          times?: Json
          title?: string | null
          updated_at?: string
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
      check_rate_limit: {
        Args: { p_key: string; p_max: number; p_window: string }
        Returns: boolean
      }
      event_seats_taken: { Args: { p_event_id: string }; Returns: number }
      is_admin: { Args: never; Returns: boolean }
      is_editor: { Args: never; Returns: boolean }
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

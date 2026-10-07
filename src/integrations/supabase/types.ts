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
      apps: {
        Row: {
          apk_url: string | null
          architecture: string
          changelog: string | null
          created_at: string | null
          description: string | null
          download_count: number | null
          file_size: string | null
          icon_url: string | null
          id: string
          is_latest: boolean | null
          name: string
          platform: string | null
          price: number | null
          screenshots_urls: string[] | null
          status: string | null
          system_requirements: string
          version: string | null
        }
        Insert: {
          apk_url?: string | null
          architecture?: string
          changelog?: string | null
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          file_size?: string | null
          icon_url?: string | null
          id?: string
          is_latest?: boolean | null
          name: string
          platform?: string | null
          price?: number | null
          screenshots_urls?: string[] | null
          status?: string | null
          system_requirements?: string
          version?: string | null
        }
        Update: {
          apk_url?: string | null
          architecture?: string
          changelog?: string | null
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          file_size?: string | null
          icon_url?: string | null
          id?: string
          is_latest?: boolean | null
          name?: string
          platform?: string | null
          price?: number | null
          screenshots_urls?: string[] | null
          status?: string | null
          system_requirements?: string
          version?: string | null
        }
        Relationships: []
      }
      auth_settings: {
        Row: {
          created_at: string
          email_login_enabled: boolean
          google_auth_mode: string
          google_callback_url: string | null
          google_client_id: string | null
          google_login_enabled: boolean
          id: string
          notes: string | null
          smtp_enabled: boolean
          smtp_from_email: string | null
          smtp_from_name: string | null
          smtp_host: string | null
          smtp_port: number | null
          smtp_secure: boolean
          smtp_user: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email_login_enabled?: boolean
          google_auth_mode?: string
          google_callback_url?: string | null
          google_client_id?: string | null
          google_login_enabled?: boolean
          id?: string
          notes?: string | null
          smtp_enabled?: boolean
          smtp_from_email?: string | null
          smtp_from_name?: string | null
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_secure?: boolean
          smtp_user?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email_login_enabled?: boolean
          google_auth_mode?: string
          google_callback_url?: string | null
          google_client_id?: string | null
          google_login_enabled?: boolean
          id?: string
          notes?: string | null
          smtp_enabled?: boolean
          smtp_from_email?: string | null
          smtp_from_name?: string | null
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_secure?: boolean
          smtp_user?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          audience: string
          banner_url: string | null
          body: string
          created_at: string
          created_by: string | null
          error: string | null
          failed_count: number
          id: string
          sent_at: string | null
          sent_count: number
          status: string
          tag: string | null
          target_user_id: string | null
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          audience?: string
          banner_url?: string | null
          body?: string
          created_at?: string
          created_by?: string | null
          error?: string | null
          failed_count?: number
          id?: string
          sent_at?: string | null
          sent_count?: number
          status?: string
          tag?: string | null
          target_user_id?: string | null
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          audience?: string
          banner_url?: string | null
          body?: string
          created_at?: string
          created_by?: string | null
          error?: string | null
          failed_count?: number
          id?: string
          sent_at?: string | null
          sent_count?: number
          status?: string
          tag?: string | null
          target_user_id?: string | null
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          duration_seconds: number
          id: string
          path: string
          session_id: string
          title: string | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number
          id?: string
          path: string
          session_id: string
          title?: string | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          id?: string
          path?: string
          session_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_views_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "visitor_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      project_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string
          rating: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          project_id: string
          rating?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          rating?: number | null
          user_id?: string
        }
        Relationships: []
      }
      project_likes: {
        Row: {
          created_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: []
      }
      project_versions: {
        Row: {
          app_file_url: string | null
          changelog: string | null
          created_at: string
          discount_price: number | null
          external_url_enabled: boolean
          file_size: string | null
          full_desc: string | null
          id: string
          is_latest: boolean
          notes: string | null
          preview_url: string | null
          price: number | null
          project_id: string
          released_at: string
          screenshots: string[]
          seo_description: string | null
          seo_title: string | null
          short_desc: string | null
          source_code_url: string | null
          thumbnail_url: string | null
          updated_at: string
          version: string
          video_url: string | null
        }
        Insert: {
          app_file_url?: string | null
          changelog?: string | null
          created_at?: string
          discount_price?: number | null
          external_url_enabled?: boolean
          file_size?: string | null
          full_desc?: string | null
          id?: string
          is_latest?: boolean
          notes?: string | null
          preview_url?: string | null
          price?: number | null
          project_id: string
          released_at?: string
          screenshots?: string[]
          seo_description?: string | null
          seo_title?: string | null
          short_desc?: string | null
          source_code_url?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          version: string
          video_url?: string | null
        }
        Update: {
          app_file_url?: string | null
          changelog?: string | null
          created_at?: string
          discount_price?: number | null
          external_url_enabled?: boolean
          file_size?: string | null
          full_desc?: string | null
          id?: string
          is_latest?: boolean
          notes?: string | null
          preview_url?: string | null
          price?: number | null
          project_id?: string
          released_at?: string
          screenshots?: string[]
          seo_description?: string | null
          seo_title?: string | null
          short_desc?: string | null
          source_code_url?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          version?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          category: string[]
          changelog: Json | null
          created_at: string
          demo_admin_email: string | null
          demo_admin_password: string | null
          discount_price: number | null
          external_url_enabled: boolean
          featured: boolean
          full_desc: string
          id: string
          likes_count: number | null
          lov_email: string | null
          noindex: boolean
          og_image_url: string | null
          preview_enabled: boolean
          preview_url: string | null
          preview_watermark: string | null
          price: number
          project_type: string
          project_url: string | null
          screenshots: string[]
          screenshots_urls: string[] | null
          seo_description: string | null
          seo_keywords: string[]
          seo_title: string | null
          short_desc: string
          slug: string | null
          source_code_url: string | null
          status: string
          tech_stack: string[]
          thumbnail_url: string | null
          title: string
          version: string | null
          video_url: string | null
          views_count: number | null
        }
        Insert: {
          category?: string[]
          changelog?: Json | null
          created_at?: string
          demo_admin_email?: string | null
          demo_admin_password?: string | null
          discount_price?: number | null
          external_url_enabled?: boolean
          featured?: boolean
          full_desc?: string
          id?: string
          likes_count?: number | null
          lov_email?: string | null
          noindex?: boolean
          og_image_url?: string | null
          preview_enabled?: boolean
          preview_url?: string | null
          preview_watermark?: string | null
          price?: number
          project_type?: string
          project_url?: string | null
          screenshots?: string[]
          screenshots_urls?: string[] | null
          seo_description?: string | null
          seo_keywords?: string[]
          seo_title?: string | null
          short_desc?: string
          slug?: string | null
          source_code_url?: string | null
          status?: string
          tech_stack?: string[]
          thumbnail_url?: string | null
          title: string
          version?: string | null
          video_url?: string | null
          views_count?: number | null
        }
        Update: {
          category?: string[]
          changelog?: Json | null
          created_at?: string
          demo_admin_email?: string | null
          demo_admin_password?: string | null
          discount_price?: number | null
          external_url_enabled?: boolean
          featured?: boolean
          full_desc?: string
          id?: string
          likes_count?: number | null
          lov_email?: string | null
          noindex?: boolean
          og_image_url?: string | null
          preview_enabled?: boolean
          preview_url?: string | null
          preview_watermark?: string | null
          price?: number
          project_type?: string
          project_url?: string | null
          screenshots?: string[]
          screenshots_urls?: string[] | null
          seo_description?: string | null
          seo_keywords?: string[]
          seo_title?: string | null
          short_desc?: string
          slug?: string | null
          source_code_url?: string | null
          status?: string
          tech_stack?: string[]
          thumbnail_url?: string | null
          title?: string
          version?: string | null
          video_url?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number
          created_at: string
          id: string
          project_id: string
          razorpay_payment_id: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          project_id: string
          razorpay_payment_id?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          project_id?: string
          razorpay_payment_id?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscribers: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          platform: string | null
          token: string
          updated_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          platform?: string | null
          token: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          platform?: string | null
          token?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          address: string | null
          ai_section_enabled: boolean
          ai_system_prompt: string | null
          banner_url: string | null
          bing_site_verification: string | null
          brand_name: string | null
          brand_tagline: string | null
          elevenlabs_agent_id: string | null
          ga_measurement_id: string | null
          google_auth_mode: string
          google_client_id: string | null
          google_redirect_uri: string | null
          google_site_verification: string | null
          google_verify_file_content: string | null
          google_verify_file_name: string | null
          gtm_id: string | null
          hero_badge: string | null
          hero_bg_url: string | null
          hero_lottie_url: string | null
          hero_video_url: string | null
          hide_watermarks: boolean
          id: string
          logo_url: string | null
          phone: string | null
          refund_policy: string | null
          site_url: string | null
          social_github: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_twitter: string | null
          social_youtube: string | null
          support_email: string | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          address?: string | null
          ai_section_enabled?: boolean
          ai_system_prompt?: string | null
          banner_url?: string | null
          bing_site_verification?: string | null
          brand_name?: string | null
          brand_tagline?: string | null
          elevenlabs_agent_id?: string | null
          ga_measurement_id?: string | null
          google_auth_mode?: string
          google_client_id?: string | null
          google_redirect_uri?: string | null
          google_site_verification?: string | null
          google_verify_file_content?: string | null
          google_verify_file_name?: string | null
          gtm_id?: string | null
          hero_badge?: string | null
          hero_bg_url?: string | null
          hero_lottie_url?: string | null
          hero_video_url?: string | null
          hide_watermarks?: boolean
          id?: string
          logo_url?: string | null
          phone?: string | null
          refund_policy?: string | null
          site_url?: string | null
          social_github?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          social_youtube?: string | null
          support_email?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          address?: string | null
          ai_section_enabled?: boolean
          ai_system_prompt?: string | null
          banner_url?: string | null
          bing_site_verification?: string | null
          brand_name?: string | null
          brand_tagline?: string | null
          elevenlabs_agent_id?: string | null
          ga_measurement_id?: string | null
          google_auth_mode?: string
          google_client_id?: string | null
          google_redirect_uri?: string | null
          google_site_verification?: string | null
          google_verify_file_content?: string | null
          google_verify_file_name?: string | null
          gtm_id?: string | null
          hero_badge?: string | null
          hero_bg_url?: string | null
          hero_lottie_url?: string | null
          hero_video_url?: string | null
          hide_watermarks?: boolean
          id?: string
          logo_url?: string | null
          phone?: string | null
          refund_policy?: string | null
          site_url?: string | null
          social_github?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          social_youtube?: string | null
          support_email?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          expertise: string
          github_url: string
          id: string
          image_url: string
          instagram_url: string
          linkedin_url: string
          name: string
          published: boolean
          sort_order: number
          website_url: string
          x_url: string
        }
        Insert: {
          created_at?: string
          expertise?: string
          github_url?: string
          id?: string
          image_url?: string
          instagram_url?: string
          linkedin_url?: string
          name?: string
          published?: boolean
          sort_order?: number
          website_url?: string
          x_url?: string
        }
        Update: {
          created_at?: string
          expertise?: string
          github_url?: string
          id?: string
          image_url?: string
          instagram_url?: string
          linkedin_url?: string
          name?: string
          published?: boolean
          sort_order?: number
          website_url?: string
          x_url?: string
        }
        Relationships: []
      }
      truecaller_settings: {
        Row: {
          app_domain: string
          callback_url: string
          id: boolean
          updated_at: string
        }
        Insert: {
          app_domain?: string
          callback_url?: string
          id?: boolean
          updated_at?: string
        }
        Update: {
          app_domain?: string
          callback_url?: string
          id?: boolean
          updated_at?: string
        }
        Relationships: []
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
          role?: Database["public"]["Enums"]["app_role"]
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
      visitor_sessions: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          device_name: string | null
          device_type: string | null
          first_seen: string
          id: string
          ip: string | null
          isp: string | null
          landing_page: string | null
          language: string | null
          last_page: string | null
          last_seen: string
          latitude: number | null
          longitude: number | null
          os: string | null
          page_views: number
          postal: string | null
          referrer: string | null
          region: string | null
          screen: string | null
          timezone: string | null
          total_seconds: number
          user_agent: string | null
          user_id: string | null
          visitor_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          device_name?: string | null
          device_type?: string | null
          first_seen?: string
          id?: string
          ip?: string | null
          isp?: string | null
          landing_page?: string | null
          language?: string | null
          last_page?: string | null
          last_seen?: string
          latitude?: number | null
          longitude?: number | null
          os?: string | null
          page_views?: number
          postal?: string | null
          referrer?: string | null
          region?: string | null
          screen?: string | null
          timezone?: string | null
          total_seconds?: number
          user_agent?: string | null
          user_id?: string | null
          visitor_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          device_name?: string | null
          device_type?: string | null
          first_seen?: string
          id?: string
          ip?: string | null
          isp?: string | null
          landing_page?: string | null
          language?: string | null
          last_page?: string | null
          last_seen?: string
          latitude?: number | null
          longitude?: number | null
          os?: string | null
          page_views?: number
          postal?: string | null
          referrer?: string | null
          region?: string | null
          screen?: string | null
          timezone?: string | null
          total_seconds?: number
          user_agent?: string | null
          user_id?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
      increment_project_views: {
        Args: { _project_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const

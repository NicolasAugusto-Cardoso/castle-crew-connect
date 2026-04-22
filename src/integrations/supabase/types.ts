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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      basket_models: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          price: number
          title: string
          type: Database["public"]["Enums"]["basket_type"]
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          price: number
          title: string
          type: Database["public"]["Enums"]["basket_type"]
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          price?: number
          title?: string
          type?: Database["public"]["Enums"]["basket_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      bible_chapter_cache: {
        Row: {
          book_abbrev: string
          chapter: number
          fetched_at: string
          id: string
          language: string | null
          provider: string
          verses: Json
          version: string
        }
        Insert: {
          book_abbrev: string
          chapter: number
          fetched_at?: string
          id?: string
          language?: string | null
          provider: string
          verses: Json
          version: string
        }
        Update: {
          book_abbrev?: string
          chapter?: number
          fetched_at?: string
          id?: string
          language?: string | null
          provider?: string
          verses?: Json
          version?: string
        }
        Relationships: []
      }
      bible_focus_marks: {
        Row: {
          book_abbrev: string
          chapter: number
          created_at: string | null
          id: string
          user_id: string
          verse: number
          version: string
        }
        Insert: {
          book_abbrev: string
          chapter: number
          created_at?: string | null
          id?: string
          user_id: string
          verse: number
          version: string
        }
        Update: {
          book_abbrev?: string
          chapter?: number
          created_at?: string | null
          id?: string
          user_id?: string
          verse?: number
          version?: string
        }
        Relationships: []
      }
      bible_highlights: {
        Row: {
          book_abbrev: string
          chapter: number
          color: string
          created_at: string | null
          end_offset: number
          highlighted_text: string | null
          id: string
          start_offset: number
          user_id: string
          verse: number
          version: string
        }
        Insert: {
          book_abbrev: string
          chapter: number
          color: string
          created_at?: string | null
          end_offset: number
          highlighted_text?: string | null
          id?: string
          start_offset: number
          user_id: string
          verse: number
          version: string
        }
        Update: {
          book_abbrev?: string
          chapter?: number
          color?: string
          created_at?: string | null
          end_offset?: number
          highlighted_text?: string | null
          id?: string
          start_offset?: number
          user_id?: string
          verse?: number
          version?: string
        }
        Relationships: []
      }
      bible_notes: {
        Row: {
          background_color: string | null
          book_abbrev: string
          chapter: number
          content_json: Json
          created_at: string | null
          id: string
          text_color: string | null
          updated_at: string | null
          user_id: string
          verse: number
          version: string
        }
        Insert: {
          background_color?: string | null
          book_abbrev: string
          chapter: number
          content_json: Json
          created_at?: string | null
          id?: string
          text_color?: string | null
          updated_at?: string | null
          user_id: string
          verse: number
          version: string
        }
        Update: {
          background_color?: string | null
          book_abbrev?: string
          chapter?: number
          content_json?: Json
          created_at?: string | null
          id?: string
          text_color?: string | null
          updated_at?: string | null
          user_id?: string
          verse?: number
          version?: string
        }
        Relationships: []
      }
      collaborator_profiles: {
        Row: {
          accepting_new: boolean | null
          age: number | null
          bio: string | null
          church: string | null
          city: string | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          neighborhood: string | null
          position: string | null
          postal_code: string | null
          region: string | null
          state: string | null
          street: string | null
          street_number: string | null
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          accepting_new?: boolean | null
          age?: number | null
          bio?: string | null
          church?: string | null
          city?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          position?: string | null
          postal_code?: string | null
          region?: string | null
          state?: string | null
          street?: string | null
          street_number?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          accepting_new?: boolean | null
          age?: number | null
          bio?: string | null
          church?: string | null
          city?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          position?: string | null
          postal_code?: string | null
          region?: string | null
          state?: string | null
          street?: string | null
          street_number?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          collaborator_id: string | null
          created_at: string
          email: string | null
          id: string
          message: string
          name: string
          phone: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          collaborator_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message: string
          name: string
          phone: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          collaborator_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          name?: string
          phone?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          is_edited: boolean
          is_read: boolean
          message_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_edited?: boolean
          is_read?: boolean
          message_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_edited?: boolean
          is_read?: boolean
          message_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_replies_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "contact_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      discipleship_contacts: {
        Row: {
          age: number | null
          assigned_at: string | null
          assigned_by: string | null
          assigned_collaborator_id: string | null
          city: string | null
          created_at: string
          distance_km: number | null
          email: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          neighborhood: string | null
          phone: string
          postal_code: string | null
          registered_by: string
          state: string | null
          status: string
          street: string | null
          street_number: string | null
          updated_at: string
        }
        Insert: {
          age?: number | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_collaborator_id?: string | null
          city?: string | null
          created_at?: string
          distance_km?: number | null
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          neighborhood?: string | null
          phone: string
          postal_code?: string | null
          registered_by: string
          state?: string | null
          status?: string
          street?: string | null
          street_number?: string | null
          updated_at?: string
        }
        Update: {
          age?: number | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_collaborator_id?: string | null
          city?: string | null
          created_at?: string
          distance_km?: number | null
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          neighborhood?: string | null
          phone?: string
          postal_code?: string | null
          registered_by?: string
          state?: string | null
          status?: string
          street?: string | null
          street_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      donation_campaigns: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          end_date: string | null
          goal_amount: number | null
          goal_baskets: number | null
          id: string
          start_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          goal_amount?: number | null
          goal_baskets?: number | null
          id?: string
          start_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          goal_amount?: number | null
          goal_baskets?: number | null
          id?: string
          start_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      donation_payment_audit: {
        Row: {
          changed_by: string | null
          created_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          payment_id: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          payment_id?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donation_payment_audit_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "donation_payment_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_payment_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          pix_key: string
          pix_key_type: string
          qr_code_url: string | null
          receiver_name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          pix_key: string
          pix_key_type: string
          qr_code_url?: string | null
          receiver_name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          pix_key?: string
          pix_key_type?: string
          qr_code_url?: string | null
          receiver_name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          anonymous: boolean | null
          basket_type: Database["public"]["Enums"]["basket_type"]
          campaign_id: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          donor_name: string | null
          id: string
          receipt_url: string | null
          reference_code: string
          status: Database["public"]["Enums"]["donation_status"] | null
          user_id: string | null
        }
        Insert: {
          amount: number
          anonymous?: boolean | null
          basket_type: Database["public"]["Enums"]["basket_type"]
          campaign_id?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          donor_name?: string | null
          id?: string
          receipt_url?: string | null
          reference_code: string
          status?: Database["public"]["Enums"]["donation_status"] | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          anonymous?: boolean | null
          basket_type?: Database["public"]["Enums"]["basket_type"]
          campaign_id?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          donor_name?: string | null
          id?: string
          receipt_url?: string | null
          reference_code?: string
          status?: Database["public"]["Enums"]["donation_status"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "donation_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          checked_in: boolean | null
          checked_in_at: string | null
          checked_in_by: string | null
          event_id: string
          id: string
          registered_at: string | null
          user_id: string
        }
        Insert: {
          checked_in?: boolean | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          event_id: string
          id?: string
          registered_at?: string | null
          user_id: string
        }
        Update: {
          checked_in?: boolean | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          event_id?: string
          id?: string
          registered_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reminders: {
        Row: {
          event_id: string
          id: string
          reminder_time: string
          sent: boolean | null
          sent_at: string | null
        }
        Insert: {
          event_id: string
          id?: string
          reminder_time: string
          sent?: boolean | null
          sent_at?: string | null
        }
        Update: {
          event_id?: string
          id?: string
          reminder_time?: string
          sent?: boolean | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_reminders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          created_by: string
          description: string | null
          end_date: string | null
          event_date: string
          id: string
          is_active: boolean | null
          location: string | null
          max_participants: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          end_date?: string | null
          event_date: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          max_participants?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_date?: string | null
          event_date?: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          max_participants?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      gallery_folders: {
        Row: {
          cover_url: string | null
          created_at: string
          created_by: string
          description: string | null
          event_date: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          event_date?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          event_date?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery_media: {
        Row: {
          created_at: string
          created_by: string
          folder_id: string
          id: string
          type: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by: string
          folder_id: string
          id?: string
          type: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string
          folder_id?: string
          id?: string
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_media_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "gallery_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      media_projects: {
        Row: {
          created_at: string
          id: string
          output_url: string | null
          project_data: Json
          source_url: string | null
          task_id: string | null
          thumbnail_url: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          output_url?: string | null
          project_data?: Json
          source_url?: string | null
          task_id?: string | null
          thumbnail_url?: string | null
          title?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          output_url?: string | null
          project_data?: Json
          source_url?: string | null
          task_id?: string | null
          thumbnail_url?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_projects_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "social_media_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          post_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          post_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_images_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          emoji_type: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji_type: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji_type?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string | null
          id: string
          platform: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      social_media_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          due_date: string | null
          id: string
          instructions: string | null
          reference_urls: Json
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          due_date?: string | null
          id?: string
          instructions?: string | null
          reference_urls?: Json
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          due_date?: string | null
          id?: string
          instructions?: string | null
          reference_urls?: Json
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author_name: string | null
          content: string
          created_at: string
          created_by: string
          id: string
          published_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          content: string
          created_at?: string
          created_by: string
          id?: string
          published_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          published_at?: string | null
          status?: string
          title?: string
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
      verse_of_the_day: {
        Row: {
          created_at: string
          date: string
          id: string
          reference: string
          text: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          reference: string
          text: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          reference?: string
          text?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_distance: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      find_nearest_collaborator: {
        Args: { p_city: string; p_neighborhood: string }
        Returns: string
      }
      find_nearest_collaborator_geo: {
        Args: {
          p_city?: string
          p_latitude: number
          p_longitude: number
          p_neighborhood?: string
        }
        Returns: {
          collaborator_id: string
          distance_km: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "social_media" | "collaborator" | "user" | "volunteer"
      basket_type: "P" | "M" | "G"
      donation_status: "pending" | "reviewing" | "confirmed" | "rejected"
      task_status: "pending" | "in_production" | "completed"
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
      app_role: ["admin", "social_media", "collaborator", "user", "volunteer"],
      basket_type: ["P", "M", "G"],
      donation_status: ["pending", "reviewing", "confirmed", "rejected"],
      task_status: ["pending", "in_production", "completed"],
    },
  },
} as const

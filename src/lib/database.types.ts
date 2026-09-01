/**
 * AUTO-GENERATED — DO NOT EDIT BY HAND. Run `npm run db:types`.
 *
 * Enforceable cross-repo contract: both fethi-web and fethi-mobile tsc against this
 * shape. When it changes, the SAME PR must vendor it into
 * fethi-mobile/src/shared/types/database.types.ts and update docs/MOBILE-SYNC-NOTES.md
 * + supabase/applied-scrs.json (see docs/db/COORDINATION.md §2/§5).
 *
 * schema-version: d80ee108aad2
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      app_entitlements: {
        Row: {
          created_at: string
          entitlement_key: string
          event_ts: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          latest_transaction_id: string | null
          metadata: Json | null
          period_type: string | null
          platform: string | null
          product_id: string | null
          store: string | null
          updated_at: string
          user_id: string
          will_renew: boolean | null
        }
        Insert: {
          created_at?: string
          entitlement_key: string
          event_ts?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          latest_transaction_id?: string | null
          metadata?: Json | null
          period_type?: string | null
          platform?: string | null
          product_id?: string | null
          store?: string | null
          updated_at?: string
          user_id: string
          will_renew?: boolean | null
        }
        Update: {
          created_at?: string
          entitlement_key?: string
          event_ts?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          latest_transaction_id?: string | null
          metadata?: Json | null
          period_type?: string | null
          platform?: string | null
          product_id?: string | null
          store?: string | null
          updated_at?: string
          user_id?: string
          will_renew?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "app_entitlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_entitlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_store_transactions: {
        Row: {
          created_at: string
          currency: string | null
          entitlement_key: string | null
          environment: string | null
          event_type: string | null
          expires_at: string | null
          id: string
          platform: string
          price_cents: number | null
          product_id: string | null
          purchased_at: string | null
          raw: Json | null
          store: string | null
          transaction_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          entitlement_key?: string | null
          environment?: string | null
          event_type?: string | null
          expires_at?: string | null
          id?: string
          platform: string
          price_cents?: number | null
          product_id?: string | null
          purchased_at?: string | null
          raw?: Json | null
          store?: string | null
          transaction_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          entitlement_key?: string | null
          environment?: string | null
          event_type?: string | null
          expires_at?: string | null
          id?: string
          platform?: string
          price_cents?: number | null
          product_id?: string | null
          purchased_at?: string | null
          raw?: Json | null
          store?: string | null
          transaction_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_store_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_store_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_users_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          glyph: string | null
          id: string
          label: string
          parent_id: string | null
          slug: string
          sort_order: number
          subtitle: string | null
          type: Database["public"]["Enums"]["listing_type"]
        }
        Insert: {
          created_at?: string
          glyph?: string | null
          id?: string
          label: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          subtitle?: string | null
          type: Database["public"]["Enums"]["listing_type"]
        }
        Update: {
          created_at?: string
          glyph?: string | null
          id?: string
          label?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          subtitle?: string | null
          type?: Database["public"]["Enums"]["listing_type"]
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      device_push_tokens: {
        Row: {
          created_at: string
          id: string
          last_used_at: string | null
          platform: string | null
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_used_at?: string | null
          platform?: string | null
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_used_at?: string | null
          platform?: string | null
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      didit_webhook_events: {
        Row: {
          created_at: string
          error: string | null
          event_id: string | null
          id: string
          processed: boolean
          raw_body: string
          session_id: string | null
          signature_method: string | null
          signature_valid: boolean
          status: string | null
          webhook_type: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_id?: string | null
          id?: string
          processed?: boolean
          raw_body: string
          session_id?: string | null
          signature_method?: string | null
          signature_valid: boolean
          status?: string | null
          webhook_type?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          event_id?: string | null
          id?: string
          processed?: boolean
          raw_body?: string
          session_id?: string | null
          signature_method?: string | null
          signature_valid?: boolean
          status?: string | null
          webhook_type?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      held_seller_proceeds: {
        Row: {
          buyer_confirmed_at: string | null
          created_at: string
          gross_cents: number
          id: string
          order_id: string
          platform_fee_cents: number
          release_after: string | null
          released_at: string | null
          review_after: string
          seller_id: string
          seller_net_cents: number
          settled_receivable_cents: number
          status: Database["public"]["Enums"]["proceeds_hold_status"]
          stripe_charge_id: string
          stripe_transfer_id: string | null
          terminal_reason: string | null
          updated_at: string
        }
        Insert: {
          buyer_confirmed_at?: string | null
          created_at?: string
          gross_cents: number
          id?: string
          order_id: string
          platform_fee_cents: number
          release_after?: string | null
          released_at?: string | null
          review_after?: string
          seller_id: string
          seller_net_cents: number
          settled_receivable_cents?: number
          status?: Database["public"]["Enums"]["proceeds_hold_status"]
          stripe_charge_id: string
          stripe_transfer_id?: string | null
          terminal_reason?: string | null
          updated_at?: string
        }
        Update: {
          buyer_confirmed_at?: string | null
          created_at?: string
          gross_cents?: number
          id?: string
          order_id?: string
          platform_fee_cents?: number
          release_after?: string | null
          released_at?: string | null
          review_after?: string
          seller_id?: string
          seller_net_cents?: number
          settled_receivable_cents?: number
          status?: Database["public"]["Enums"]["proceeds_hold_status"]
          stripe_charge_id?: string
          stripe_transfer_id?: string | null
          terminal_reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "held_seller_proceeds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "held_seller_proceeds_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "held_seller_proceeds_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      idempotency_keys: {
        Row: {
          created_at: string
          key: string
          response: Json | null
          scope: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          key: string
          response?: Json | null
          scope: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          key?: string
          response?: Json | null
          scope?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "idempotency_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idempotency_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_photos: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_photos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_publication_notifications: {
        Row: {
          created_at: string
          listing_id: string
          notification_id: string
        }
        Insert: {
          created_at?: string
          listing_id: string
          notification_id: string
        }
        Update: {
          created_at?: string
          listing_id?: string
          notification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_publication_notifications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_publication_notifications_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          category_id: string | null
          condition: Database["public"]["Enums"]["listing_condition"] | null
          created_at: string
          deposit_cents: number | null
          description: string | null
          favorites_count: number
          flat_rate_cents: number | null
          hourly_rate_cents: number | null
          id: string
          lat: number | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          lng: number | null
          location: unknown
          meeting_venue: string | null
          neighborhood: string | null
          owner_id: string
          price_cents: number | null
          price_per_day_cents: number | null
          price_per_week_cents: number | null
          publication_request_id: string | null
          service_radius_km: number | null
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          category_id?: string | null
          condition?: Database["public"]["Enums"]["listing_condition"] | null
          created_at?: string
          deposit_cents?: number | null
          description?: string | null
          favorites_count?: number
          flat_rate_cents?: number | null
          hourly_rate_cents?: number | null
          id?: string
          lat?: number | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          lng?: number | null
          location?: unknown
          meeting_venue?: string | null
          neighborhood?: string | null
          owner_id: string
          price_cents?: number | null
          price_per_day_cents?: number | null
          price_per_week_cents?: number | null
          publication_request_id?: string | null
          service_radius_km?: number | null
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          category_id?: string | null
          condition?: Database["public"]["Enums"]["listing_condition"] | null
          created_at?: string
          deposit_cents?: number | null
          description?: string | null
          favorites_count?: number
          flat_rate_cents?: number | null
          hourly_rate_cents?: number | null
          id?: string
          lat?: number | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          lng?: number | null
          location?: unknown
          meeting_venue?: string | null
          neighborhood?: string | null
          owner_id?: string
          price_cents?: number | null
          price_per_day_cents?: number | null
          price_per_week_cents?: number | null
          publication_request_id?: string | null
          service_radius_km?: number | null
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_attachments: {
        Row: {
          byte_size: number | null
          content_type: string | null
          created_at: string
          height: number | null
          id: string
          message_id: string
          storage_path: string
          width: number | null
        }
        Insert: {
          byte_size?: number | null
          content_type?: string | null
          created_at?: string
          height?: number | null
          id?: string
          message_id: string
          storage_path: string
          width?: number | null
        }
        Update: {
          byte_size?: number | null
          content_type?: string | null
          created_at?: string
          height?: number | null
          id?: string
          message_id?: string
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          kind: Database["public"]["Enums"]["message_kind"]
          metadata: Json | null
          sender_id: string
          text: string | null
          thread_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          kind?: Database["public"]["Enums"]["message_kind"]
          metadata?: Json | null
          sender_id: string
          text?: string | null
          thread_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          kind?: Database["public"]["Enums"]["message_kind"]
          metadata?: Json | null
          sender_id?: string
          text?: string | null
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          href: string | null
          id: string
          kind: Database["public"]["Enums"]["notif_kind"]
          read_at: string | null
          title: string
          unread: boolean | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          kind: Database["public"]["Enums"]["notif_kind"]
          read_at?: string | null
          title: string
          unread?: boolean | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["notif_kind"]
          read_at?: string | null
          title?: string
          unread?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          amount_cents: number
          buyer_id: string
          checkout_expires_at: string | null
          created_at: string
          expires_at: string
          id: string
          listing_id: string
          message: string | null
          order_id: string | null
          responded_at: string | null
          response_message: string | null
          seller_id: string
          status: Database["public"]["Enums"]["offer_status"]
          updated_at: string
        }
        Insert: {
          amount_cents: number
          buyer_id: string
          checkout_expires_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          listing_id: string
          message?: string | null
          order_id?: string | null
          responded_at?: string | null
          response_message?: string | null
          seller_id: string
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          buyer_id?: string
          checkout_expires_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          listing_id?: string
          message?: string | null
          order_id?: string | null
          responded_at?: string | null
          response_message?: string | null
          seller_id?: string
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_events: {
        Row: {
          actor_id: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["order_status"] | null
          id: string
          metadata: Json | null
          note: string | null
          order_id: string
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: string
          metadata?: Json | null
          note?: string | null
          order_id: string
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: string
          metadata?: Json | null
          note?: string | null
          order_id?: string
          to_status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_cents: number
          buyer_confirmed: boolean
          buyer_fee_cents: number
          buyer_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          completed_at: string | null
          created_at: string
          deposit_cents: number | null
          deposit_released: boolean | null
          fee_cents: number
          id: string
          item_cents: number
          listing_id: string
          listing_thumb: string | null
          listing_title: string | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          offer_id: string | null
          paid_at: string | null
          payment_intent_id: string | null
          payment_method: string
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          pricing_version: string
          rental_end: string | null
          rental_start: string | null
          seller_confirmed: boolean
          seller_fee_cents: number
          seller_id: string
          status: Database["public"]["Enums"]["order_status"]
          tax_cents: number
          updated_at: string
        }
        Insert: {
          amount_cents: number
          buyer_confirmed?: boolean
          buyer_fee_cents?: number
          buyer_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          created_at?: string
          deposit_cents?: number | null
          deposit_released?: boolean | null
          fee_cents?: number
          id?: string
          item_cents?: number
          listing_id: string
          listing_thumb?: string | null
          listing_title?: string | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          offer_id?: string | null
          paid_at?: string | null
          payment_intent_id?: string | null
          payment_method?: string
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          pricing_version?: string
          rental_end?: string | null
          rental_start?: string | null
          seller_confirmed?: boolean
          seller_fee_cents?: number
          seller_id: string
          status?: Database["public"]["Enums"]["order_status"]
          tax_cents?: number
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          buyer_confirmed?: boolean
          buyer_fee_cents?: number
          buyer_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          created_at?: string
          deposit_cents?: number | null
          deposit_released?: boolean | null
          fee_cents?: number
          id?: string
          item_cents?: number
          listing_id?: string
          listing_thumb?: string | null
          listing_title?: string | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          offer_id?: string | null
          paid_at?: string | null
          payment_intent_id?: string | null
          payment_method?: string
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          pricing_version?: string
          rental_end?: string | null
          rental_start?: string | null
          seller_confirmed?: boolean
          seller_fee_cents?: number
          seller_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          tax_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          metadata: Json | null
          order_id: string
          status: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          metadata?: Json | null
          order_id: string
          status: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          order_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_accounts: {
        Row: {
          created_at: string
          details_submitted: boolean
          id: string
          metadata: Json | null
          onboarding_status: string
          payouts_enabled: boolean
          stripe_account_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details_submitted?: boolean
          id?: string
          metadata?: Json | null
          onboarding_status: string
          payouts_enabled?: boolean
          stripe_account_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          details_submitted?: boolean
          id?: string
          metadata?: Json | null
          onboarding_status?: string
          payouts_enabled?: boolean
          stripe_account_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_label: string | null
          age: number | null
          avatar_path: string | null
          bio: string | null
          city: string | null
          created_at: string
          deleted_at: string | null
          display_name: string | null
          gmv_cents: number
          id: string
          kyc_decision: Json | null
          kyc_session_id: string | null
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          kyc_tier: number
          lat: number | null
          listings_count: number
          lng: number | null
          location: unknown
          neighborhood: string | null
          profession: string | null
          rating: number | null
          reviews_count: number
          sales_count: number
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          address_label?: string | null
          age?: number | null
          avatar_path?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          gmv_cents?: number
          id: string
          kyc_decision?: Json | null
          kyc_session_id?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          kyc_tier?: number
          lat?: number | null
          listings_count?: number
          lng?: number | null
          location?: unknown
          neighborhood?: string | null
          profession?: string | null
          rating?: number | null
          reviews_count?: number
          sales_count?: number
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          address_label?: string | null
          age?: number | null
          avatar_path?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          gmv_cents?: number
          id?: string
          kyc_decision?: Json | null
          kyc_session_id?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          kyc_tier?: number
          lat?: number | null
          listings_count?: number
          lng?: number | null
          location?: unknown
          neighborhood?: string | null
          profession?: string | null
          rating?: number | null
          reviews_count?: number
          sales_count?: number
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: []
      }
      rate_limit_hits: {
        Row: {
          hit_count: number
          scope: string
          user_id: string
          window_start: string
        }
        Insert: {
          hit_count?: number
          scope: string
          user_id: string
          window_start: string
        }
        Update: {
          hit_count?: number
          scope?: string
          user_id?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_limit_hits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_limit_hits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_id: string
          comment: string | null
          created_at: string
          id: string
          order_id: string
          rating: number
          target_user_id: string
        }
        Insert: {
          author_id: string
          comment?: string | null
          created_at?: string
          id?: string
          order_id: string
          rating: number
          target_user_id: string
        }
        Update: {
          author_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          order_id?: string
          rating?: number
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          alerts_enabled: boolean
          category_id: string | null
          center: unknown
          center_lat: number | null
          center_lng: number | null
          condition: Database["public"]["Enums"]["listing_condition"] | null
          created_at: string
          id: string
          listing_type: Database["public"]["Enums"]["listing_type"] | null
          max_price_cents: number | null
          min_price_cents: number | null
          name: string
          query: string | null
          radius_meters: number | null
          user_id: string
        }
        Insert: {
          alerts_enabled?: boolean
          category_id?: string | null
          center?: unknown
          center_lat?: number | null
          center_lng?: number | null
          condition?: Database["public"]["Enums"]["listing_condition"] | null
          created_at?: string
          id?: string
          listing_type?: Database["public"]["Enums"]["listing_type"] | null
          max_price_cents?: number | null
          min_price_cents?: number | null
          name: string
          query?: string | null
          radius_meters?: number | null
          user_id: string
        }
        Update: {
          alerts_enabled?: boolean
          category_id?: string | null
          center?: unknown
          center_lat?: number | null
          center_lng?: number | null
          condition?: Database["public"]["Enums"]["listing_condition"] | null
          created_at?: string
          id?: string
          listing_type?: Database["public"]["Enums"]["listing_type"] | null
          max_price_cents?: number | null
          min_price_cents?: number | null
          name?: string
          query?: string | null
          radius_meters?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_searches_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_fee_receivables: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          order_id: string
          reason: string
          seller_id: string
          settled_at: string | null
          settled_via: string | null
          status: Database["public"]["Enums"]["fee_receivable_status"]
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          order_id: string
          reason: string
          seller_id: string
          settled_at?: string | null
          settled_via?: string | null
          status?: Database["public"]["Enums"]["fee_receivable_status"]
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          order_id?: string
          reason?: string
          seller_id?: string
          settled_at?: string | null
          settled_via?: string | null
          status?: Database["public"]["Enums"]["fee_receivable_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_fee_receivables_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_fee_receivables_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_fee_receivables_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      staff_audit_log: {
        Row: {
          action: string
          actor_id: string
          after: Json | null
          before: Json | null
          created_at: string
          id: string
          reason: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          actor_id: string
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          reason?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          reason?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      staff_members: {
        Row: {
          created_at: string
          roles: Database["public"]["Enums"]["staff_role"][]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          roles?: Database["public"]["Enums"]["staff_role"][]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          roles?: Database["public"]["Enums"]["staff_role"][]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_ticket_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender_id: string
          sender_role: Database["public"]["Enums"]["support_sender_role"]
          ticket_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender_id: string
          sender_role: Database["public"]["Enums"]["support_sender_role"]
          ticket_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender_id?: string
          sender_role?: Database["public"]["Enums"]["support_sender_role"]
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_staff_id: string | null
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string | null
          last_sender_role:
            | Database["public"]["Enums"]["support_sender_role"]
            | null
          status: Database["public"]["Enums"]["support_ticket_status"]
          subject: string
          unread_by_staff: number
          unread_by_user: number
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_staff_id?: string | null
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          last_sender_role?:
            | Database["public"]["Enums"]["support_sender_role"]
            | null
          status?: Database["public"]["Enums"]["support_ticket_status"]
          subject: string
          unread_by_staff?: number
          unread_by_user?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_staff_id?: string | null
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          last_sender_role?:
            | Database["public"]["Enums"]["support_sender_role"]
            | null
          status?: Database["public"]["Enums"]["support_ticket_status"]
          subject?: string
          unread_by_staff?: number
          unread_by_user?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          buyer_id: string
          buyer_unread: number
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string | null
          last_sender_id: string | null
          listing_id: string
          seller_id: string
          seller_unread: number
          updated_at: string
        }
        Insert: {
          buyer_id: string
          buyer_unread?: number
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          last_sender_id?: string | null
          listing_id: string
          seller_id: string
          seller_unread?: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          buyer_unread?: number
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          last_sender_id?: string | null
          listing_id?: string
          seller_id?: string
          seller_unread?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "threads_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_last_sender_id_fkey"
            columns: ["last_sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_last_sender_id_fkey"
            columns: ["last_sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          referral_code: string | null
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          referral_code?: string | null
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          referral_code?: string | null
          source?: string
        }
        Relationships: []
      }
      webhook_deduplication: {
        Row: {
          id: string
          processed_at: string
          stripe_event_id: string
        }
        Insert: {
          id?: string
          processed_at?: string
          stripe_event_id: string
        }
        Update: {
          id?: string
          processed_at?: string
          stripe_event_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          age: number | null
          avatar_path: string | null
          bio: string | null
          city: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          listings_count: number | null
          neighborhood: string | null
          profession: string | null
          rating: number | null
          reviews_count: number | null
          sales_count: number | null
        }
        Insert: {
          age?: number | null
          avatar_path?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          listings_count?: number | null
          neighborhood?: string | null
          profession?: string | null
          rating?: number | null
          reviews_count?: number | null
          sales_count?: number | null
        }
        Update: {
          age?: number | null
          avatar_path?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          listings_count?: number | null
          neighborhood?: string | null
          profession?: string | null
          rating?: number | null
          reviews_count?: number | null
          sales_count?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      accept_offer: {
        Args: { p_message?: string; p_offer_id: string; p_seller_id: string }
        Returns: {
          amount_cents: number
          buyer_id: string
          checkout_expires_at: string | null
          created_at: string
          expires_at: string
          id: string
          listing_id: string
          message: string | null
          order_id: string | null
          responded_at: string | null
          response_message: string | null
          seller_id: string
          status: Database["public"]["Enums"]["offer_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "offers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      confirm_order_pickup: {
        Args: { p_actor: string; p_order_id: string }
        Returns: {
          amount_cents: number
          buyer_confirmed: boolean
          buyer_fee_cents: number
          buyer_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          completed_at: string | null
          created_at: string
          deposit_cents: number | null
          deposit_released: boolean | null
          fee_cents: number
          id: string
          item_cents: number
          listing_id: string
          listing_thumb: string | null
          listing_title: string | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          offer_id: string | null
          paid_at: string | null
          payment_intent_id: string | null
          payment_method: string
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          pricing_version: string
          rental_end: string | null
          rental_start: string | null
          seller_confirmed: boolean
          seller_fee_cents: number
          seller_id: string
          status: Database["public"]["Enums"]["order_status"]
          tax_cents: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      expire_offer_reservation: {
        Args: { p_listing_id: string }
        Returns: undefined
      }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      gettransactionid: { Args: never; Returns: unknown }
      has_staff_role: {
        Args: { role: Database["public"]["Enums"]["staff_role"]; uid: string }
        Returns: boolean
      }
      increment_rate_limit_hit: {
        Args: { p_scope: string; p_user_id: string; p_window_start: string }
        Returns: number
      }
      is_staff: { Args: { uid: string }; Returns: boolean }
      is_support_ticket_participant: {
        Args: { p_ticket_id: string; p_uid: string }
        Returns: boolean
      }
      is_thread_participant: {
        Args: { p_thread_id: string; p_uid: string }
        Returns: boolean
      }
      longtransactionsenabled: { Args: never; Returns: boolean }
      mark_support_ticket_read: {
        Args: { p_ticket_id: string }
        Returns: undefined
      }
      mark_thread_read: { Args: { p_thread_id: string }; Returns: undefined }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      search_listings_nearby: {
        Args: {
          p_category_id?: string
          p_condition?: Database["public"]["Enums"]["listing_condition"]
          p_lat: number
          p_listing_type?: Database["public"]["Enums"]["listing_type"]
          p_lng: number
          p_max_price_cents?: number
          p_min_price_cents?: number
          p_neighborhood?: string
          p_owner_id?: string
          p_q?: string
          p_radius_m: number
          p_status?: Database["public"]["Enums"]["listing_status"]
        }
        Returns: {
          category_id: string | null
          condition: Database["public"]["Enums"]["listing_condition"] | null
          created_at: string
          deposit_cents: number | null
          description: string | null
          favorites_count: number
          flat_rate_cents: number | null
          hourly_rate_cents: number | null
          id: string
          lat: number | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          lng: number | null
          location: unknown
          meeting_venue: string | null
          neighborhood: string | null
          owner_id: string
          price_cents: number | null
          price_per_day_cents: number | null
          price_per_week_cents: number | null
          publication_request_id: string | null
          service_radius_km: number | null
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at: string
          view_count: number
        }[]
        SetofOptions: {
          from: "*"
          to: "listings"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      fee_receivable_status: "OUTSTANDING" | "SETTLED" | "WAIVED"
      kyc_status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED"
      listing_condition: "new" | "likenew" | "good" | "fair"
      listing_status: "DRAFT" | "ACTIVE" | "PAUSED" | "SOLD" | "ARCHIVED"
      listing_type: "VENTE" | "LOCATION" | "SERVICE"
      message_kind:
        | "TEXT"
        | "PHOTO"
        | "LOCATION"
        | "OFFER"
        | "PICKUP"
        | "SYSTEM"
      notif_kind:
        | "MESSAGE"
        | "OFFER"
        | "BOOKING_REQUEST"
        | "LISTING_SOLD"
        | "ORDER_UPDATE"
        | "REVIEW"
        | "PAYOUT"
        | "SYSTEM"
      offer_status:
        | "PENDING"
        | "ACCEPTED"
        | "REJECTED"
        | "EXPIRED"
        | "WITHDRAWN"
      order_status:
        | "AWAITING_PICKUP"
        | "HANDOFF_PENDING"
        | "COMPLETED"
        | "CANCELLED"
        | "REFUNDED"
        | "DISPUTED"
      payment_status:
        | "PENDING"
        | "SUCCEEDED"
        | "FAILED"
        | "REFUNDED"
        | "DISPUTED"
        | "PARTIALLY_REFUNDED"
      proceeds_hold_status:
        | "HELD"
        | "RELEASE_PENDING"
        | "RELEASING"
        | "RELEASED"
        | "REFUNDED"
        | "DISPUTED"
        | "CANCELLED"
        | "REVIEW_REQUIRED"
      staff_role: "admin" | "moderator" | "finance" | "support"
      support_sender_role: "USER" | "STAFF"
      support_ticket_status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
      user_status: "ACTIVE" | "PENDING" | "SUSPENDED" | "BANNED"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      fee_receivable_status: ["OUTSTANDING", "SETTLED", "WAIVED"],
      kyc_status: ["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"],
      listing_condition: ["new", "likenew", "good", "fair"],
      listing_status: ["DRAFT", "ACTIVE", "PAUSED", "SOLD", "ARCHIVED"],
      listing_type: ["VENTE", "LOCATION", "SERVICE"],
      message_kind: ["TEXT", "PHOTO", "LOCATION", "OFFER", "PICKUP", "SYSTEM"],
      notif_kind: [
        "MESSAGE",
        "OFFER",
        "BOOKING_REQUEST",
        "LISTING_SOLD",
        "ORDER_UPDATE",
        "REVIEW",
        "PAYOUT",
        "SYSTEM",
      ],
      offer_status: ["PENDING", "ACCEPTED", "REJECTED", "EXPIRED", "WITHDRAWN"],
      order_status: [
        "AWAITING_PICKUP",
        "HANDOFF_PENDING",
        "COMPLETED",
        "CANCELLED",
        "REFUNDED",
        "DISPUTED",
      ],
      payment_status: [
        "PENDING",
        "SUCCEEDED",
        "FAILED",
        "REFUNDED",
        "DISPUTED",
        "PARTIALLY_REFUNDED",
      ],
      proceeds_hold_status: [
        "HELD",
        "RELEASE_PENDING",
        "RELEASING",
        "RELEASED",
        "REFUNDED",
        "DISPUTED",
        "CANCELLED",
        "REVIEW_REQUIRED",
      ],
      staff_role: ["admin", "moderator", "finance", "support"],
      support_sender_role: ["USER", "STAFF"],
      support_ticket_status: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
      user_status: ["ACTIVE", "PENDING", "SUSPENDED", "BANNED"],
    },
  },
} as const

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
      brand_assets: {
        Row: {
          asset_type: string
          created_at: string
          file_name: string | null
          id: string
          is_public: boolean
          mime_type: string | null
          organization_id: string
          storage_path: string
          store_id: string | null
        }
        Insert: {
          asset_type: string
          created_at?: string
          file_name?: string | null
          id?: string
          is_public?: boolean
          mime_type?: string | null
          organization_id: string
          storage_path: string
          store_id?: string | null
        }
        Update: {
          asset_type?: string
          created_at?: string
          file_name?: string | null
          id?: string
          is_public?: boolean
          mime_type?: string | null
          organization_id?: string
          storage_path?: string
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_assets_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_assets_store_tenant_fk"
            columns: ["store_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      fulfillment_events: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          order_id: string
          organization_id: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          order_id: string
          organization_id: string
          status: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          organization_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fulfillment_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fulfillment_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fulfillment_order_tenant_fk"
            columns: ["order_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          amount: number
          created_at: string
          currency: string
          entry_type: string
          id: string
          memo: string | null
          order_id: string | null
          order_item_id: string | null
          organization_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          entry_type: string
          id?: string
          memo?: string | null
          order_id?: string | null
          order_item_id?: string | null
          organization_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          entry_type?: string
          id?: string
          memo?: string | null
          order_id?: string | null
          order_item_id?: string | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_order_item_tenant_fk"
            columns: ["order_item_id", "order_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id", "order_id", "organization_id"]
          },
          {
            foreignKeyName: "ledger_order_tenant_fk"
            columns: ["order_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          creative_ape_share_snapshot: number
          discount_snapshot: number
          id: string
          name_snapshot: string
          order_id: string
          organization_id: string
          organization_share_snapshot: number
          processing_fee_snapshot: number
          product_id: string | null
          production_cost_snapshot: number
          quantity: number
          revenue_share_rule_snapshot: Json
          shipping_allocation_snapshot: number
          sku_snapshot: string | null
          unit_price_snapshot: number
          variant_id: string | null
          variant_snapshot: Json
        }
        Insert: {
          created_at?: string
          creative_ape_share_snapshot?: number
          discount_snapshot?: number
          id?: string
          name_snapshot: string
          order_id: string
          organization_id: string
          organization_share_snapshot?: number
          processing_fee_snapshot?: number
          product_id?: string | null
          production_cost_snapshot?: number
          quantity: number
          revenue_share_rule_snapshot?: Json
          shipping_allocation_snapshot?: number
          sku_snapshot?: string | null
          unit_price_snapshot: number
          variant_id?: string | null
          variant_snapshot?: Json
        }
        Update: {
          created_at?: string
          creative_ape_share_snapshot?: number
          discount_snapshot?: number
          id?: string
          name_snapshot?: string
          order_id?: string
          organization_id?: string
          organization_share_snapshot?: number
          processing_fee_snapshot?: number
          product_id?: string | null
          production_cost_snapshot?: number
          quantity?: number
          revenue_share_rule_snapshot?: Json
          shipping_allocation_snapshot?: number
          sku_snapshot?: string | null
          unit_price_snapshot?: number
          variant_id?: string | null
          variant_snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_tenant_fk"
            columns: ["order_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "order_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_tenant_fk"
            columns: ["product_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_product_tenant_fk"
            columns: ["variant_id", "product_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id", "product_id", "organization_id"]
          },
        ]
      }
      order_notes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string
          order_id: string
          organization_id: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note: string
          order_id: string
          organization_id: string
          visibility: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string
          order_id?: string
          organization_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_notes_order_tenant_fk"
            columns: ["order_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "order_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          customer_email: string | null
          customer_name: string | null
          discount_total: number
          fulfillment_status: string
          grand_total: number
          id: string
          order_number: string
          organization_id: string
          payment_status: string
          shipping_address: Json | null
          shipping_total: number
          store_id: string
          stripe_checkout_session_id: string | null
          subtotal: number
          tax_total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          discount_total?: number
          fulfillment_status?: string
          grand_total?: number
          id?: string
          order_number: string
          organization_id: string
          payment_status?: string
          shipping_address?: Json | null
          shipping_total?: number
          store_id: string
          stripe_checkout_session_id?: string | null
          subtotal?: number
          tax_total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          discount_total?: number
          fulfillment_status?: string
          grand_total?: number
          id?: string
          order_number?: string
          organization_id?: string
          payment_status?: string
          shipping_address?: Json | null
          shipping_total?: number
          store_id?: string
          stripe_checkout_session_id?: string | null
          subtotal?: number
          tax_total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_tenant_fk"
            columns: ["store_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          default_revenue_share_rate: number
          id: string
          logo_url: string | null
          name: string
          organization_type: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          default_revenue_share_rate?: number
          id?: string
          logo_url?: string | null
          name: string
          organization_type?: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          default_revenue_share_rate?: number
          id?: string
          logo_url?: string | null
          name?: string
          organization_type?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json
          order_id: string
          organization_id: string
          provider: string
          provider_payment_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          order_id: string
          organization_id: string
          provider?: string
          provider_payment_id?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          order_id?: string
          organization_id?: string
          provider?: string
          provider_payment_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_tenant_fk"
            columns: ["order_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          provider_reference: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          provider_reference?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          provider_reference?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_media: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number
          external_url: string | null
          id: string
          is_primary: boolean
          media_type: string
          organization_id: string
          product_id: string
          storage_path: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          external_url?: string | null
          id?: string
          is_primary?: boolean
          media_type: string
          organization_id: string
          product_id: string
          storage_path?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          external_url?: string | null
          id?: string
          is_primary?: boolean
          media_type?: string
          organization_id?: string
          product_id?: string
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_media_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_media_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_media_product_tenant_fk"
            columns: ["product_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      product_templates: {
        Row: {
          active: boolean
          base_production_cost: number
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          sku_prefix: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_production_cost?: number
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sku_prefix?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_production_cost?: number
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sku_prefix?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          availability_status: string
          color: string | null
          created_at: string
          id: string
          inventory_quantity: number | null
          organization_id: string
          price_override: number | null
          product_id: string
          production_cost_override: number | null
          size: string | null
          sku: string | null
          updated_at: string
        }
        Insert: {
          availability_status?: string
          color?: string | null
          created_at?: string
          id?: string
          inventory_quantity?: number | null
          organization_id: string
          price_override?: number | null
          product_id: string
          production_cost_override?: number | null
          size?: string | null
          sku?: string | null
          updated_at?: string
        }
        Update: {
          availability_status?: string
          color?: string | null
          created_at?: string
          id?: string
          inventory_quantity?: number | null
          organization_id?: string
          price_override?: number | null
          product_id?: string
          production_cost_override?: number | null
          size?: string | null
          sku?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variants_product_tenant_fk"
            columns: ["product_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          default_revenue_share_rate: number | null
          description: string | null
          featured: boolean
          id: string
          markup_amount: number | null
          name: string
          organization_id: string
          product_template_id: string | null
          production_cost: number
          retail_price: number
          sku: string | null
          slug: string
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          default_revenue_share_rate?: number | null
          description?: string | null
          featured?: boolean
          id?: string
          markup_amount?: number | null
          name: string
          organization_id: string
          product_template_id?: string | null
          production_cost?: number
          retail_price?: number
          sku?: string | null
          slug: string
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          default_revenue_share_rate?: number | null
          description?: string | null
          featured?: boolean
          id?: string
          markup_amount?: number | null
          name?: string
          organization_id?: string
          product_template_id?: string | null
          production_cost?: number
          retail_price?: number
          sku?: string | null
          slug?: string
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_product_template_id_fkey"
            columns: ["product_template_id"]
            isOneToOne: false
            referencedRelation: "product_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_tenant_fk"
            columns: ["store_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          platform_role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          platform_role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          platform_role?: string
          updated_at?: string
        }
        Relationships: []
      }
      revenue_share_rules: {
        Row: {
          created_at: string
          effective_from: string
          effective_to: string | null
          fixed_amount: number | null
          id: string
          organization_id: string
          priority: number
          product_id: string | null
          rate: number | null
          rule_type: string
          store_id: string | null
        }
        Insert: {
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          fixed_amount?: number | null
          id?: string
          organization_id: string
          priority?: number
          product_id?: string | null
          rate?: number | null
          rule_type: string
          store_id?: string | null
        }
        Update: {
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          fixed_amount?: number | null
          id?: string
          organization_id?: string
          priority?: number
          product_id?: string | null
          rate?: number | null
          rule_type?: string
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_rules_product_tenant_fk"
            columns: ["product_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "revenue_rules_store_tenant_fk"
            columns: ["store_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "revenue_share_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_share_rules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_share_rules_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_sections: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          organization_id: string
          position: number
          section_type: string
          settings: Json
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          organization_id: string
          position?: number
          section_type: string
          settings?: Json
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          organization_id?: string
          position?: number
          section_type?: string
          settings?: Json
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_sections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_sections_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_sections_store_tenant_fk"
            columns: ["store_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      store_themes: {
        Row: {
          accent_color: string
          background_color: string
          created_at: string
          hero_image_url: string | null
          id: string
          logo_url: string | null
          organization_id: string
          primary_color: string
          secondary_color: string
          store_id: string
          text_color: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          background_color?: string
          created_at?: string
          hero_image_url?: string | null
          id?: string
          logo_url?: string | null
          organization_id: string
          primary_color?: string
          secondary_color?: string
          store_id: string
          text_color?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          background_color?: string
          created_at?: string
          hero_image_url?: string | null
          id?: string
          logo_url?: string | null
          organization_id?: string
          primary_color?: string
          secondary_color?: string
          store_id?: string
          text_color?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_themes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_themes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_themes_store_tenant_fk"
            columns: ["store_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      stores: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          published_at: string | null
          slug: string
          social_links: Json
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          published_at?: string | null
          slug: string
          social_links?: Json
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          published_at?: string | null
          slug?: string
          social_links?: Json
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_webhook_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload_hash: string | null
          processed_at: string | null
          stripe_event_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload_hash?: string | null
          processed_at?: string | null
          stripe_event_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload_hash?: string | null
          processed_at?: string | null
          stripe_event_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_test_order: {
        Args: {
          customer_email: string
          customer_name: string
          items: Json
          shipping_address: Json
          store_slug: string
        }
        Returns: {
          grand_total: number
          order_id: string
          order_number: string
        }[]
      }
      get_member_fulfillment_events: {
        Args: { target_order_id: string }
        Returns: {
          created_at: string
          id: string
          notes: string
          status: string
        }[]
      }
      get_member_order_items: {
        Args: { target_order_id: string }
        Returns: {
          id: string
          name_snapshot: string
          organization_share_snapshot: number
          quantity: number
          sku_snapshot: string
          unit_price_snapshot: number
          variant_snapshot: Json
        }[]
      }
      get_member_order_notes: {
        Args: { target_order_id: string }
        Returns: {
          created_at: string
          id: string
          note: string
        }[]
      }
      get_public_product: {
        Args: { product_slug: string; target_store_id: string }
        Returns: {
          description: string
          id: string
          name: string
          retail_price: number
          slug: string
        }[]
      }
      get_public_product_media: {
        Args: { target_product_id: string }
        Returns: {
          alt_text: string
          display_order: number
          external_url: string
          id: string
          is_primary: boolean
          media_type: string
          storage_path: string
        }[]
      }
      get_public_product_variants: {
        Args: { target_product_id: string }
        Returns: {
          availability_status: string
          color: string
          id: string
          price_override: number
          size: string
          sku: string
        }[]
      }
      get_public_store: {
        Args: { store_slug: string }
        Returns: {
          description: string
          id: string
          name: string
          slug: string
          title: string
        }[]
      }
      get_public_store_products: {
        Args: { target_store_id: string }
        Returns: {
          description: string
          featured: boolean
          id: string
          name: string
          retail_price: number
          slug: string
        }[]
      }
      get_public_store_sections: {
        Args: { target_store_id: string }
        Returns: {
          id: string
          section_position: number
          section_type: string
          settings: Json
        }[]
      }
      get_public_store_theme: {
        Args: { target_store_id: string }
        Returns: {
          accent_color: string
          background_color: string
          hero_image_url: string
          logo_url: string
          primary_color: string
          secondary_color: string
          text_color: string
        }[]
      }
      is_org_admin: { Args: { org_id: string }; Returns: boolean }
      is_org_member: { Args: { org_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      organization_sales_summary: {
        Args: { org_id: string }
        Returns: {
          gross_sales: number
          order_count: number
          organization_share: number
          outstanding_payouts: number
        }[]
      }
      storage_object_org_id: { Args: { object_name: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

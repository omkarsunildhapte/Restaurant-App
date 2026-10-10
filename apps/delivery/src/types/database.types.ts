// Generated from the local database. Do not edit by hand. Regenerate after a migration with:
//   npx supabase gen types typescript --local --schema public > apps/delivery/src/types/database.types.ts   (then restore these two lines)

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      addon_groups: {
        Row: {
          created_at: string;
          id: string;
          max_select: number | null;
          min_select: number;
          name: string;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          max_select?: number | null;
          min_select?: number;
          name: string;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          max_select?: number | null;
          min_select?: number;
          name?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "addon_groups_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      addons: {
        Row: {
          diet: Database["public"]["Enums"]["diet_type"];
          group_id: string;
          id: string;
          is_available: boolean;
          name: string;
          price: number;
          sort_order: number;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          diet?: Database["public"]["Enums"]["diet_type"];
          group_id: string;
          id?: string;
          is_available?: boolean;
          name: string;
          price?: number;
          sort_order?: number;
          tenant_id: string;
        };
        Update: {
          diet?: Database["public"]["Enums"]["diet_type"];
          group_id?: string;
          id?: string;
          is_available?: boolean;
          name?: string;
          price?: number;
          sort_order?: number;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "addons_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "addons_tenant_id_group_id_fkey";
            columns: ["tenant_id", "group_id"];
            isOneToOne: false;
            referencedRelation: "addon_groups";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      bill_payments: {
        Row: {
          amount: number;
          bill_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          method: Database["public"]["Enums"]["payment_mode"];
          outlet_id: string;
          reference: string | null;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          bill_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          method: Database["public"]["Enums"]["payment_mode"];
          outlet_id: string;
          reference?: string | null;
          tenant_id: string;
        };
        Update: {
          amount?: number;
          bill_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          method?: Database["public"]["Enums"]["payment_mode"];
          outlet_id?: string;
          reference?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bill_payments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bill_payments_tenant_id_bill_id_fkey";
            columns: ["tenant_id", "bill_id"];
            isOneToOne: false;
            referencedRelation: "bills";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "bill_payments_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bill_payments_tenant_id_outlet_id_fkey";
            columns: ["tenant_id", "outlet_id"];
            isOneToOne: false;
            referencedRelation: "outlets";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      bill_series: {
        Row: {
          financial_year: string;
          last_no: number;
          outlet_id: string;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          financial_year: string;
          last_no?: number;
          outlet_id: string;
          tenant_id: string;
        };
        Update: {
          financial_year?: string;
          last_no?: number;
          outlet_id?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bill_series_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bill_series_tenant_id_outlet_id_fkey";
            columns: ["tenant_id", "outlet_id"];
            isOneToOne: false;
            referencedRelation: "outlets";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      bills: {
        Row: {
          bill_no: number;
          cgst: number;
          created_at: string;
          created_by: string | null;
          day_session_id: string | null;
          discount: number;
          financial_year: string;
          id: string;
          invoice_no: string;
          is_void: boolean;
          order_id: string;
          outlet_id: string;
          paid_at: string;
          payment_mode: Database["public"]["Enums"]["payment_mode"];
          round_off: number;
          sgst: number;
          subtotal: number;
          taxable_amount: number;
          tenant_id: string;
          total: number;
          void_reason: string | null;
        };
        ComputedFields: never;
        Insert: {
          bill_no: number;
          cgst?: number;
          created_at?: string;
          created_by?: string | null;
          day_session_id?: string | null;
          discount?: number;
          financial_year: string;
          id?: string;
          invoice_no: string;
          is_void?: boolean;
          order_id: string;
          outlet_id: string;
          paid_at?: string;
          payment_mode: Database["public"]["Enums"]["payment_mode"];
          round_off?: number;
          sgst?: number;
          subtotal?: number;
          taxable_amount?: number;
          tenant_id: string;
          total?: number;
          void_reason?: string | null;
        };
        Update: {
          bill_no?: number;
          cgst?: number;
          created_at?: string;
          created_by?: string | null;
          day_session_id?: string | null;
          discount?: number;
          financial_year?: string;
          id?: string;
          invoice_no?: string;
          is_void?: boolean;
          order_id?: string;
          outlet_id?: string;
          paid_at?: string;
          payment_mode?: Database["public"]["Enums"]["payment_mode"];
          round_off?: number;
          sgst?: number;
          subtotal?: number;
          taxable_amount?: number;
          tenant_id?: string;
          total?: number;
          void_reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bills_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bills_day_session_fk";
            columns: ["tenant_id", "day_session_id"];
            isOneToOne: false;
            referencedRelation: "day_sessions";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "bills_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bills_tenant_id_order_id_fkey";
            columns: ["tenant_id", "order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "bills_tenant_id_outlet_id_fkey";
            columns: ["tenant_id", "outlet_id"];
            isOneToOne: false;
            referencedRelation: "outlets";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      cash_outs: {
        Row: {
          amount: number;
          created_by: string | null;
          id: string;
          label: string;
          outlet_id: string;
          paid_at: string;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          created_by?: string | null;
          id?: string;
          label: string;
          outlet_id: string;
          paid_at?: string;
          tenant_id: string;
        };
        Update: {
          amount?: number;
          created_by?: string | null;
          id?: string;
          label?: string;
          outlet_id?: string;
          paid_at?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cash_outs_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cash_outs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cash_outs_tenant_id_outlet_id_fkey";
            columns: ["tenant_id", "outlet_id"];
            isOneToOne: false;
            referencedRelation: "outlets";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      cod_settlements: {
        Row: {
          business_date: string;
          created_at: string;
          difference: number | null;
          expected: number;
          handed_in: number;
          id: string;
          note: string | null;
          outlet_id: string;
          rider_id: string;
          settled_by: string | null;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          business_date: string;
          created_at?: string;
          difference?: never;
          expected: number;
          handed_in: number;
          id?: string;
          note?: string | null;
          outlet_id: string;
          rider_id: string;
          settled_by?: string | null;
          tenant_id: string;
        };
        Update: {
          business_date?: string;
          created_at?: string;
          difference?: never;
          expected?: number;
          handed_in?: number;
          id?: string;
          note?: string | null;
          outlet_id?: string;
          rider_id?: string;
          settled_by?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cod_settlements_settled_by_fkey";
            columns: ["settled_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cod_settlements_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cod_settlements_tenant_id_outlet_id_fkey";
            columns: ["tenant_id", "outlet_id"];
            isOneToOne: false;
            referencedRelation: "outlets";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "cod_settlements_tenant_id_rider_id_fkey";
            columns: ["tenant_id", "rider_id"];
            isOneToOne: false;
            referencedRelation: "riders";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      combo_items: {
        Row: {
          combo_id: string;
          id: string;
          item_id: string;
          quantity: number;
          tenant_id: string;
          variant_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          combo_id: string;
          id?: string;
          item_id: string;
          quantity?: number;
          tenant_id: string;
          variant_id?: string | null;
        };
        Update: {
          combo_id?: string;
          id?: string;
          item_id?: string;
          quantity?: number;
          tenant_id?: string;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "combo_items_tenant_id_combo_id_fkey";
            columns: ["tenant_id", "combo_id"];
            isOneToOne: false;
            referencedRelation: "combos";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "combo_items_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "combo_items_tenant_id_item_id_fkey";
            columns: ["tenant_id", "item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "combo_items_tenant_id_variant_id_fkey";
            columns: ["tenant_id", "variant_id"];
            isOneToOne: false;
            referencedRelation: "item_variants";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      combos: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          is_available: boolean;
          name: string;
          price: number;
          sort_order: number;
          tax_rate_id: string | null;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_available?: boolean;
          name: string;
          price: number;
          sort_order?: number;
          tax_rate_id?: string | null;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_available?: boolean;
          name?: string;
          price?: number;
          sort_order?: number;
          tax_rate_id?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "combos_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "combos_tenant_id_tax_rate_id_fkey";
            columns: ["tenant_id", "tax_rate_id"];
            isOneToOne: false;
            referencedRelation: "tax_rates";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      day_sessions: {
        Row: {
          business_date: string;
          cash_difference: number | null;
          close_notes: string | null;
          closed_at: string | null;
          closed_by: string | null;
          counted_cash: number | null;
          expected_cash: number | null;
          id: string;
          opened_at: string;
          opened_by: string | null;
          opening_cash: number;
          outlet_id: string;
          summary: Json | null;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          business_date: string;
          cash_difference?: never;
          close_notes?: string | null;
          closed_at?: string | null;
          closed_by?: string | null;
          counted_cash?: number | null;
          expected_cash?: number | null;
          id?: string;
          opened_at?: string;
          opened_by?: string | null;
          opening_cash?: number;
          outlet_id: string;
          summary?: Json | null;
          tenant_id: string;
        };
        Update: {
          business_date?: string;
          cash_difference?: never;
          close_notes?: string | null;
          closed_at?: string | null;
          closed_by?: string | null;
          counted_cash?: number | null;
          expected_cash?: number | null;
          id?: string;
          opened_at?: string;
          opened_by?: string | null;
          opening_cash?: number;
          outlet_id?: string;
          summary?: Json | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "day_sessions_closed_by_fkey";
            columns: ["closed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "day_sessions_opened_by_fkey";
            columns: ["opened_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "day_sessions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "day_sessions_tenant_id_outlet_id_fkey";
            columns: ["tenant_id", "outlet_id"];
            isOneToOne: false;
            referencedRelation: "outlets";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      delivery_events: {
        Row: {
          actor_id: string | null;
          created_at: string;
          id: number;
          job_id: string;
          lat: number | null;
          lng: number | null;
          note: string | null;
          status: Database["public"]["Enums"]["delivery_status"];
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          actor_id?: string | null;
          created_at?: string;
          id?: never;
          job_id: string;
          lat?: number | null;
          lng?: number | null;
          note?: string | null;
          status: Database["public"]["Enums"]["delivery_status"];
          tenant_id: string;
        };
        Update: {
          actor_id?: string | null;
          created_at?: string;
          id?: never;
          job_id?: string;
          lat?: number | null;
          lng?: number | null;
          note?: string | null;
          status?: Database["public"]["Enums"]["delivery_status"];
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "delivery_events_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "delivery_events_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "delivery_events_tenant_id_job_id_fkey";
            columns: ["tenant_id", "job_id"];
            isOneToOne: false;
            referencedRelation: "delivery_jobs";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      delivery_jobs: {
        Row: {
          accepted_at: string | null;
          assigned_by: string | null;
          attempt_no: number;
          cod_amount: number;
          cod_collected: number | null;
          created_at: string;
          finished_at: string | null;
          id: string;
          offered_at: string;
          order_id: string;
          otp_hash: string | null;
          outlet_id: string;
          picked_up_at: string | null;
          proof_photo_url: string | null;
          reason: string | null;
          rider_id: string;
          status: Database["public"]["Enums"]["delivery_status"];
          tenant_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          accepted_at?: string | null;
          assigned_by?: string | null;
          attempt_no?: number;
          cod_amount?: number;
          cod_collected?: number | null;
          created_at?: string;
          finished_at?: string | null;
          id?: string;
          offered_at?: string;
          order_id: string;
          otp_hash?: string | null;
          outlet_id: string;
          picked_up_at?: string | null;
          proof_photo_url?: string | null;
          reason?: string | null;
          rider_id: string;
          status?: Database["public"]["Enums"]["delivery_status"];
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          accepted_at?: string | null;
          assigned_by?: string | null;
          attempt_no?: number;
          cod_amount?: number;
          cod_collected?: number | null;
          created_at?: string;
          finished_at?: string | null;
          id?: string;
          offered_at?: string;
          order_id?: string;
          otp_hash?: string | null;
          outlet_id?: string;
          picked_up_at?: string | null;
          proof_photo_url?: string | null;
          reason?: string | null;
          rider_id?: string;
          status?: Database["public"]["Enums"]["delivery_status"];
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "delivery_jobs_assigned_by_fkey";
            columns: ["assigned_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "delivery_jobs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "delivery_jobs_tenant_id_order_id_fkey";
            columns: ["tenant_id", "order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "delivery_jobs_tenant_id_outlet_id_fkey";
            columns: ["tenant_id", "outlet_id"];
            isOneToOne: false;
            referencedRelation: "outlets";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "delivery_jobs_tenant_id_rider_id_fkey";
            columns: ["tenant_id", "rider_id"];
            isOneToOne: false;
            referencedRelation: "riders";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      dining_tables: {
        Row: {
          area: string | null;
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          outlet_id: string;
          seats: number;
          sort_order: number;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          area?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          outlet_id: string;
          seats?: number;
          sort_order?: number;
          tenant_id: string;
        };
        Update: {
          area?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          outlet_id?: string;
          seats?: number;
          sort_order?: number;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dining_tables_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dining_tables_tenant_id_outlet_id_fkey";
            columns: ["tenant_id", "outlet_id"];
            isOneToOne: false;
            referencedRelation: "outlets";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      employee_pay_rates: {
        Row: {
          created_at: string;
          created_by: string | null;
          effective_from: string;
          employee_id: string;
          id: string;
          pay_type: Database["public"]["Enums"]["pay_type"];
          rate: number;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          effective_from: string;
          employee_id: string;
          id?: string;
          pay_type: Database["public"]["Enums"]["pay_type"];
          rate: number;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          effective_from?: string;
          employee_id?: string;
          id?: string;
          pay_type?: Database["public"]["Enums"]["pay_type"];
          rate?: number;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "employee_pay_rates_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employee_pay_rates_tenant_id_employee_id_fkey";
            columns: ["tenant_id", "employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "employee_pay_rates_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      employees: {
        Row: {
          created_at: string;
          full_name: string;
          id: string;
          is_active: boolean;
          job_title: string | null;
          joined_on: string | null;
          left_on: string | null;
          outlet_id: string | null;
          payment_note: string | null;
          phone: string | null;
          tenant_id: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          full_name: string;
          id?: string;
          is_active?: boolean;
          job_title?: string | null;
          joined_on?: string | null;
          left_on?: string | null;
          outlet_id?: string | null;
          payment_note?: string | null;
          phone?: string | null;
          tenant_id: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          job_title?: string | null;
          joined_on?: string | null;
          left_on?: string | null;
          outlet_id?: string | null;
          payment_note?: string | null;
          phone?: string | null;
          tenant_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "employees_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employees_tenant_id_outlet_id_fkey";
            columns: ["tenant_id", "outlet_id"];
            isOneToOne: false;
            referencedRelation: "outlets";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "employees_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      invitations: {
        Row: {
          accepted_at: string | null;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string | null;
          outlet_id: string | null;
          role: Database["public"]["Enums"]["tenant_role"];
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          accepted_at?: string | null;
          created_at?: string;
          email: string;
          expires_at?: string;
          id?: string;
          invited_by?: string | null;
          outlet_id?: string | null;
          role: Database["public"]["Enums"]["tenant_role"];
          tenant_id: string;
        };
        Update: {
          accepted_at?: string | null;
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          invited_by?: string | null;
          outlet_id?: string | null;
          role?: Database["public"]["Enums"]["tenant_role"];
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invitations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invitations_tenant_id_outlet_id_fkey";
            columns: ["tenant_id", "outlet_id"];
            isOneToOne: false;
            referencedRelation: "outlets";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      item_addon_groups: {
        Row: {
          group_id: string;
          item_id: string;
          sort_order: number;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          group_id: string;
          item_id: string;
          sort_order?: number;
          tenant_id: string;
        };
        Update: {
          group_id?: string;
          item_id?: string;
          sort_order?: number;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "item_addon_groups_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "item_addon_groups_tenant_id_group_id_fkey";
            columns: ["tenant_id", "group_id"];
            isOneToOne: false;
            referencedRelation: "addon_groups";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "item_addon_groups_tenant_id_item_id_fkey";
            columns: ["tenant_id", "item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      item_variants: {
        Row: {
          id: string;
          item_id: string;
          name: string;
          price: number;
          sort_order: number;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          id?: string;
          item_id: string;
          name: string;
          price: number;
          sort_order?: number;
          tenant_id: string;
        };
        Update: {
          id?: string;
          item_id?: string;
          name?: string;
          price?: number;
          sort_order?: number;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "item_variants_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "item_variants_tenant_id_item_id_fkey";
            columns: ["tenant_id", "item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      kots: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          order_id: string;
          outlet_id: string;
          round_no: number;
          status: Database["public"]["Enums"]["kot_status"];
          status_changed_at: string;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          order_id: string;
          outlet_id: string;
          round_no: number;
          status?: Database["public"]["Enums"]["kot_status"];
          status_changed_at?: string;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          order_id?: string;
          outlet_id?: string;
          round_no?: number;
          status?: Database["public"]["Enums"]["kot_status"];
          status_changed_at?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kots_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kots_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kots_tenant_id_order_id_fkey";
            columns: ["tenant_id", "order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "kots_tenant_id_outlet_id_fkey";
            columns: ["tenant_id", "outlet_id"];
            isOneToOne: false;
            referencedRelation: "outlets";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      memberships: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          outlet_id: string | null;
          role: Database["public"]["Enums"]["tenant_role"];
          tenant_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          outlet_id?: string | null;
          role: Database["public"]["Enums"]["tenant_role"];
          tenant_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          outlet_id?: string | null;
          role?: Database["public"]["Enums"]["tenant_role"];
          tenant_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memberships_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "memberships_tenant_id_outlet_id_fkey";
            columns: ["tenant_id", "outlet_id"];
            isOneToOne: false;
            referencedRelation: "outlets";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "memberships_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      menu_categories: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          kind: Database["public"]["Enums"]["item_kind"];
          name: string;
          sort_order: number;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          kind?: Database["public"]["Enums"]["item_kind"];
          name: string;
          sort_order?: number;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          kind?: Database["public"]["Enums"]["item_kind"];
          name?: string;
          sort_order?: number;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "menu_categories_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      menu_items: {
        Row: {
          category_id: string;
          created_at: string;
          description: string | null;
          diet: Database["public"]["Enums"]["diet_type"];
          id: string;
          image_url: string | null;
          is_available: boolean;
          name: string;
          price: number;
          sort_order: number;
          tax_rate_id: string | null;
          tenant_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          category_id: string;
          created_at?: string;
          description?: string | null;
          diet?: Database["public"]["Enums"]["diet_type"];
          id?: string;
          image_url?: string | null;
          is_available?: boolean;
          name: string;
          price: number;
          sort_order?: number;
          tax_rate_id?: string | null;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          description?: string | null;
          diet?: Database["public"]["Enums"]["diet_type"];
          id?: string;
          image_url?: string | null;
          is_available?: boolean;
          name?: string;
          price?: number;
          sort_order?: number;
          tax_rate_id?: string | null;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "menu_items_tenant_id_category_id_fkey";
            columns: ["tenant_id", "category_id"];
            isOneToOne: false;
            referencedRelation: "menu_categories";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "menu_items_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "menu_items_tenant_id_tax_rate_id_fkey";
            columns: ["tenant_id", "tax_rate_id"];
            isOneToOne: false;
            referencedRelation: "tax_rates";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      order_items: {
        Row: {
          addons: NonNullable<Json>;
          bill_id: string | null;
          combo_id: string | null;
          created_at: string;
          id: string;
          item_id: string | null;
          kot_id: string | null;
          line_subtotal: number;
          line_tax: number;
          line_total: number;
          name: string;
          notes: string | null;
          order_id: string;
          quantity: number;
          tax_rate: number;
          tenant_id: string;
          unit_price: number;
          variant_name: string | null;
        };
        ComputedFields: never;
        Insert: {
          addons?: NonNullable<Json>;
          bill_id?: string | null;
          combo_id?: string | null;
          created_at?: string;
          id?: string;
          item_id?: string | null;
          kot_id?: string | null;
          line_subtotal?: number;
          line_tax?: number;
          line_total?: number;
          name: string;
          notes?: string | null;
          order_id: string;
          quantity?: number;
          tax_rate?: number;
          tenant_id: string;
          unit_price: number;
          variant_name?: string | null;
        };
        Update: {
          addons?: NonNullable<Json>;
          bill_id?: string | null;
          combo_id?: string | null;
          created_at?: string;
          id?: string;
          item_id?: string | null;
          kot_id?: string | null;
          line_subtotal?: number;
          line_tax?: number;
          line_total?: number;
          name?: string;
          notes?: string | null;
          order_id?: string;
          quantity?: number;
          tax_rate?: number;
          tenant_id?: string;
          unit_price?: number;
          variant_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_bill_fk";
            columns: ["tenant_id", "bill_id"];
            isOneToOne: false;
            referencedRelation: "bills";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "order_items_kot_fk";
            columns: ["tenant_id", "kot_id"];
            isOneToOne: false;
            referencedRelation: "kots";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "order_items_tenant_id_combo_id_fkey";
            columns: ["tenant_id", "combo_id"];
            isOneToOne: false;
            referencedRelation: "combos";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "order_items_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_tenant_id_item_id_fkey";
            columns: ["tenant_id", "item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "order_items_tenant_id_order_id_fkey";
            columns: ["tenant_id", "order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      orders: {
        Row: {
          bill_requested_at: string | null;
          cash_on_delivery: boolean;
          created_at: string;
          created_by: string | null;
          customer_name: string | null;
          customer_phone: string | null;
          delivery_address: string | null;
          delivery_charge: number;
          delivery_lat: number | null;
          delivery_lng: number | null;
          id: string;
          notes: string | null;
          order_no: number;
          outlet_id: string;
          status: Database["public"]["Enums"]["order_status"];
          status_changed_at: string;
          subtotal: number;
          table_id: string | null;
          tax_total: number;
          tenant_id: string;
          total: number;
          type: Database["public"]["Enums"]["order_type"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          bill_requested_at?: string | null;
          cash_on_delivery?: boolean;
          created_at?: string;
          created_by?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          delivery_address?: string | null;
          delivery_charge?: number;
          delivery_lat?: number | null;
          delivery_lng?: number | null;
          id?: string;
          notes?: string | null;
          order_no: number;
          outlet_id: string;
          status?: Database["public"]["Enums"]["order_status"];
          status_changed_at?: string;
          subtotal?: number;
          table_id?: string | null;
          tax_total?: number;
          tenant_id: string;
          total?: number;
          type?: Database["public"]["Enums"]["order_type"];
          updated_at?: string;
        };
        Update: {
          bill_requested_at?: string | null;
          cash_on_delivery?: boolean;
          created_at?: string;
          created_by?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          delivery_address?: string | null;
          delivery_charge?: number;
          delivery_lat?: number | null;
          delivery_lng?: number | null;
          id?: string;
          notes?: string | null;
          order_no?: number;
          outlet_id?: string;
          status?: Database["public"]["Enums"]["order_status"];
          status_changed_at?: string;
          subtotal?: number;
          table_id?: string | null;
          tax_total?: number;
          tenant_id?: string;
          total?: number;
          type?: Database["public"]["Enums"]["order_type"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_tenant_id_outlet_id_fkey";
            columns: ["tenant_id", "outlet_id"];
            isOneToOne: false;
            referencedRelation: "outlets";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "orders_tenant_id_table_id_fkey";
            columns: ["tenant_id", "table_id"];
            isOneToOne: false;
            referencedRelation: "dining_tables";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "orders_tenant_id_table_id_fkey";
            columns: ["tenant_id", "table_id"];
            isOneToOne: false;
            referencedRelation: "table_status";
            referencedColumns: ["tenant_id", "table_id"];
          },
        ];
      };
      outlets: {
        Row: {
          address: string | null;
          city: string | null;
          created_at: string;
          geocoded_at: string | null;
          gstin: string | null;
          id: string;
          is_active: boolean;
          last_bill_no: number;
          last_order_no: number;
          latitude: number | null;
          longitude: number | null;
          name: string;
          osm_place_id: number | null;
          phone: string | null;
          tenant_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          address?: string | null;
          city?: string | null;
          created_at?: string;
          geocoded_at?: string | null;
          gstin?: string | null;
          id?: string;
          is_active?: boolean;
          last_bill_no?: number;
          last_order_no?: number;
          latitude?: number | null;
          longitude?: number | null;
          name: string;
          osm_place_id?: number | null;
          phone?: string | null;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          created_at?: string;
          geocoded_at?: string | null;
          gstin?: string | null;
          id?: string;
          is_active?: boolean;
          last_bill_no?: number;
          last_order_no?: number;
          latitude?: number | null;
          longitude?: number | null;
          name?: string;
          osm_place_id?: number | null;
          phone?: string | null;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "outlets_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      plans: {
        Row: {
          created_at: string;
          features: NonNullable<Json>;
          id: string;
          is_active: boolean;
          max_outlets: number | null;
          name: string;
          price_monthly: number;
          sort_order: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          features?: NonNullable<Json>;
          id: string;
          is_active?: boolean;
          max_outlets?: number | null;
          name: string;
          price_monthly: number;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          features?: NonNullable<Json>;
          id?: string;
          is_active?: boolean;
          max_outlets?: number | null;
          name?: string;
          price_monthly?: number;
          sort_order?: number;
        };
        Relationships: [];
      };
      platform_invoice_series: {
        Row: {
          financial_year: string;
          last_no: number;
        };
        ComputedFields: never;
        Insert: {
          financial_year: string;
          last_no?: number;
        };
        Update: {
          financial_year?: string;
          last_no?: number;
        };
        Relationships: [];
      };
      platform_settings: {
        Row: {
          id: number;
          invoice_due_days: number;
          past_due_after_days: number;
          seller_address: string | null;
          seller_email: string | null;
          seller_gstin: string | null;
          seller_name: string;
          seller_state: string;
          trial_grace_days: number | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          id?: number;
          invoice_due_days?: number;
          past_due_after_days?: number;
          seller_address?: string | null;
          seller_email?: string | null;
          seller_gstin?: string | null;
          seller_name?: string;
          seller_state?: string;
          trial_grace_days?: number | null;
          updated_at?: string;
        };
        Update: {
          id?: number;
          invoice_due_days?: number;
          past_due_after_days?: number;
          seller_address?: string | null;
          seller_email?: string | null;
          seller_gstin?: string | null;
          seller_name?: string;
          seller_state?: string;
          trial_grace_days?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          is_super_admin: boolean;
          phone: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          is_super_admin?: boolean;
          phone?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          is_super_admin?: boolean;
          phone?: string | null;
        };
        Relationships: [];
      };
      purchase_items: {
        Row: {
          amount: number | null;
          id: string;
          item_name: string;
          purchase_id: string;
          quantity: number;
          rate: number;
          sort_order: number;
          tenant_id: string;
          unit: Database["public"]["Enums"]["purchase_unit"];
        };
        ComputedFields: never;
        Insert: {
          amount?: never;
          id?: string;
          item_name: string;
          purchase_id: string;
          quantity: number;
          rate: number;
          sort_order?: number;
          tenant_id: string;
          unit?: Database["public"]["Enums"]["purchase_unit"];
        };
        Update: {
          amount?: never;
          id?: string;
          item_name?: string;
          purchase_id?: string;
          quantity?: number;
          rate?: number;
          sort_order?: number;
          tenant_id?: string;
          unit?: Database["public"]["Enums"]["purchase_unit"];
        };
        Relationships: [
          {
            foreignKeyName: "purchase_items_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_items_tenant_id_purchase_id_fkey";
            columns: ["tenant_id", "purchase_id"];
            isOneToOne: false;
            referencedRelation: "purchases";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      purchases: {
        Row: {
          bill_path: string | null;
          created_at: string;
          created_by: string | null;
          gst_amount: number;
          id: string;
          notes: string | null;
          outlet_id: string;
          paid_at: string | null;
          payment_mode: Database["public"]["Enums"]["expense_mode"];
          purchase_date: string;
          settled_mode: Database["public"]["Enums"]["expense_mode"] | null;
          subtotal: number;
          tenant_id: string;
          total: number;
          updated_at: string;
          vendor_id: string | null;
          vendor_name: string | null;
        };
        ComputedFields: never;
        Insert: {
          bill_path?: string | null;
          created_at?: string;
          created_by?: string | null;
          gst_amount?: number;
          id?: string;
          notes?: string | null;
          outlet_id: string;
          paid_at?: string | null;
          payment_mode?: Database["public"]["Enums"]["expense_mode"];
          purchase_date: string;
          settled_mode?: Database["public"]["Enums"]["expense_mode"] | null;
          subtotal?: number;
          tenant_id: string;
          total?: number;
          updated_at?: string;
          vendor_id?: string | null;
          vendor_name?: string | null;
        };
        Update: {
          bill_path?: string | null;
          created_at?: string;
          created_by?: string | null;
          gst_amount?: number;
          id?: string;
          notes?: string | null;
          outlet_id?: string;
          paid_at?: string | null;
          payment_mode?: Database["public"]["Enums"]["expense_mode"];
          purchase_date?: string;
          settled_mode?: Database["public"]["Enums"]["expense_mode"] | null;
          subtotal?: number;
          tenant_id?: string;
          total?: number;
          updated_at?: string;
          vendor_id?: string | null;
          vendor_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "purchases_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchases_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchases_tenant_id_outlet_id_fkey";
            columns: ["tenant_id", "outlet_id"];
            isOneToOne: false;
            referencedRelation: "outlets";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "purchases_tenant_id_vendor_id_fkey";
            columns: ["tenant_id", "vendor_id"];
            isOneToOne: false;
            referencedRelation: "vendors";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      rider_details: {
        Row: {
          address: string | null;
          blood_group: string | null;
          city: string | null;
          date_of_birth: string | null;
          fathers_name: string | null;
          national_id: string | null;
          rider_id: string;
          tenant_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          address?: string | null;
          blood_group?: string | null;
          city?: string | null;
          date_of_birth?: string | null;
          fathers_name?: string | null;
          national_id?: string | null;
          rider_id: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          blood_group?: string | null;
          city?: string | null;
          date_of_birth?: string | null;
          fathers_name?: string | null;
          national_id?: string | null;
          rider_id?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rider_details_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rider_details_tenant_id_rider_id_fkey";
            columns: ["tenant_id", "rider_id"];
            isOneToOne: false;
            referencedRelation: "riders";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      rider_locations: {
        Row: {
          id: number;
          job_id: string | null;
          lat: number;
          lng: number;
          recorded_at: string;
          rider_id: string;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          id?: never;
          job_id?: string | null;
          lat: number;
          lng: number;
          recorded_at?: string;
          rider_id: string;
          tenant_id: string;
        };
        Update: {
          id?: never;
          job_id?: string | null;
          lat?: number;
          lng?: number;
          recorded_at?: string;
          rider_id?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rider_locations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rider_locations_tenant_id_job_id_fkey";
            columns: ["tenant_id", "job_id"];
            isOneToOne: false;
            referencedRelation: "delivery_jobs";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "rider_locations_tenant_id_rider_id_fkey";
            columns: ["tenant_id", "rider_id"];
            isOneToOne: false;
            referencedRelation: "riders";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      riders: {
        Row: {
          created_at: string;
          full_name: string;
          id: string;
          id_proof_url: string | null;
          is_active: boolean;
          is_online: boolean;
          last_lat: number | null;
          last_lng: number | null;
          last_seen_at: string | null;
          licence_number: string | null;
          licence_url: string | null;
          phone: string;
          photo_url: string | null;
          rejection_reason: string | null;
          tenant_id: string;
          updated_at: string;
          upi_id: string | null;
          user_id: string;
          vehicle_number: string | null;
          vehicle_type: Database["public"]["Enums"]["vehicle_type"];
          verification: Database["public"]["Enums"]["rider_verification"];
          verified_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          full_name: string;
          id?: string;
          id_proof_url?: string | null;
          is_active?: boolean;
          is_online?: boolean;
          last_lat?: number | null;
          last_lng?: number | null;
          last_seen_at?: string | null;
          licence_number?: string | null;
          licence_url?: string | null;
          phone: string;
          photo_url?: string | null;
          rejection_reason?: string | null;
          tenant_id: string;
          updated_at?: string;
          upi_id?: string | null;
          user_id: string;
          vehicle_number?: string | null;
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"];
          verification?: Database["public"]["Enums"]["rider_verification"];
          verified_at?: string | null;
        };
        Update: {
          created_at?: string;
          full_name?: string;
          id?: string;
          id_proof_url?: string | null;
          is_active?: boolean;
          is_online?: boolean;
          last_lat?: number | null;
          last_lng?: number | null;
          last_seen_at?: string | null;
          licence_number?: string | null;
          licence_url?: string | null;
          phone?: string;
          photo_url?: string | null;
          rejection_reason?: string | null;
          tenant_id?: string;
          updated_at?: string;
          upi_id?: string | null;
          user_id?: string;
          vehicle_number?: string | null;
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"];
          verification?: Database["public"]["Enums"]["rider_verification"];
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "riders_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "riders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      salary_entries: {
        Row: {
          amount: number;
          created_at: string;
          created_by: string | null;
          employee_id: string;
          entry_date: string;
          id: string;
          kind: Database["public"]["Enums"]["salary_entry_kind"];
          note: string | null;
          outlet_id: string | null;
          payment_mode: Database["public"]["Enums"]["expense_mode"] | null;
          period_month: string;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          created_at?: string;
          created_by?: string | null;
          employee_id: string;
          entry_date: string;
          id?: string;
          kind: Database["public"]["Enums"]["salary_entry_kind"];
          note?: string | null;
          outlet_id?: string | null;
          payment_mode?: Database["public"]["Enums"]["expense_mode"] | null;
          period_month: string;
          tenant_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          created_by?: string | null;
          employee_id?: string;
          entry_date?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["salary_entry_kind"];
          note?: string | null;
          outlet_id?: string | null;
          payment_mode?: Database["public"]["Enums"]["expense_mode"] | null;
          period_month?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "salary_entries_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "salary_entries_tenant_id_employee_id_fkey";
            columns: ["tenant_id", "employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["tenant_id", "id"];
          },
          {
            foreignKeyName: "salary_entries_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "salary_entries_tenant_id_outlet_id_fkey";
            columns: ["tenant_id", "outlet_id"];
            isOneToOne: false;
            referencedRelation: "outlets";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      subscription_invoices: {
        Row: {
          amount: number;
          buyer_gstin: string | null;
          buyer_name: string;
          cgst: number;
          created_by: string | null;
          due_on: string;
          financial_year: string;
          gst_rate: number;
          id: string;
          invoice_no: string;
          issued_at: string;
          paid_at: string | null;
          period_end: string;
          period_start: string;
          plan_id: string;
          seller_gstin: string | null;
          seller_name: string;
          seller_state: string;
          sgst: number;
          status: Database["public"]["Enums"]["subscription_invoice_status"];
          tenant_id: string;
          total: number;
          void_reason: string | null;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          buyer_gstin?: string | null;
          buyer_name: string;
          cgst: number;
          created_by?: string | null;
          due_on: string;
          financial_year: string;
          gst_rate?: number;
          id?: string;
          invoice_no: string;
          issued_at?: string;
          paid_at?: string | null;
          period_end: string;
          period_start: string;
          plan_id: string;
          seller_gstin?: string | null;
          seller_name: string;
          seller_state: string;
          sgst: number;
          status?: Database["public"]["Enums"]["subscription_invoice_status"];
          tenant_id: string;
          total: number;
          void_reason?: string | null;
        };
        Update: {
          amount?: number;
          buyer_gstin?: string | null;
          buyer_name?: string;
          cgst?: number;
          created_by?: string | null;
          due_on?: string;
          financial_year?: string;
          gst_rate?: number;
          id?: string;
          invoice_no?: string;
          issued_at?: string;
          paid_at?: string | null;
          period_end?: string;
          period_start?: string;
          plan_id?: string;
          seller_gstin?: string | null;
          seller_name?: string;
          seller_state?: string;
          sgst?: number;
          status?: Database["public"]["Enums"]["subscription_invoice_status"];
          tenant_id?: string;
          total?: number;
          void_reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "subscription_invoices_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscription_invoices_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscription_invoices_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      subscription_payments: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          invoice_id: string;
          method: Database["public"]["Enums"]["payment_mode"];
          paid_on: string;
          recorded_by: string | null;
          reference: string | null;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          invoice_id: string;
          method: Database["public"]["Enums"]["payment_mode"];
          paid_on?: string;
          recorded_by?: string | null;
          reference?: string | null;
          tenant_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          invoice_id?: string;
          method?: Database["public"]["Enums"]["payment_mode"];
          paid_on?: string;
          recorded_by?: string | null;
          reference?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscription_payments_recorded_by_fkey";
            columns: ["recorded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscription_payments_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscription_payments_tenant_id_invoice_id_fkey";
            columns: ["tenant_id", "invoice_id"];
            isOneToOne: false;
            referencedRelation: "subscription_invoices";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
      tax_rates: {
        Row: {
          created_at: string;
          id: string;
          is_default: boolean;
          name: string;
          rate: number;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          is_default?: boolean;
          name: string;
          rate: number;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_default?: boolean;
          name?: string;
          rate?: number;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tax_rates_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenant_billing: {
        Row: {
          billing_email: string | null;
          is_founding: boolean;
          monthly_price: number | null;
          price_locked_until: string | null;
          tenant_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          billing_email?: string | null;
          is_founding?: boolean;
          monthly_price?: number | null;
          price_locked_until?: string | null;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          billing_email?: string | null;
          is_founding?: boolean;
          monthly_price?: number | null;
          price_locked_until?: string | null;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_billing_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: true;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenant_notes: {
        Row: {
          notes: string;
          tenant_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          notes?: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          notes?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_notes_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: true;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenants: {
        Row: {
          address: string | null;
          created_at: string;
          email: string | null;
          feature_overrides: NonNullable<Json>;
          fssai_number: string | null;
          gstin: string | null;
          id: string;
          legal_name: string | null;
          logo_url: string | null;
          name: string;
          packaging_charge: number;
          phone: string | null;
          plan_id: string;
          prices_include_tax: boolean;
          round_off: boolean;
          slug: string;
          status: Database["public"]["Enums"]["tenant_status"];
          timezone: string;
          trial_ends_at: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          address?: string | null;
          created_at?: string;
          email?: string | null;
          feature_overrides?: NonNullable<Json>;
          fssai_number?: string | null;
          gstin?: string | null;
          id?: string;
          legal_name?: string | null;
          logo_url?: string | null;
          name: string;
          packaging_charge?: number;
          phone?: string | null;
          plan_id?: string;
          prices_include_tax?: boolean;
          round_off?: boolean;
          slug: string;
          status?: Database["public"]["Enums"]["tenant_status"];
          timezone?: string;
          trial_ends_at?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          email?: string | null;
          feature_overrides?: NonNullable<Json>;
          fssai_number?: string | null;
          gstin?: string | null;
          id?: string;
          legal_name?: string | null;
          logo_url?: string | null;
          name?: string;
          packaging_charge?: number;
          phone?: string | null;
          plan_id?: string;
          prices_include_tax?: boolean;
          round_off?: boolean;
          slug?: string;
          status?: Database["public"]["Enums"]["tenant_status"];
          timezone?: string;
          trial_ends_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tenants_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
        ];
      };
      vendors: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          notes: string | null;
          phone: string | null;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          notes?: string | null;
          phone?: string | null;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vendors_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      table_status: {
        Row: {
          area: string | null;
          bill_requested_at: string | null;
          name: string | null;
          opened_at: string | null;
          order_id: string | null;
          order_no: number | null;
          outlet_id: string | null;
          seats: number | null;
          sort_order: number | null;
          status: string | null;
          table_id: string | null;
          tenant_id: string | null;
          total: number | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "dining_tables_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dining_tables_tenant_id_outlet_id_fkey";
            columns: ["tenant_id", "outlet_id"];
            isOneToOne: false;
            referencedRelation: "outlets";
            referencedColumns: ["tenant_id", "id"];
          },
        ];
      };
    };
    Functions: {
      advance_delivery: {
        Args: {
          p_job: string;
          p_lat?: number;
          p_lng?: number;
          p_status: Database["public"]["Enums"]["delivery_status"];
        };
        Returns: undefined;
      };
      am_i_super_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      assign_delivery: {
        Args: { p_order: string; p_rider: string };
        Returns: {
          job_id: string;
          otp: string;
        }[];
      };
      billing_overview: { Args: Record<PropertyKey, never>; Returns: Json };
      business_report: {
        Args: { p_from: string; p_outlet?: string; p_tenant: string; p_to: string };
        Returns: Json;
      };
      cancel_delivery: { Args: { p_job: string; p_reason: string }; Returns: undefined };
      cash_out_for_day: {
        Args: { p_session: string };
        Returns: {
          amount: number;
          kind: string;
          label: string;
          paid_at: string;
          recorded_by_name: string;
        }[];
      };
      close_day: {
        Args: { p_counted_cash: number; p_notes?: string; p_outlet: string };
        Returns: {
          business_date: string;
          cash_difference: number | null;
          close_notes: string | null;
          closed_at: string | null;
          closed_by: string | null;
          counted_cash: number | null;
          expected_cash: number | null;
          id: string;
          opened_at: string;
          opened_by: string | null;
          opening_cash: number;
          outlet_id: string;
          summary: Json | null;
          tenant_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "day_sessions";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      cod_due: {
        Args: { p_date: string; p_outlet: string };
        Returns: {
          deliveries: number;
          expected: number;
          rider_id: string;
          rider_name: string;
          settled: boolean;
        }[];
      };
      complete_delivery: {
        Args: {
          p_cod_collected?: number;
          p_job: string;
          p_lat?: number;
          p_lng?: number;
          p_otp?: string;
          p_photo_url?: string;
        };
        Returns: undefined;
      };
      create_tenant: {
        Args: {
          p_city?: string;
          p_name: string;
          p_outlet_name?: string;
          p_owner_email: string;
          p_phone?: string;
          p_plan_id?: string;
          p_slug: string;
          p_trial_days?: number;
        };
        Returns: Json;
      };
      fail_delivery: {
        Args: {
          p_job: string;
          p_lat?: number;
          p_lng?: number;
          p_photo_url?: string;
          p_reason: string;
        };
        Returns: undefined;
      };
      invite_member: {
        Args: {
          p_email: string;
          p_outlet?: string;
          p_role: Database["public"]["Enums"]["tenant_role"];
          p_tenant: string;
        };
        Returns: string;
      };
      mark_overdue: { Args: Record<PropertyKey, never>; Returns: number };
      mark_purchase_paid: {
        Args: { p_mode: Database["public"]["Enums"]["expense_mode"]; p_purchase: string };
        Returns: {
          bill_path: string | null;
          created_at: string;
          created_by: string | null;
          gst_amount: number;
          id: string;
          notes: string | null;
          outlet_id: string;
          paid_at: string | null;
          payment_mode: Database["public"]["Enums"]["expense_mode"];
          purchase_date: string;
          settled_mode: Database["public"]["Enums"]["expense_mode"] | null;
          subtotal: number;
          tenant_id: string;
          total: number;
          updated_at: string;
          vendor_id: string | null;
          vendor_name: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "purchases";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      merge_orders: {
        Args: { p_from: string; p_into: string };
        Returns: {
          bill_requested_at: string | null;
          cash_on_delivery: boolean;
          created_at: string;
          created_by: string | null;
          customer_name: string | null;
          customer_phone: string | null;
          delivery_address: string | null;
          delivery_charge: number;
          delivery_lat: number | null;
          delivery_lng: number | null;
          id: string;
          notes: string | null;
          order_no: number;
          outlet_id: string;
          status: Database["public"]["Enums"]["order_status"];
          status_changed_at: string;
          subtotal: number;
          table_id: string | null;
          tax_total: number;
          tenant_id: string;
          total: number;
          type: Database["public"]["Enums"]["order_type"];
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "orders";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      my_deliveries: {
        Args: { p_open_only?: boolean; p_tenant: string };
        Returns: {
          accepted_at: string;
          attempt_no: number;
          cod_amount: number;
          cod_collected: number;
          customer_name: string;
          customer_phone: string;
          delivery_address: string;
          delivery_lat: number;
          delivery_lng: number;
          finished_at: string;
          items: Json;
          job_id: string;
          offered_at: string;
          order_id: string;
          order_no: number;
          order_notes: string;
          order_total: number;
          outlet_address: string;
          outlet_id: string;
          outlet_lat: number;
          outlet_lng: number;
          outlet_name: string;
          outlet_phone: string;
          status: Database["public"]["Enums"]["delivery_status"];
        }[];
      };
      my_workspaces: {
        Args: Record<PropertyKey, never>;
        Returns: {
          features: Json;
          outlet_id: string;
          plan_id: string;
          role: Database["public"]["Enums"]["tenant_role"];
          status: Database["public"]["Enums"]["tenant_status"];
          tenant_id: string;
          tenant_name: string;
          tenant_slug: string;
          trial_ends_at: string;
          writable: boolean;
        }[];
      };
      open_day: {
        Args: { p_opening_cash?: number; p_outlet: string };
        Returns: {
          business_date: string;
          cash_difference: number | null;
          close_notes: string | null;
          closed_at: string | null;
          closed_by: string | null;
          counted_cash: number | null;
          expected_cash: number | null;
          id: string;
          opened_at: string;
          opened_by: string | null;
          opening_cash: number;
          outlet_id: string;
          summary: Json | null;
          tenant_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "day_sessions";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      platform_stats: { Args: Record<PropertyKey, never>; Returns: Json };
      purchases_summary: {
        Args: { p_from: string; p_outlet?: string; p_tenant: string; p_to: string };
        Returns: Json;
      };
      raise_subscription_invoices: { Args: { p_month?: string }; Returns: number };
      record_cash_out: {
        Args: { p_amount: number; p_kind: string; p_label: string; p_outlet: string };
        Returns: string;
      };
      record_subscription_payment: {
        Args: {
          p_amount: number;
          p_invoice: string;
          p_method: Database["public"]["Enums"]["payment_mode"];
          p_paid_on?: string;
          p_reference?: string;
        };
        Returns: {
          amount: number;
          buyer_gstin: string | null;
          buyer_name: string;
          cgst: number;
          created_by: string | null;
          due_on: string;
          financial_year: string;
          gst_rate: number;
          id: string;
          invoice_no: string;
          issued_at: string;
          paid_at: string | null;
          period_end: string;
          period_start: string;
          plan_id: string;
          seller_gstin: string | null;
          seller_name: string;
          seller_state: string;
          sgst: number;
          status: Database["public"]["Enums"]["subscription_invoice_status"];
          tenant_id: string;
          total: number;
          void_reason: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "subscription_invoices";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      renew_invitation: { Args: { p_invitation: string }; Returns: undefined };
      report_rider_location: {
        Args: { p_job?: string; p_lat: number; p_lng: number; p_tenant: string };
        Returns: undefined;
      };
      request_bill: { Args: { p_order: string }; Returns: undefined };
      respond_to_delivery: {
        Args: { p_accept: boolean; p_job: string; p_reason?: string };
        Returns: Database["public"]["Enums"]["delivery_status"];
      };
      run_billing_cycle: { Args: Record<PropertyKey, never>; Returns: Json };
      salary_month: {
        Args: { p_month: string; p_tenant: string };
        Returns: {
          advances: number;
          balance: number;
          bonus: number;
          deductions: number;
          due: number;
          employee_id: string;
          full_name: string;
          is_active: boolean;
          job_title: string;
          outlet_id: string;
          paid: number;
          pay_type: Database["public"]["Enums"]["pay_type"];
          rate: number;
        }[];
      };
      send_kot: {
        Args: { p_order: string };
        Returns: {
          created_at: string;
          created_by: string | null;
          id: string;
          order_id: string;
          outlet_id: string;
          round_no: number;
          status: Database["public"]["Enums"]["kot_status"];
          status_changed_at: string;
          tenant_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "kots";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      set_item_available: {
        Args: { p_available: boolean; p_item: string };
        Returns: {
          category_id: string;
          created_at: string;
          description: string | null;
          diet: Database["public"]["Enums"]["diet_type"];
          id: string;
          image_url: string | null;
          is_available: boolean;
          name: string;
          price: number;
          sort_order: number;
          tax_rate_id: string | null;
          tenant_id: string;
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "menu_items";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      set_rider_online: { Args: { p_online: boolean; p_tenant: string }; Returns: undefined };
      settle_bill: {
        Args: { p_discount: number; p_order: string; p_payments: Json };
        Returns: {
          bill_no: number;
          cgst: number;
          created_at: string;
          created_by: string | null;
          day_session_id: string | null;
          discount: number;
          financial_year: string;
          id: string;
          invoice_no: string;
          is_void: boolean;
          order_id: string;
          outlet_id: string;
          paid_at: string;
          payment_mode: Database["public"]["Enums"]["payment_mode"];
          round_off: number;
          sgst: number;
          subtotal: number;
          taxable_amount: number;
          tenant_id: string;
          total: number;
          void_reason: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "bills";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      settle_cod: {
        Args: {
          p_date: string;
          p_handed_in: number;
          p_note?: string;
          p_outlet: string;
          p_rider: string;
        };
        Returns: {
          business_date: string;
          created_at: string;
          difference: number | null;
          expected: number;
          handed_in: number;
          id: string;
          note: string | null;
          outlet_id: string;
          rider_id: string;
          settled_by: string | null;
          tenant_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "cod_settlements";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      settle_split_bill: {
        Args: {
          p_bill_id: string;
          p_discount: number;
          p_item_ids: string[];
          p_order: string;
          p_payments: Json;
        };
        Returns: {
          bill_no: number;
          cgst: number;
          created_at: string;
          created_by: string | null;
          day_session_id: string | null;
          discount: number;
          financial_year: string;
          id: string;
          invoice_no: string;
          is_void: boolean;
          order_id: string;
          outlet_id: string;
          paid_at: string;
          payment_mode: Database["public"]["Enums"]["payment_mode"];
          round_off: number;
          sgst: number;
          subtotal: number;
          taxable_amount: number;
          tenant_id: string;
          total: number;
          void_reason: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "bills";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      split_order_item: {
        Args: { p_item: string; p_new_id: string; p_quantity: number };
        Returns: {
          addons: NonNullable<Json>;
          bill_id: string | null;
          combo_id: string | null;
          created_at: string;
          id: string;
          item_id: string | null;
          kot_id: string | null;
          line_subtotal: number;
          line_tax: number;
          line_total: number;
          name: string;
          notes: string | null;
          order_id: string;
          quantity: number;
          tax_rate: number;
          tenant_id: string;
          unit_price: number;
          variant_name: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "order_items";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      tenant_features: { Args: { p_tenant: string }; Returns: Json };
      verify_rider: {
        Args: { p_approve: boolean; p_reason?: string; p_rider: string };
        Returns: undefined;
      };
      void_subscription_invoice: {
        Args: { p_invoice: string; p_reason: string };
        Returns: {
          amount: number;
          buyer_gstin: string | null;
          buyer_name: string;
          cgst: number;
          created_by: string | null;
          due_on: string;
          financial_year: string;
          gst_rate: number;
          id: string;
          invoice_no: string;
          issued_at: string;
          paid_at: string | null;
          period_end: string;
          period_start: string;
          plan_id: string;
          seller_gstin: string | null;
          seller_name: string;
          seller_state: string;
          sgst: number;
          status: Database["public"]["Enums"]["subscription_invoice_status"];
          tenant_id: string;
          total: number;
          void_reason: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "subscription_invoices";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
    };
    Enums: {
      delivery_status:
        | "offered"
        | "assigned"
        | "at_pickup"
        | "picked_up"
        | "at_drop"
        | "delivered"
        | "failed"
        | "cancelled";
      diet_type: "veg" | "non_veg" | "egg";
      expense_mode: "cash" | "upi" | "bank" | "card" | "credit";
      item_kind: "food" | "beverage";
      kot_status: "new" | "preparing" | "ready" | "served" | "cancelled";
      order_status: "new" | "preparing" | "ready" | "served" | "delivered" | "cancelled";
      order_type: "dine_in" | "takeaway" | "delivery";
      pay_type: "monthly" | "daily" | "hourly";
      payment_mode: "cash" | "upi" | "card" | "other";
      purchase_unit: "kg" | "g" | "l" | "ml" | "pcs" | "pack" | "dozen" | "box" | "bag";
      rider_verification: "pending" | "verified" | "rejected";
      salary_entry_kind: "salary" | "advance" | "bonus" | "deduction";
      subscription_invoice_status: "open" | "paid" | "void";
      tenant_role: "admin" | "owner" | "manager" | "cashier" | "waiter" | "kitchen" | "delivery";
      tenant_status: "trial" | "active" | "past_due" | "suspended" | "cancelled";
      vehicle_type: "bicycle" | "scooter" | "motorcycle" | "ev_scooter" | "on_foot";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      delivery_status: [
        "offered",
        "assigned",
        "at_pickup",
        "picked_up",
        "at_drop",
        "delivered",
        "failed",
        "cancelled",
      ],
      diet_type: ["veg", "non_veg", "egg"],
      expense_mode: ["cash", "upi", "bank", "card", "credit"],
      item_kind: ["food", "beverage"],
      kot_status: ["new", "preparing", "ready", "served", "cancelled"],
      order_status: ["new", "preparing", "ready", "served", "delivered", "cancelled"],
      order_type: ["dine_in", "takeaway", "delivery"],
      pay_type: ["monthly", "daily", "hourly"],
      payment_mode: ["cash", "upi", "card", "other"],
      purchase_unit: ["kg", "g", "l", "ml", "pcs", "pack", "dozen", "box", "bag"],
      rider_verification: ["pending", "verified", "rejected"],
      salary_entry_kind: ["salary", "advance", "bonus", "deduction"],
      subscription_invoice_status: ["open", "paid", "void"],
      tenant_role: ["admin", "owner", "manager", "cashier", "waiter", "kitchen", "delivery"],
      tenant_status: ["trial", "active", "past_due", "suspended", "cancelled"],
      vehicle_type: ["bicycle", "scooter", "motorcycle", "ev_scooter", "on_foot"],
    },
  },
} as const;

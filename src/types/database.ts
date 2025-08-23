export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          department_id: string | null
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          department_id?: string | null
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          department_id?: string | null
          role?: string
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          company_id: string
          client_id: string | null
          name: string
          client_name: string | null
          contract_amount: number | null
          start_date: string | null
          end_date: string | null
          completion_method: string
          progress_calculation_method: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          client_id?: string | null
          name: string
          client_name?: string | null
          contract_amount?: number | null
          start_date?: string | null
          end_date?: string | null
          completion_method?: string
          progress_calculation_method?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          client_id?: string | null
          name?: string
          client_name?: string | null
          contract_amount?: number | null
          start_date?: string | null
          end_date?: string | null
          completion_method?: string
          progress_calculation_method?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          company_id: string
          name: string
          contact_person: string | null
          email: string | null
          phone: string | null
          address: string | null
          industry: string | null
          notes: string | null
          payment_cycle_type: string | null
          payment_cycle_closing_day: number | null
          payment_cycle_payment_month_offset: number | null
          payment_cycle_payment_day: number | null
          payment_cycle_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          industry?: string | null
          notes?: string | null
          payment_cycle_type?: string | null
          payment_cycle_closing_day?: number | null
          payment_cycle_payment_month_offset?: number | null
          payment_cycle_payment_day?: number | null
          payment_cycle_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          industry?: string | null
          notes?: string | null
          payment_cycle_type?: string | null
          payment_cycle_closing_day?: number | null
          payment_cycle_payment_month_offset?: number | null
          payment_cycle_payment_day?: number | null
          payment_cycle_description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_permissions: {
        Row: {
          id: string
          user_id: string
          project_id: string
          permission_level: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          permission_level: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string
          permission_level?: string
          created_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      departments: {
        Row: {
          id: string
          company_id: string
          name: string
          parent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          parent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          parent_id?: string | null
          created_at?: string
        }
      }
      super_admins: {
        Row: {
          id: string
          email: string
          name: string
          password_hash: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          password_hash: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          password_hash?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      company_admins: {
        Row: {
          id: string
          company_id: string
          user_id: string
          role: string
          permissions: Record<string, boolean> | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          user_id: string
          role?: string
          permissions?: Record<string, boolean> | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          user_id?: string
          role?: string
          permissions?: Record<string, boolean> | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type User = Database['public']['Tables']['users']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type UserPermission = Database['public']['Tables']['user_permissions']['Row']
export type Company = Database['public']['Tables']['companies']['Row']
export type Department = Database['public']['Tables']['departments']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type SuperAdmin = Database['public']['Tables']['super_admins']['Row']
export type CompanyAdmin = Database['public']['Tables']['company_admins']['Row']

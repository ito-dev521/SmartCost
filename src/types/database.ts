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
          business_number: string | null
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
          business_number?: string | null
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
          business_number?: string | null
          created_at?: string
          updated_at: string
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
      salary_entries: {
        Row: {
          id: string
          employee_name: string
          employee_department: string | null
          salary_amount: number
          salary_period_start: string
          salary_period_end: string
          total_work_hours: number | null
          hourly_rate: number | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_name: string
          employee_department?: string | null
          salary_amount: number
          salary_period_start: string
          salary_period_end: string
          total_work_hours?: number | null
          hourly_rate?: number | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_name?: string
          employee_department?: string | null
          salary_amount?: number
          salary_period_start?: string
          salary_period_end?: string
          total_work_hours?: number | null
          hourly_rate?: number | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      salary_allocations: {
        Row: {
          id: string
          salary_entry_id: string
          project_id: string
          work_hours: number
          hourly_rate: number
          labor_cost: number
          created_at: string
        }
        Insert: {
          id?: string
          salary_entry_id: string
          project_id: string
          work_hours: number
          hourly_rate: number
          labor_cost: number
          created_at?: string
        }
        Update: {
          id?: string
          salary_entry_id?: string
          project_id?: string
          work_hours?: number
          hourly_rate?: number
          labor_cost?: number
          created_at?: string
        }
      }
      fiscal_info: {
        Row: {
          id: string
          company_id: string
          fiscal_year: number
          settlement_month: number
          current_period: number
          bank_balance: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          fiscal_year: number
          settlement_month: number
          current_period?: number
          bank_balance?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          fiscal_year?: number
          settlement_month?: number
          current_period?: number
          bank_balance?: number
          notes?: string | null
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
export type SalaryEntry = Database['public']['Tables']['salary_entries']['Row']
export type SalaryAllocation = Database['public']['Tables']['salary_allocations']['Row']
export type FiscalInfo = Database['public']['Tables']['fiscal_info']['Row']
export type FiscalInfoInsert = Database['public']['Tables']['fiscal_info']['Insert']
export type FiscalInfoUpdate = Database['public']['Tables']['fiscal_info']['Update']

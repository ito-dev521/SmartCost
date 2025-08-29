import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ブラウザ用Supabaseクライアント
export const createClientComponentClient = () =>
  createBrowserClient(supabaseUrl, supabaseAnonKey)

// 従来のクライアント（後方互換性のため）
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// データベース型定義
export interface Database {
  public: {
    Tables: {
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
          role: string
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
      budget_categories: {
        Row: {
          id: string
          name: string
          parent_id: string | null
          level: number
          sort_order: number | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          parent_id?: string | null
          level: number
          sort_order?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          parent_id?: string | null
          level?: number
          sort_order?: number | null
          created_at?: string
        }
      }
      project_budgets: {
        Row: {
          id: string
          project_id: string
          category_id: string
          planned_amount: number
          fiscal_year: number | null
          quarter: number | null
          month: number | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          category_id: string
          planned_amount: number
          fiscal_year?: number | null
          quarter?: number | null
          month?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          category_id?: string
          planned_amount?: number
          fiscal_year?: number | null
          quarter?: number | null
          month?: number | null
          created_at?: string
        }
      }
      cost_entries: {
        Row: {
          id: string
          project_id: string
          category_id: string
          entry_date: string
          amount: number
          description: string | null
          entry_type: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          category_id: string
          entry_date: string
          amount: number
          description?: string | null
          entry_type: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          category_id?: string
          entry_date?: string
          amount?: number
          description?: string | null
          entry_type?: string
          created_by?: string
          created_at?: string
        }
      }
      project_progress: {
        Row: {
          id: string
          project_id: string
          progress_date: string
          progress_rate: number
          cumulative_cost: number | null
          estimated_total_cost: number | null
          revenue_recognition: number | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          progress_date: string
          progress_rate: number
          cumulative_cost?: number | null
          estimated_total_cost?: number | null
          revenue_recognition?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          progress_date?: string
          progress_rate?: number
          cumulative_cost?: number | null
          estimated_total_cost?: number | null
          revenue_recognition?: number | null
          created_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

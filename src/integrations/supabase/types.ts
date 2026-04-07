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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          display_name: string | null
          avatar_url: string | null
          plan: string | null
          trial_started_at: string | null
          phone: string | null
          date_of_birth: string | null
          country: string | null
          employment_status: string | null
          annual_income: string | null
          net_worth: string | null
          investment_experience: string | null
          source_of_funds: string | null
          investment_goal: string | null
          time_horizon: string | null
          risk_tolerance: string | null
          accepted_terms_at: string | null
          accepted_risk_disclosure_at: string | null
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          plan?: string | null
          trial_started_at?: string | null
          phone?: string | null
          date_of_birth?: string | null
          country?: string | null
          employment_status?: string | null
          annual_income?: string | null
          net_worth?: string | null
          investment_experience?: string | null
          source_of_funds?: string | null
          investment_goal?: string | null
          time_horizon?: string | null
          risk_tolerance?: string | null
          accepted_terms_at?: string | null
          accepted_risk_disclosure_at?: string | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          plan?: string | null
          trial_started_at?: string | null
          phone?: string | null
          date_of_birth?: string | null
          country?: string | null
          employment_status?: string | null
          annual_income?: string | null
          net_worth?: string | null
          investment_experience?: string | null
          source_of_funds?: string | null
          investment_goal?: string | null
          time_horizon?: string | null
          risk_tolerance?: string | null
          accepted_terms_at?: string | null
          accepted_risk_disclosure_at?: string | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      portfolios: {
        Row: {
          id: string
          creator_id: string
          name: string
          strategy_type: Database["public"]["Enums"]["strategy_type"]
          objective: Database["public"]["Enums"]["objective_type"]
          risk_level: Database["public"]["Enums"]["risk_level"]
          geo_focus: Database["public"]["Enums"]["geo_focus"]
          status: Database["public"]["Enums"]["portfolio_status"]
          validation_status: Database["public"]["Enums"]["validation_status"]
          validation_criteria_met: boolean
          validation_summary: string | null
          allowed_assets: string[]
          leverage_allowed: boolean
          max_single_sector_exposure_pct: number
          max_turnover: Database["public"]["Enums"]["turnover_level"]
          exposure_breakdown: Json
          top_themes: string[]
          turnover_estimate: Database["public"]["Enums"]["turnover_level"]
          sectors: string[]
          disclosure_text_public: string
          description_rationale: string | null
          risks: string | null
          followers_count: number
          allocated_amount_usd: number
          new_allocations_paused: boolean
          creator_fee_pct: number
          creator_est_monthly_earnings_usd: number
          creator_investment: number
          requires_opt_in_for_structural_changes: boolean
          exit_window_days: number
          auto_exit_on_liquidation: boolean
          pending_update: string | null
          pending_change_summary: string | null
          created_at: string
          updated_at: string
          last_rebalanced_at: string | null
        }
        Insert: {
          id?: string
          creator_id: string
          name: string
          strategy_type?: Database["public"]["Enums"]["strategy_type"]
          objective?: Database["public"]["Enums"]["objective_type"]
          risk_level?: Database["public"]["Enums"]["risk_level"]
          geo_focus?: Database["public"]["Enums"]["geo_focus"]
          status?: Database["public"]["Enums"]["portfolio_status"]
          validation_status?: Database["public"]["Enums"]["validation_status"]
          validation_criteria_met?: boolean
          validation_summary?: string | null
          allowed_assets?: string[]
          leverage_allowed?: boolean
          max_single_sector_exposure_pct?: number
          max_turnover?: Database["public"]["Enums"]["turnover_level"]
          exposure_breakdown?: Json
          top_themes?: string[]
          turnover_estimate?: Database["public"]["Enums"]["turnover_level"]
          sectors?: string[]
          disclosure_text_public?: string
          description_rationale?: string | null
          risks?: string | null
          followers_count?: number
          allocated_amount_usd?: number
          new_allocations_paused?: boolean
          creator_fee_pct?: number
          creator_est_monthly_earnings_usd?: number
          creator_investment?: number
          requires_opt_in_for_structural_changes?: boolean
          exit_window_days?: number
          auto_exit_on_liquidation?: boolean
          pending_update?: string | null
          pending_change_summary?: string | null
          created_at?: string
          updated_at?: string
          last_rebalanced_at?: string | null
        }
        Update: {
          id?: string
          creator_id?: string
          name?: string
          strategy_type?: Database["public"]["Enums"]["strategy_type"]
          objective?: Database["public"]["Enums"]["objective_type"]
          risk_level?: Database["public"]["Enums"]["risk_level"]
          geo_focus?: Database["public"]["Enums"]["geo_focus"]
          status?: Database["public"]["Enums"]["portfolio_status"]
          validation_status?: Database["public"]["Enums"]["validation_status"]
          validation_criteria_met?: boolean
          validation_summary?: string | null
          allowed_assets?: string[]
          leverage_allowed?: boolean
          max_single_sector_exposure_pct?: number
          max_turnover?: Database["public"]["Enums"]["turnover_level"]
          exposure_breakdown?: Json
          top_themes?: string[]
          turnover_estimate?: Database["public"]["Enums"]["turnover_level"]
          sectors?: string[]
          disclosure_text_public?: string
          description_rationale?: string | null
          risks?: string | null
          followers_count?: number
          allocated_amount_usd?: number
          new_allocations_paused?: boolean
          creator_fee_pct?: number
          creator_est_monthly_earnings_usd?: number
          creator_investment?: number
          requires_opt_in_for_structural_changes?: boolean
          exit_window_days?: number
          auto_exit_on_liquidation?: boolean
          pending_update?: string | null
          pending_change_summary?: string | null
          created_at?: string
          updated_at?: string
          last_rebalanced_at?: string | null
        }
        Relationships: [{
          foreignKeyName: "portfolios_creator_id_fkey"
          columns: ["creator_id"]
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        }]
      }
      portfolio_holdings: {
        Row: {
          id: string
          portfolio_id: string
          ticker: string
          name: string
          weight: number
          sector: string | null
          created_at: string
        }
        Insert: {
          id?: string
          portfolio_id: string
          ticker: string
          name: string
          weight: number
          sector?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          portfolio_id?: string
          ticker?: string
          name?: string
          weight?: number
          sector?: string | null
          created_at?: string
        }
        Relationships: [{
          foreignKeyName: "portfolio_holdings_portfolio_id_fkey"
          columns: ["portfolio_id"]
          referencedRelation: "portfolios"
          referencedColumns: ["id"]
        }]
      }
      portfolio_performance: {
        Row: {
          id: string
          portfolio_id: string
          recorded_at: string
          return_30d: number | null
          return_90d: number | null
          max_drawdown: number | null
          volatility: number | null
          consistency_score: number | null
        }
        Insert: {
          id?: string
          portfolio_id: string
          recorded_at?: string
          return_30d?: number | null
          return_90d?: number | null
          max_drawdown?: number | null
          volatility?: number | null
          consistency_score?: number | null
        }
        Update: {
          id?: string
          portfolio_id?: string
          recorded_at?: string
          return_30d?: number | null
          return_90d?: number | null
          max_drawdown?: number | null
          volatility?: number | null
          consistency_score?: number | null
        }
        Relationships: [{
          foreignKeyName: "portfolio_performance_portfolio_id_fkey"
          columns: ["portfolio_id"]
          referencedRelation: "portfolios"
          referencedColumns: ["id"]
        }]
      }
      portfolio_activity_log: {
        Row: {
          id: string
          portfolio_id: string
          event_type: Database["public"]["Enums"]["activity_event_type"]
          summary: string
          occurred_at: string
        }
        Insert: {
          id?: string
          portfolio_id: string
          event_type: Database["public"]["Enums"]["activity_event_type"]
          summary: string
          occurred_at?: string
        }
        Update: {
          id?: string
          portfolio_id?: string
          event_type?: Database["public"]["Enums"]["activity_event_type"]
          summary?: string
          occurred_at?: string
        }
        Relationships: [{
          foreignKeyName: "portfolio_activity_log_portfolio_id_fkey"
          columns: ["portfolio_id"]
          referencedRelation: "portfolios"
          referencedColumns: ["id"]
        }]
      }
      followed_portfolios: {
        Row: {
          id: string
          user_id: string
          portfolio_id: string
          allocation_usd: number
          allocated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          portfolio_id: string
          allocation_usd?: number
          allocated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          portfolio_id?: string
          allocation_usd?: number
          allocated_at?: string
        }
        Relationships: [{
          foreignKeyName: "followed_portfolios_user_id_fkey"
          columns: ["user_id"]
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "followed_portfolios_portfolio_id_fkey"
          columns: ["portfolio_id"]
          referencedRelation: "portfolios"
          referencedColumns: ["id"]
        }]
      }
      portfolio_comments: {
        Row: {
          id: string
          portfolio_id: string
          author_id: string
          content: string
          likes: number
          created_at: string
        }
        Insert: {
          id?: string
          portfolio_id: string
          author_id: string
          content: string
          likes?: number
          created_at?: string
        }
        Update: {
          id?: string
          portfolio_id?: string
          author_id?: string
          content?: string
          likes?: number
          created_at?: string
        }
        Relationships: [{
          foreignKeyName: "portfolio_comments_portfolio_id_fkey"
          columns: ["portfolio_id"]
          referencedRelation: "portfolios"
          referencedColumns: ["id"]
        }, {
          foreignKeyName: "portfolio_comments_author_id_fkey"
          columns: ["author_id"]
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        }]
      }
      page_views: {
        Row: {
          city: string | null
          country: string | null
          country_code: string | null
          exited_at: string | null
          id: string
          ip_address: string | null
          page_path: string
          referrer: string | null
          region: string | null
          session_id: string | null
          time_on_page: number | null
          timezone: string | null
          user_agent: string | null
          visited_at: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          exited_at?: string | null
          id?: string
          ip_address?: string | null
          page_path: string
          referrer?: string | null
          region?: string | null
          session_id?: string | null
          time_on_page?: number | null
          timezone?: string | null
          user_agent?: string | null
          visited_at?: string
        }
        Update: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          exited_at?: string | null
          id?: string
          ip_address?: string | null
          page_path?: string
          referrer?: string | null
          region?: string | null
          session_id?: string | null
          time_on_page?: number | null
          timezone?: string | null
          user_agent?: string | null
          visited_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      strategy_type: "Manual" | "GenAI"
      objective_type: "growth" | "income" | "preservation" | "speculation" | "balanced"
      risk_level: "conservative" | "moderate" | "aggressive"
      geo_focus: "US" | "Global" | "Emerging" | "Europe" | "Asia"
      portfolio_status: "private" | "listed" | "inactive"
      validation_status: "pending" | "in_progress" | "validated" | "rejected"
      turnover_level: "low" | "medium" | "high"
      activity_event_type: "rebalance" | "holding_added" | "holding_removed" | "weight_change" | "status_change" | "comment"
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
      strategy_type: ["Manual", "GenAI"] as const,
      objective_type: ["growth", "income", "preservation", "speculation", "balanced"] as const,
      risk_level: ["conservative", "moderate", "aggressive"] as const,
      geo_focus: ["US", "Global", "Emerging", "Europe", "Asia"] as const,
      portfolio_status: ["private", "listed", "inactive"] as const,
      validation_status: ["pending", "in_progress", "validated", "rejected"] as const,
      turnover_level: ["low", "medium", "high"] as const,
      activity_event_type: ["rebalance", "holding_added", "holding_removed", "weight_change", "status_change", "comment"] as const,
    },
  },
} as const

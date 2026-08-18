export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type LegalDocumentType =
  | "mission"
  | "beliefs"
  | "boundaries"
  | "privacy"
  | "terms"
  | "community_guidelines"
  | "ai_notice"
  | "leader_covenant";

export type ConsentType = "terms" | "privacy" | "sensitive_data" | "ai_notice" | "marketing";
export type GroupRole = "leader" | "co_leader" | "member" | "observer";
export type MembershipStatus = "invited" | "active" | "paused" | "left" | "removed";
export type GroupLifecycleStatus = "active" | "paused" | "archived";
export type GroupSafetyStatus = "clear" | "watch" | "restricted" | "frozen";
export type CourseStatus = "draft" | "active" | "retired";
export type CourseVersionStatus = "draft" | "review" | "published" | "retired";
export type LessonRiskLevel = "low" | "medium" | "high";
export type ContentBlockType =
  | "overview"
  | "reading"
  | "reflection_prompt"
  | "practice"
  | "memory_ref"
  | "local_church_notice"
  | "boundary_notice";
export type ContentReviewStatus = "pending" | "approved" | "rejected";
export type TaskType = "reading" | "reflection" | "practice" | "scripture_memory" | "self_assessment";
export type TaskCompletionStatus = "completed" | "skipped" | "reset";
export type CohortStatus = "draft" | "active" | "paused" | "completed" | "archived";
export type EntryType = "reflection" | "devotional_note" | "prayer" | "testimony";
export type EntryVisibility = "private" | "leader_only" | "group";
export type EntryStatus = "active" | "deleted";
export type ShareScope = "leader_only" | "group";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          display_name: string;
          avatar_path: string | null;
          timezone: string;
          locale: string;
          adult_confirmed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          display_name?: string;
          avatar_path?: string | null;
          timezone?: string;
          locale?: string;
          adult_confirmed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
          avatar_path?: string | null;
          timezone?: string;
          locale?: string;
        };
        Relationships: [];
      };
      legal_documents: {
        Row: {
          id: string;
          document_type: LegalDocumentType;
          version: string;
          locale: string;
          title: string;
          content_hash: string;
          published_at: string | null;
          retired_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_type: LegalDocumentType;
          version: string;
          locale?: string;
          title: string;
          content_hash: string;
          published_at?: string | null;
          retired_at?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          content_hash?: string;
          published_at?: string | null;
          retired_at?: string | null;
        };
        Relationships: [];
      };
      user_consents: {
        Row: {
          id: string;
          user_id: string;
          legal_document_id: string;
          consent_type: ConsentType;
          granted_at: string;
          revoked_at: string | null;
          evidence_meta: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          legal_document_id: string;
          consent_type: ConsentType;
          granted_at?: string;
          revoked_at?: string | null;
          evidence_meta?: Json;
          created_at?: string;
        };
        Update: {
          revoked_at?: string | null;
        };
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string;
          timezone: string;
          member_limit: number;
          lifecycle_status: GroupLifecycleStatus;
          safety_status: GroupSafetyStatus;
          created_by: string;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          timezone?: string;
          member_limit?: number;
          lifecycle_status?: GroupLifecycleStatus;
          safety_status?: GroupSafetyStatus;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: {
          name?: string;
          description?: string;
          timezone?: string;
          member_limit?: number;
          lifecycle_status?: GroupLifecycleStatus;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      group_memberships: {
        Row: {
          group_id: string;
          user_id: string;
          role: GroupRole;
          status: MembershipStatus;
          invited_by: string | null;
          joined_at: string | null;
          left_at: string | null;
          leader_covenant_version: string | null;
          accepted_covenant_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          group_id: string;
          user_id: string;
          role?: GroupRole;
          status?: MembershipStatus;
          invited_by?: string | null;
          joined_at?: string | null;
          left_at?: string | null;
          leader_covenant_version?: string | null;
          accepted_covenant_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          role?: GroupRole;
          status?: MembershipStatus;
          invited_by?: string | null;
          joined_at?: string | null;
          left_at?: string | null;
          leader_covenant_version?: string | null;
          accepted_covenant_at?: string | null;
        };
        Relationships: [];
      };
      group_invitations: {
        Row: {
          id: string;
          group_id: string;
          token_hash: string;
          role_to_grant: GroupRole;
          expires_at: string;
          max_uses: number;
          use_count: number;
          created_by: string;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          token_hash: string;
          role_to_grant?: GroupRole;
          expires_at: string;
          max_uses?: number;
          use_count?: number;
          created_by: string;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: {
          use_count?: number;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
      content_sources: {
        Row: {
          id: string;
          title: string;
          author: string | null;
          source_file_ref: string | null;
          license_scope: string;
          license_evidence_path: string | null;
          language: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          author?: string | null;
          source_file_ref?: string | null;
          license_scope?: string;
          license_evidence_path?: string | null;
          language?: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          slug: string;
          title: string;
          audience: string;
          status: CourseStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          audience?: string;
          status?: CourseStatus;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      course_versions: {
        Row: {
          id: string;
          course_id: string;
          version: string;
          locale: string;
          status: CourseVersionStatus;
          source_id: string;
          published_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          version: string;
          locale?: string;
          status?: CourseVersionStatus;
          source_id: string;
          published_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      modules: {
        Row: {
          id: string;
          course_version_id: string;
          sequence: number;
          title: string;
          estimated_minutes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_version_id: string;
          sequence: number;
          title: string;
          estimated_minutes?: number;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      lessons: {
        Row: {
          id: string;
          module_id: string;
          sequence: number;
          title: string;
          risk_level: LessonRiskLevel;
          local_church_notice: string;
          ai_policy_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          module_id: string;
          sequence: number;
          title: string;
          risk_level?: LessonRiskLevel;
          local_church_notice?: string;
          ai_policy_id?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      content_blocks: {
        Row: {
          id: string;
          lesson_id: string;
          sequence: number;
          block_type: ContentBlockType;
          body_json: Json;
          source_locator: string;
          ai_approved: boolean;
          theology_status: ContentReviewStatus;
          copyright_status: ContentReviewStatus;
          safety_status: ContentReviewStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          sequence: number;
          block_type: ContentBlockType;
          body_json?: Json;
          source_locator: string;
          ai_approved?: boolean;
          theology_status?: ContentReviewStatus;
          copyright_status?: ContentReviewStatus;
          safety_status?: ContentReviewStatus;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      scripture_refs: {
        Row: {
          id: string;
          content_block_id: string;
          osis_ref: string;
          display_label: string;
          translation_key: string | null;
          licensed_text: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      cohorts: {
        Row: {
          id: string;
          group_id: string;
          course_version_id: string;
          starts_on: string;
          status: CohortStatus;
          meeting_url: string | null;
          meeting_schedule: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          course_version_id: string;
          starts_on: string;
          status?: CohortStatus;
          meeting_url?: string | null;
          meeting_schedule?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          starts_on?: string;
          status?: CohortStatus;
          meeting_url?: string | null;
          meeting_schedule?: string | null;
        };
        Relationships: [];
      };
      cohort_lessons: {
        Row: {
          cohort_id: string;
          lesson_id: string;
          week_number: number;
          unlock_at: string;
          due_at: string | null;
        };
        Insert: {
          cohort_id: string;
          lesson_id: string;
          week_number: number;
          unlock_at: string;
          due_at?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          lesson_id: string;
          task_type: TaskType;
          title: string;
          prompt_json: Json;
          is_core: boolean;
          sequence: number;
          estimated_minutes: number;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      task_completions: {
        Row: {
          task_id: string;
          user_id: string;
          cohort_id: string;
          status: TaskCompletionStatus;
          completed_at: string | null;
          reflection_entry_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          task_id: string;
          user_id: string;
          cohort_id: string;
          status: TaskCompletionStatus;
          completed_at?: string | null;
          reflection_entry_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: TaskCompletionStatus;
          completed_at?: string | null;
          reflection_entry_id?: string | null;
        };
        Relationships: [];
      };
      entries: {
        Row: {
          id: string;
          author_id: string;
          group_id: string | null;
          cohort_id: string | null;
          lesson_id: string | null;
          task_id: string | null;
          entry_type: EntryType;
          visibility: EntryVisibility;
          body: string;
          status: EntryStatus;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          author_id: string;
          group_id?: string | null;
          cohort_id?: string | null;
          lesson_id?: string | null;
          task_id?: string | null;
          entry_type?: EntryType;
          visibility?: EntryVisibility;
          body: string;
          status?: EntryStatus;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          visibility?: EntryVisibility;
          body?: string;
          status?: EntryStatus;
          deleted_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      content_shares: {
        Row: {
          entry_id: string;
          target_group_id: string;
          share_scope: ShareScope;
          shared_at: string;
          revoked_at: string | null;
        };
        Insert: {
          entry_id: string;
          target_group_id: string;
          share_scope: ShareScope;
          shared_at?: string;
          revoked_at?: string | null;
        };
        Update: {
          revoked_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      confirm_adult_profile: {
        Args: {
          display_name: string;
          timezone: string;
          locale: string;
        };
        Returns: Database["public"]["Tables"]["profiles"]["Row"];
      };
      grant_user_consent: {
        Args: {
          document_type: LegalDocumentType;
          document_version: string;
          consent_type: ConsentType;
          evidence_meta?: Json;
        };
        Returns: Database["public"]["Tables"]["user_consents"]["Row"];
      };
      revoke_user_consent: {
        Args: {
          consent_id: string;
        };
        Returns: Database["public"]["Tables"]["user_consents"]["Row"];
      };
      is_active_group_member: {
        Args: {
          target_group_id: string;
          target_user_id?: string;
        };
        Returns: boolean;
      };
      is_group_leader: {
        Args: {
          target_group_id: string;
          target_user_id?: string;
        };
        Returns: boolean;
      };
      active_group_leader_count: {
        Args: {
          target_group_id: string;
        };
        Returns: number;
      };
      is_group_cohort_member: {
        Args: {
          target_cohort_id: string;
          target_user_id?: string;
        };
        Returns: boolean;
      };
      is_group_cohort_leader: {
        Args: {
          target_cohort_id: string;
          target_user_id?: string;
        };
        Returns: boolean;
      };
      can_read_entry: {
        Args: {
          target_entry_id: string;
          target_user_id?: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      legal_document_type: LegalDocumentType;
      consent_type: ConsentType;
      group_role: GroupRole;
      membership_status: MembershipStatus;
      group_lifecycle_status: GroupLifecycleStatus;
      group_safety_status: GroupSafetyStatus;
      course_status: CourseStatus;
      course_version_status: CourseVersionStatus;
      lesson_risk_level: LessonRiskLevel;
      content_block_type: ContentBlockType;
      content_review_status: ContentReviewStatus;
      task_type: TaskType;
      task_completion_status: TaskCompletionStatus;
      cohort_status: CohortStatus;
      entry_type: EntryType;
      entry_visibility: EntryVisibility;
      entry_status: EntryStatus;
      share_scope: ShareScope;
    };
    CompositeTypes: Record<string, never>;
  };
};

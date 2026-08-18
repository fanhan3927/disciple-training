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
export type DiscussionPostStatus = "active" | "hidden" | "deleted";
export type CommentStatus = "active" | "hidden" | "deleted";
export type ReactionType = "encouragement" | "prayer";
export type PrayerVisibility = "private" | "leader_only" | "group";
export type PrayerStatus = "open" | "continued" | "ended" | "responded";
export type PrayerResponseType = "prayed" | "encouragement";
export type NotificationType = "discussion_reply" | "prayer_response" | "weekly_reminder";
export type AiRiskCategory = "normal" | "doctrine_core" | "denominational" | "divine_guidance" | "sacrament" | "mental_health" | "self_harm" | "abuse" | "financial_exploitation" | "other_high_risk" | "prompt_injection";
export type AiGroundingStatus = "grounded" | "partial" | "insufficient";
export type AiMessageRole = "user" | "assistant" | "system";
export type ReportTargetType = "post" | "comment" | "prayer" | "member" | "group";
export type ReportStatus = "open" | "in_review" | "resolved" | "dismissed";
export type SafetyCaseStatus = "open" | "triage" | "active" | "resolved" | "closed";
export type UserRightsRequestStatus = "requested" | "processing" | "completed" | "cancelled";

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
      group_posts: {
        Row: {
          id: string;
          group_id: string;
          author_id: string;
          week_number: number | null;
          title: string;
          body: string;
          status: DiscussionPostStatus;
          created_at: string;
          updated_at: string;
          hidden_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          group_id: string;
          author_id: string;
          week_number?: number | null;
          title: string;
          body: string;
          status?: DiscussionPostStatus;
          created_at?: string;
          updated_at?: string;
          hidden_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          title?: string;
          body?: string;
          status?: DiscussionPostStatus;
          updated_at?: string;
          hidden_at?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          body: string;
          status: CommentStatus;
          created_at: string;
          updated_at: string;
          hidden_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          body: string;
          status?: CommentStatus;
          created_at?: string;
          updated_at?: string;
          hidden_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          body?: string;
          status?: CommentStatus;
          updated_at?: string;
          hidden_at?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      reactions: {
        Row: {
          id: string;
          post_id: string | null;
          comment_id: string | null;
          user_id: string;
          reaction_type: ReactionType;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id?: string | null;
          comment_id?: string | null;
          user_id: string;
          reaction_type: ReactionType;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      prayer_requests: {
        Row: {
          id: string;
          group_id: string;
          author_id: string;
          title: string;
          body: string;
          visibility: PrayerVisibility;
          status: PrayerStatus;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
          ended_at: string | null;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          group_id: string;
          author_id: string;
          title: string;
          body: string;
          visibility?: PrayerVisibility;
          status?: PrayerStatus;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
          ended_at?: string | null;
          responded_at?: string | null;
        };
        Update: {
          title?: string;
          body?: string;
          visibility?: PrayerVisibility;
          status?: PrayerStatus;
          expires_at?: string | null;
          updated_at?: string;
          ended_at?: string | null;
          responded_at?: string | null;
        };
        Relationships: [];
      };
      prayer_responses: {
        Row: {
          id: string;
          request_id: string;
          responder_id: string;
          response_type: PrayerResponseType;
          body: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          responder_id: string;
          response_type: PrayerResponseType;
          body?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          group_id: string | null;
          notification_type: NotificationType;
          post_id: string | null;
          comment_id: string | null;
          prayer_request_id: string | null;
          metadata: Json;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          group_id?: string | null;
          notification_type: NotificationType;
          post_id?: string | null;
          comment_id?: string | null;
          prayer_request_id?: string | null;
          metadata?: Json;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          read_at?: string | null;
        };
        Relationships: [];
      };
      knowledge_chunks: {
        Row: { id: string; content_block_id: string; chunk_text: string; source_locator: string; embedding: Json | null; status: string; created_at: string };
        Insert: { id?: string; content_block_id: string; chunk_text: string; source_locator: string; embedding?: Json | null; status?: string; created_at?: string };
        Update: { chunk_text?: string; source_locator?: string; embedding?: Json | null; status?: string };
        Relationships: [];
      };
      ai_threads: {
        Row: { id: string; user_id: string; title: string; include_private_content: boolean; status: string; created_at: string; deleted_at: string | null };
        Insert: { id?: string; user_id: string; title?: string; include_private_content?: boolean; status?: string; created_at?: string; deleted_at?: string | null };
        Update: { title?: string; status?: string; deleted_at?: string | null };
        Relationships: [];
      };
      ai_messages: {
        Row: { id: string; thread_id: string; role: AiMessageRole; body: string; risk_category: AiRiskCategory; grounding_status: AiGroundingStatus; citations: Json; created_at: string };
        Insert: { id?: string; thread_id: string; role: AiMessageRole; body: string; risk_category?: AiRiskCategory; grounding_status?: AiGroundingStatus; citations?: Json; created_at?: string };
        Update: never;
        Relationships: [];
      };
      reports: {
        Row: { id: string; reporter_id: string; group_id: string; target_type: ReportTargetType; target_id: string; category: string; details: string; status: ReportStatus; created_at: string; updated_at: string };
        Insert: { id?: string; reporter_id: string; group_id: string; target_type: ReportTargetType; target_id: string; category: string; details?: string; status?: ReportStatus; created_at?: string; updated_at?: string };
        Update: never;
        Relationships: [];
      };
      safety_cases: {
        Row: { id: string; report_id: string | null; group_id: string | null; status: SafetyCaseStatus; severity: string; assigned_to: string | null; resolution_note: string; created_at: string; updated_at: string };
        Insert: { id?: string; report_id?: string | null; group_id?: string | null; status?: SafetyCaseStatus; severity?: string; assigned_to?: string | null; resolution_note?: string; created_at?: string; updated_at?: string };
        Update: { status?: SafetyCaseStatus; severity?: string; assigned_to?: string | null; resolution_note?: string; updated_at?: string };
        Relationships: [];
      };
      safety_case_access: {
        Row: { case_id: string; user_id: string; access_reason: string; granted_at: string; revoked_at: string | null };
        Insert: { case_id: string; user_id: string; access_reason: string; granted_at?: string; revoked_at?: string | null };
        Update: { revoked_at?: string | null };
        Relationships: [];
      };
      audit_events: {
        Row: { id: string; actor_id: string | null; target_user_id: string | null; group_id: string | null; event_type: string; target_type: string | null; target_id: string | null; metadata: Json; created_at: string };
        Insert: { id?: string; actor_id?: string | null; target_user_id?: string | null; group_id?: string | null; event_type: string; target_type?: string | null; target_id?: string | null; metadata?: Json; created_at?: string };
        Update: never;
        Relationships: [];
      };
      data_export_requests: {
        Row: { id: string; user_id: string; status: UserRightsRequestStatus; requested_at: string; completed_at: string | null; download_expires_at: string | null };
        Insert: { id?: string; user_id: string; status?: UserRightsRequestStatus; requested_at?: string; completed_at?: string | null; download_expires_at?: string | null };
        Update: never;
        Relationships: [];
      };
      account_deletion_requests: {
        Row: { id: string; user_id: string; status: UserRightsRequestStatus; requested_at: string; cooldown_until: string; completed_at: string | null };
        Insert: { id?: string; user_id: string; status?: UserRightsRequestStatus; requested_at?: string; cooldown_until?: string; completed_at?: string | null };
        Update: never;
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
      discussion_post_status: DiscussionPostStatus;
      comment_status: CommentStatus;
      reaction_type: ReactionType;
      prayer_visibility: PrayerVisibility;
      prayer_status: PrayerStatus;
      prayer_response_type: PrayerResponseType;
      notification_type: NotificationType;
      ai_risk_category: AiRiskCategory;
      ai_grounding_status: AiGroundingStatus;
      ai_message_role: AiMessageRole;
      report_target_type: ReportTargetType;
      report_status: ReportStatus;
      safety_case_status: SafetyCaseStatus;
      user_rights_request_status: UserRightsRequestStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

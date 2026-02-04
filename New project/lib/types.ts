export type VerificationTier = "unverified" | "light" | "strong";

export type IssueStatus =
  | "Submitted"
  | "Under review"
  | "Responded"
  | "In progress"
  | "Resolved";

export type IssueScope = "citywide" | "ward" | "local";

export type Issue = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  category: string;
  scope: IssueScope;
  ward: string | null;
  neighborhood: string | null;
  status: IssueStatus;
  image_url: string | null;
  created_at: string;
};

export type IssueWithCounts = Issue & {
  support_count: number;
  impact_count: number;
  comment_count: number;
};

export type Comment = {
  id: string;
  issue_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
};

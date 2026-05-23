export interface IIssue {
  title: string;
  description: string;
  type: "bug" | "feature";
}

export interface IIssueQuery {
  sort?: "newest" | "oldest";
  type?: "bug" | "feature_request";
  status?: "open" | "in_progress" | "resolved";
}
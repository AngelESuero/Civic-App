import Link from "next/link";
import type { IssueWithCounts } from "../../lib/types";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function IssueCard({ issue }: { issue: IssueWithCounts }) {
  return (
    <div className="rounded-2xl border border-slate/10 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href={`/issue/${issue.id}`} className="text-lg font-semibold text-ink">
            {issue.title}
          </Link>
          <p className="mt-1 text-sm text-slate/70">{issue.body}</p>
        </div>
        <span className="rounded-full bg-fog px-3 py-1 text-xs text-slate">
          {issue.status}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate/70">
        <span className="rounded-full bg-fog px-2 py-1">{issue.category}</span>
        <span className="rounded-full bg-fog px-2 py-1">{issue.scope}</span>
        {issue.ward ? <span className="rounded-full bg-fog px-2 py-1">Ward {issue.ward}</span> : null}
        {issue.neighborhood ? (
          <span className="rounded-full bg-fog px-2 py-1">{issue.neighborhood}</span>
        ) : null}
        <span className="ml-auto text-slate/50">{formatDate(issue.created_at)}</span>
      </div>
      <div className="mt-3 flex gap-4 text-sm text-slate">
        <span>Support {issue.support_count}</span>
        <span>Impact {issue.impact_count}</span>
        <span>Comments {issue.comment_count}</span>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "../components/Header";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import type { IssueWithCounts } from "../../lib/types";

export default function BriefPage() {
  const [issues, setIssues] = useState<IssueWithCounts[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("issues")
        .select("*, supports(count)")
        .order("created_at", { ascending: false });

      const mapped = (data ?? []).map((issue) => ({
        ...issue,
        support_count: issue.supports?.[0]?.count ?? 0,
        impact_count: 0,
        comment_count: 0
      }));
      setIssues(mapped);
      setLoading(false);
    };

    load();
  }, []);

  const since = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }, []);

  const recentIssues = useMemo(() => {
    return issues.filter((issue) => new Date(issue.created_at) >= since);
  }, [issues, since]);

  const byCategory = useMemo(() => {
    const map = new Map<string, IssueWithCounts[]>();
    recentIssues.forEach((issue) => {
      const list = map.get(issue.category) ?? [];
      list.push(issue);
      map.set(issue.category, list);
    });
    return Array.from(map.entries()).map(([category, list]) => ({
      category,
      issues: list.sort((a, b) => b.support_count - a.support_count).slice(0, 5)
    }));
  }, [recentIssues]);

  return (
    <div>
      <Header />
      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Monthly Brief</h1>
          <p className="text-sm text-slate/70">
            Top issues over the last 30 days, grouped by category.
          </p>
          <a
            href="/api/brief"
            className="mt-2 inline-flex rounded-full border border-slate/20 px-3 py-1 text-xs text-slate"
          >
            Export JSON
          </a>
        </div>

        {loading ? <p className="text-sm text-slate/60">Loading brief...</p> : null}
        {!loading && recentIssues.length === 0 ? (
          <div className="rounded-2xl border border-slate/10 bg-white p-6 text-sm text-slate/70">
            No issues in the last 30 days.
          </div>
        ) : null}

        <div className="space-y-4">
          {byCategory.map((group) => (
            <div key={group.category} className="rounded-2xl border border-slate/10 bg-white p-6 shadow-card">
              <h2 className="text-lg font-semibold text-ink">{group.category}</h2>
              <div className="mt-3 space-y-2">
                {group.issues.map((issue) => (
                  <div key={issue.id} className="flex items-center justify-between text-sm">
                    <span className="text-ink">{issue.title}</span>
                    <span className="text-slate/60">Support {issue.support_count}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

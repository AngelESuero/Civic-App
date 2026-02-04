"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "./components/Header";
import { AuthPanel } from "./components/AuthPanel";
import { IssueCard } from "./components/IssueCard";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import type { IssueWithCounts } from "../lib/types";

const sortOptions = [
  { id: "trending", label: "Trending" },
  { id: "newest", label: "Newest" },
  { id: "supported", label: "Most supported" }
] as const;

type SortId = (typeof sortOptions)[number]["id"];

export default function HomePage() {
  const [issues, setIssues] = useState<IssueWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortId>("trending");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("issues")
        .select("*, supports(count), impacts(count), comments(count)")
        .order("created_at", { ascending: false });

      if (error) {
        setIssues([]);
        setLoading(false);
        return;
      }

      const mapped = (data ?? []).map((issue) => ({
        ...issue,
        support_count: issue.supports?.[0]?.count ?? 0,
        impact_count: issue.impacts?.[0]?.count ?? 0,
        comment_count: issue.comments?.[0]?.count ?? 0
      }));
      setIssues(mapped);
      setLoading(false);
    };

    load();
  }, []);

  const sorted = useMemo(() => {
    const copy = [...issues];
    if (sortBy === "newest") {
      return copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    if (sortBy === "supported") {
      return copy.sort((a, b) => b.support_count - a.support_count);
    }
    return copy.sort((a, b) => {
      const scoreA = a.support_count * 2 + a.impact_count + a.comment_count * 0.25;
      const scoreB = b.support_count * 2 + b.impact_count + b.comment_count * 0.25;
      if (scoreB === scoreA) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return scoreB - scoreA;
    });
  }, [issues, sortBy]);

  return (
    <div>
      <Header />
      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-[1.6fr_0.8fr]">
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-semibold text-ink">Community signal, at city scale</h1>
              <p className="text-sm text-slate/70">
                Post local issues, gather support, and track responses across Newark.
              </p>
            </div>
            <div className="flex gap-2">
              {sortOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSortBy(option.id)}
                  className={`rounded-full px-3 py-1 text-xs ${
                    sortBy === option.id ? "bg-ink text-white" : "bg-white text-slate"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {loading ? <p className="text-sm text-slate/60">Loading issues...</p> : null}
          {!loading && sorted.length === 0 ? (
            <div className="rounded-2xl border border-slate/10 bg-white p-6 text-sm text-slate/70">
              No issues yet. Be the first to share a civic need.
            </div>
          ) : null}
          <div className="space-y-4">
            {sorted.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </section>
        <aside className="space-y-4">
          <AuthPanel />
          <div className="rounded-2xl border border-slate/10 bg-white p-4 shadow-card">
            <h2 className="text-base font-semibold text-ink">How it works</h2>
            <ul className="mt-2 space-y-2 text-sm text-slate/70">
              <li>Post issues tied to Newark neighborhoods or wards.</li>
              <li>Support proposals and tag impacts that affect you.</li>
              <li>Track city responses through public status updates.</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}

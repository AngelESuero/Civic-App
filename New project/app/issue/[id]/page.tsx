"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "../../components/Header";
import { supabase, isSupabaseConfigured } from "../../../lib/supabase";
import type { Comment, Issue, IssueStatus, VerificationTier } from "../../../lib/types";
import { CommentComposer, CommentThread } from "../../components/Comments";

type StatusEvent = {
  id: string;
  issue_id: string;
  actor_id: string;
  from_status: IssueStatus | null;
  to_status: IssueStatus;
  note: string | null;
  created_at: string;
};

export default function IssueDetailPage() {
  const params = useParams();
  const issueId = Array.isArray(params?.id) ? params?.id[0] : params?.id;

  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [events, setEvents] = useState<StatusEvent[]>([]);
  const [supported, setSupported] = useState(false);
  const [impacted, setImpacted] = useState(false);
  const [counts, setCounts] = useState({ support: 0, impact: 0 });
  const [tier, setTier] = useState<VerificationTier>("unverified");
  const [status, setStatus] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);

  useEffect(() => {
    if (!issueId || !isSupabaseConfigured) return;

    const load = async () => {
      const { data: issueData } = await supabase.from("issues").select("*").eq("id", issueId).maybeSingle();
      if (issueData) setIssue(issueData);

      const { data: commentData } = await supabase
        .from("comments")
        .select("*")
        .eq("issue_id", issueId)
        .order("created_at", { ascending: true });
      setComments(commentData ?? []);

      const { data: eventData } = await supabase
        .from("status_events")
        .select("*")
        .eq("issue_id", issueId)
        .order("created_at", { ascending: true });
      setEvents(eventData ?? []);

      const { count: supportCount } = await supabase
        .from("supports")
        .select("id", { count: "exact", head: true })
        .eq("issue_id", issueId);
      const { count: impactCount } = await supabase
        .from("impacts")
        .select("id", { count: "exact", head: true })
        .eq("issue_id", issueId);

      setCounts({
        support: supportCount ?? 0,
        impact: impactCount ?? 0
      });

      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("verification_tier")
          .eq("id", user.user.id)
          .maybeSingle();
        if (profile?.verification_tier) {
          setTier(profile.verification_tier);
        }

        const { data: supportRow } = await supabase
          .from("supports")
          .select("id")
          .eq("issue_id", issueId)
          .eq("user_id", user.user.id)
          .maybeSingle();
        setSupported(Boolean(supportRow));

        const { data: impactRow } = await supabase
          .from("impacts")
          .select("id")
          .eq("issue_id", issueId)
          .eq("user_id", user.user.id)
          .maybeSingle();
        setImpacted(Boolean(impactRow));
      }
    };

    load();
  }, [issueId]);

  const toggleSupport = async () => {
    if (!issueId) return;
    if (tier === "unverified") {
      setStatus("Light verification required to support issues.");
      return;
    }
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    if (supported) {
      await supabase.from("supports").delete().eq("issue_id", issueId).eq("user_id", data.user.id);
      setSupported(false);
      setCounts((prev) => ({ ...prev, support: Math.max(0, prev.support - 1) }));
    } else {
      await supabase.from("supports").insert({ issue_id: issueId, user_id: data.user.id });
      setSupported(true);
      setCounts((prev) => ({ ...prev, support: prev.support + 1 }));
    }
  };

  const toggleImpact = async () => {
    if (!issueId) return;
    if (tier === "unverified") {
      setStatus("Light verification required to tag impacts.");
      return;
    }
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    if (impacted) {
      await supabase.from("impacts").delete().eq("issue_id", issueId).eq("user_id", data.user.id);
      setImpacted(false);
      setCounts((prev) => ({ ...prev, impact: Math.max(0, prev.impact - 1) }));
    } else {
      await supabase.from("impacts").insert({ issue_id: issueId, user_id: data.user.id });
      setImpacted(true);
      setCounts((prev) => ({ ...prev, impact: prev.impact + 1 }));
    }
  };

  const handleComment = async (body: string) => {
    if (!issueId) return;
    if (cooldownUntil && Date.now() < cooldownUntil) {
      setStatus("Please wait before posting another comment.");
      return;
    }
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setStatus("Sign in required to comment.");
      return;
    }

    const { error } = await supabase.from("comments").insert({
      issue_id: issueId,
      user_id: data.user.id,
      body
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    setComments((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        issue_id: issueId,
        user_id: data.user.id,
        parent_id: null,
        body,
        created_at: new Date().toISOString()
      }
    ]);
    setCooldownUntil(Date.now() + 30000);
  };

  const handleReport = async (commentId: string) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setStatus("Sign in required to report.");
      return;
    }
    await supabase.from("reports").insert({
      reporter_id: data.user.id,
      target_type: "comment",
      target_id: commentId,
      reason: "user_report"
    });
    setStatus("Report submitted.");
  };

  if (!issueId) {
    return null;
  }

  return (
    <div>
      <Header />
      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        {issue ? (
          <section className="rounded-2xl border border-slate/10 bg-white p-6 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-ink">{issue.title}</h1>
                <p className="mt-2 text-sm text-slate/70">{issue.body}</p>
              </div>
              <span className="rounded-full bg-fog px-3 py-1 text-xs text-slate">{issue.status}</span>
            </div>
            {issue.image_url ? (
              <img
                src={issue.image_url}
                alt="Issue"
                className="mt-4 max-h-64 w-full rounded-xl object-cover"
              />
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate/70">
              <span className="rounded-full bg-fog px-2 py-1">{issue.category}</span>
              <span className="rounded-full bg-fog px-2 py-1">{issue.scope}</span>
              {issue.ward ? <span className="rounded-full bg-fog px-2 py-1">Ward {issue.ward}</span> : null}
              {issue.neighborhood ? (
                <span className="rounded-full bg-fog px-2 py-1">{issue.neighborhood}</span>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={toggleSupport}
                className={`rounded-full px-4 py-2 text-sm ${
                  supported ? "bg-ink text-white" : "border border-slate/20 text-slate"
                }`}
              >
                Support ({counts.support})
              </button>
              <button
                onClick={toggleImpact}
                className={`rounded-full px-4 py-2 text-sm ${
                  impacted ? "bg-mint text-white" : "border border-slate/20 text-slate"
                }`}
              >
                This affects me ({counts.impact})
              </button>
            </div>
          </section>
        ) : (
          <p className="text-sm text-slate/60">Loading issue...</p>
        )}

        <section className="rounded-2xl border border-slate/10 bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-ink">Status timeline</h2>
          {events.length === 0 ? (
            <p className="mt-2 text-sm text-slate/60">No status updates yet.</p>
          ) : (
            <div className="mt-3 space-y-2 text-sm text-slate/70">
              {events.map((event) => (
                <div key={event.id} className="rounded-lg bg-fog p-3">
                  <p>
                    {event.from_status ? `${event.from_status} → ` : ""}
                    <span className="font-medium text-ink">{event.to_status}</span>
                  </p>
                  {event.note ? <p className="text-xs text-slate/60">{event.note}</p> : null}
                  <p className="text-xs text-slate/50">{new Date(event.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <CommentComposer onSubmit={handleComment} disabled={Boolean(cooldownUntil && Date.now() < cooldownUntil)} />
          <CommentThread comments={comments} onReport={handleReport} />
        </section>

        {status ? <p className="text-sm text-slate/60">{status}</p> : null}
      </main>
    </div>
  );
}

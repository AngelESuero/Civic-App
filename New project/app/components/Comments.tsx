"use client";

import { useMemo } from "react";
import type { Comment } from "../../lib/types";

export function CommentThread({
  comments,
  onReport
}: {
  comments: Comment[];
  onReport: (commentId: string) => void;
}) {
  const tree = useMemo(() => {
    const map = new Map<string, Comment & { children: Comment[] }>();
    const roots: (Comment & { children: Comment[] })[] = [];
    comments.forEach((comment) => {
      map.set(comment.id, { ...comment, children: [] });
    });
    map.forEach((comment) => {
      if (comment.parent_id && map.has(comment.parent_id)) {
        map.get(comment.parent_id)!.children.push(comment);
      } else {
        roots.push(comment);
      }
    });
    return roots;
  }, [comments]);

  const renderNode = (node: Comment & { children: Comment[] }, depth: number) => {
    return (
      <div key={node.id} className={`rounded-xl border border-slate/10 bg-white p-3 ${depth ? "ml-4" : ""}`}>
        <p className="text-sm text-ink">{node.body}</p>
        <div className="mt-2 flex items-center gap-3 text-xs text-slate/60">
          <span>{new Date(node.created_at).toLocaleString()}</span>
          <button onClick={() => onReport(node.id)} className="text-amber">
            Report
          </button>
        </div>
        {node.children.length > 0 ? (
          <div className="mt-3 space-y-2">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        ) : null}
      </div>
    );
  };

  if (comments.length === 0) {
    return <p className="text-sm text-slate/60">No comments yet. Be the first to add context.</p>;
  }

  return <div className="space-y-3">{tree.map((node) => renderNode(node, 0))}</div>;
}

export function CommentComposer({
  onSubmit,
  disabled
}: {
  onSubmit: (body: string, parentId?: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate/10 bg-white p-4 shadow-card">
      <h3 className="text-sm font-semibold text-ink">Add a comment</h3>
      <textarea
        id="comment-body"
        className="mt-2 w-full rounded-lg border border-slate/20 px-3 py-2 text-sm"
        rows={3}
        placeholder="Share context, ask a question, or add support."
      />
      <button
        onClick={() => {
          const el = document.getElementById("comment-body") as HTMLTextAreaElement | null;
          if (!el) return;
          const value = el.value.trim();
          if (!value) return;
          onSubmit(value);
          el.value = "";
        }}
        disabled={disabled}
        className="mt-2 rounded-lg bg-ink px-3 py-2 text-sm text-white disabled:opacity-60"
      >
        Post comment
      </button>
    </div>
  );
}

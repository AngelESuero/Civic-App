"use client";

import { useEffect, useState } from "react";
import { Header } from "../../components/Header";
import { supabase, isSupabaseConfigured } from "../../../lib/supabase";
import type { IssueScope, VerificationTier } from "../../../lib/types";

const categories = [
  "Public safety",
  "Transit",
  "Housing",
  "Cleanliness",
  "Education",
  "Health",
  "Jobs",
  "Parks"
];

export default function NewIssuePage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [scope, setScope] = useState<IssueScope>("citywide");
  const [ward, setWard] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [tier, setTier] = useState<VerificationTier>("unverified");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const loadTier = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      await supabase.from("users").upsert({
        id: data.user.id,
        verification_tier: "unverified"
      });
      const { data: profile } = await supabase
        .from("users")
        .select("verification_tier")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profile?.verification_tier) {
        setTier(profile.verification_tier);
      }
    };
    loadTier();
  }, []);

  const handleSubmit = async () => {
    if (!title || !body) {
      setStatus("Title and description are required.");
      return;
    }
    if (tier === "unverified") {
      setStatus("Light verification required to post issues.");
      return;
    }

    setLoading(true);
    setStatus(null);
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setStatus("Sign in required.");
      setLoading(false);
      return;
    }

    let imageUrl: string | null = null;
    if (imageFile) {
      const path = `${data.user.id}/${Date.now()}-${imageFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("issue-images")
        .upload(path, imageFile, { upsert: true });
      if (uploadError) {
        setStatus(uploadError.message);
        setLoading(false);
        return;
      }
      const { data: publicData } = supabase.storage.from("issue-images").getPublicUrl(path);
      imageUrl = publicData.publicUrl;
    }

    const { error } = await supabase.from("issues").insert({
      user_id: data.user.id,
      title,
      body,
      category,
      scope,
      ward: ward || null,
      neighborhood: neighborhood || null,
      status: "Submitted",
      image_url: imageUrl
    });

    if (error) {
      setStatus(error.message);
      setLoading(false);
      return;
    }

    setStatus("Issue posted.");
    setTitle("");
    setBody("");
    setWard("");
    setNeighborhood("");
    setImageFile(null);
    setLoading(false);
  };

  return (
    <div>
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-2xl font-semibold text-ink">Post a civic issue</h1>
        <p className="text-sm text-slate/70">
          Light verification required. Keep it actionable and specific to Newark.
        </p>
        <div className="mt-6 space-y-4 rounded-2xl border border-slate/10 bg-white p-6 shadow-card">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Issue title"
            className="w-full rounded-lg border border-slate/20 px-3 py-2"
          />
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Describe the issue, location, and suggested action."
            className="w-full rounded-lg border border-slate/20 px-3 py-2"
            rows={6}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-lg border border-slate/20 px-3 py-2"
            >
              {categories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              value={scope}
              onChange={(event) => setScope(event.target.value as IssueScope)}
              className="rounded-lg border border-slate/20 px-3 py-2"
            >
              <option value="citywide">Citywide</option>
              <option value="ward">Ward</option>
              <option value="local">Local</option>
            </select>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={ward}
              onChange={(event) => setWard(event.target.value)}
              placeholder="Ward (optional)"
              className="rounded-lg border border-slate/20 px-3 py-2"
            />
            <input
              value={neighborhood}
              onChange={(event) => setNeighborhood(event.target.value)}
              placeholder="Neighborhood (optional)"
              className="rounded-lg border border-slate/20 px-3 py-2"
            />
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg bg-ink px-4 py-2 text-white disabled:opacity-60"
          >
            Submit issue
          </button>
          {status ? <p className="text-sm text-slate/60">{status}</p> : null}
          {tier === "unverified" ? (
            <p className="text-xs text-amber">
              Upgrade to Light verification in the home page panel to post.
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}

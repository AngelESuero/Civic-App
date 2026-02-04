"use client";

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import type { VerificationTier } from "../../lib/types";
import { NEWARK_ZIPS } from "../../lib/newark";

const tierLabels: Record<VerificationTier, string> = {
  unverified: "Unverified",
  light: "Light verified",
  strong: "Strong verified"
};

export function AuthPanel() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [zip, setZip] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [tier, setTier] = useState<VerificationTier>("unverified");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const sync = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
        const { data: profile } = await supabase
          .from("users")
          .select("verification_tier, zipcode")
          .eq("id", data.user.id)
          .maybeSingle();
        if (profile?.verification_tier) {
          setTier(profile.verification_tier);
          setZip(profile.zipcode ?? "");
        }
      } else {
        setUserId(null);
        setTier("unverified");
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      sync();
    });

    sync();

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async () => {
    if (!email) return;
    setLoading(true);
    setStatus(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined
      }
    });
    setLoading(false);
    if (error) {
      setStatus(error.message);
    } else {
      setStatus("Check your email for a magic sign-in link.");
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const ensureProfile = async (uid: string) => {
    await supabase.from("users").upsert({
      id: uid,
      verification_tier: tier,
      zipcode: zip || null
    });
  };

  const verifyLight = async () => {
    if (!userId) return;
    if (!NEWARK_ZIPS.has(zip)) {
      setStatus("ZIP must be a Newark ZIP code.");
      return;
    }
    if (!phone) {
      setStatus("Phone number is required for light verification.");
      return;
    }

    setLoading(true);
    setStatus(null);
    setTier("light");
    await supabase.from("users").upsert({
      id: userId,
      verification_tier: "light",
      zipcode: zip
    });
    setStatus("Light verification activated. Phone is not stored.");
    setLoading(false);
  };

  useEffect(() => {
    if (!userId) return;
    ensureProfile(userId);
  }, [userId]);

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-2xl border border-amber/30 bg-amber/10 p-4 text-sm text-slate">
        Supabase is not configured. Add env vars to enable auth.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate/10 bg-white p-4 shadow-card">
      <h2 className="text-base font-semibold text-ink">Your Civic Passport</h2>
      <p className="text-sm text-slate/70">Tier: {tierLabels[tier]}</p>
      {userId ? (
        <div className="mt-3 space-y-3 text-sm">
          <button
            onClick={signOut}
            className="rounded-full border border-slate/20 px-3 py-1.5 text-slate"
          >
            Sign out
          </button>
          <div className="rounded-xl bg-fog p-3">
            <p className="font-medium text-ink">Upgrade to Light Verified</p>
            <p className="text-xs text-slate/70">
              Confirm a Newark ZIP and phone. We do not store your phone number.
            </p>
            <div className="mt-2 flex flex-col gap-2">
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Phone"
                className="rounded-lg border border-slate/20 px-3 py-2"
              />
              <input
                value={zip}
                onChange={(event) => setZip(event.target.value)}
                placeholder="Newark ZIP"
                className="rounded-lg border border-slate/20 px-3 py-2"
              />
              <button
                onClick={verifyLight}
                disabled={loading}
                className="rounded-lg bg-ink px-3 py-2 text-white disabled:opacity-60"
              >
                Verify (Light)
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-slate/10 p-3 text-xs text-slate/70">
            Strong verification is coming soon.
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-2 text-sm">
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
            className="w-full rounded-lg border border-slate/20 px-3 py-2"
          />
          <button
            onClick={signIn}
            disabled={loading}
            className="w-full rounded-lg bg-ink px-3 py-2 text-white disabled:opacity-60"
          >
            Sign in with magic link
          </button>
        </div>
      )}
      {status ? <p className="mt-3 text-xs text-slate/60">{status}</p> : null}
    </div>
  );
}

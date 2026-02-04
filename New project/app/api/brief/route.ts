import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data, error } = await supabase
    .from("issues")
    .select("*, supports(count)")
    .gte("created_at", since.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const mapped = (data ?? []).map((issue) => ({
    ...issue,
    support_count: issue.supports?.[0]?.count ?? 0
  }));

  const byCategory: Record<string, typeof mapped> = {};
  mapped.forEach((issue) => {
    const key = issue.category || "Other";
    if (!byCategory[key]) byCategory[key] = [];
    byCategory[key].push(issue);
  });

  Object.keys(byCategory).forEach((key) => {
    byCategory[key] = byCategory[key].sort((a, b) => b.support_count - a.support_count);
  });

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    window_days: 30,
    categories: byCategory
  });
}

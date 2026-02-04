import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { IssueStatus } from "../../../../lib/types";

const allowedStatuses: IssueStatus[] = [
  "Submitted",
  "Under review",
  "Responded",
  "In progress",
  "Resolved"
];

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const adminIds = (process.env.ADMIN_USER_IDS || "").split(",").map((id) => id.trim());

  if (!serviceRoleKey) {
    return NextResponse.json({ error: "Service role key missing" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return NextResponse.json({ error: "Authorization token required" }, { status: 401 });
  }

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
  const { data: userData } = await supabaseAuth.auth.getUser(token);

  if (!userData.user || !adminIds.includes(userData.user.id)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const payload = await request.json();
  const { issue_id, to_status, note } = payload as {
    issue_id: string;
    to_status: IssueStatus;
    note?: string;
  };

  if (!issue_id || !allowedStatuses.includes(to_status)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const { data: issue } = await supabaseAdmin
    .from("issues")
    .select("status")
    .eq("id", issue_id)
    .maybeSingle();

  const fromStatus = issue?.status ?? null;

  const { error: updateError } = await supabaseAdmin
    .from("issues")
    .update({ status: to_status })
    .eq("id", issue_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: eventError } = await supabaseAdmin.from("status_events").insert({
    issue_id,
    actor_id: userData.user.id,
    from_status: fromStatus,
    to_status,
    note: note ?? null
  });

  if (eventError) {
    return NextResponse.json({ error: eventError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

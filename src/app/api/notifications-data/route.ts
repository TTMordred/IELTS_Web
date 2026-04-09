import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { NotificationRow } from "@/app/(app)/notifications/actions";

const ACHIEVEMENT_LEVELS = [5, 10, 20, 30, 40, 50];

async function alreadyNotifiedToday(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  type: string
): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("type", type)
    .gte("created_at", `${today}T00:00:00.000Z`)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function alreadyNotifiedThisWeek(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  type: string
): Promise<boolean> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { data } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("type", type)
    .gte("created_at", weekAgo.toISOString())
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function alreadyNotifiedAchievement(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  level: number
): Promise<boolean> {
  const { data } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "achievement_unlocked")
    .contains("metadata", { level })
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];

  const [profile, vocabDue, lastWriting, dailyActivityToday] = await Promise.all([
    supabase
      .from("profiles")
      .select("current_streak, total_xp")
      .eq("id", user.id)
      .single(),
    supabase
      .from("vocab_cards")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .lte("next_review", today),
    supabase
      .from("writing_entries")
      .select("date")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(1),
    supabase
      .from("daily_activity")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", today)
      .limit(1),
  ]);

  const inserts: Omit<NotificationRow, "id" | "user_id" | "created_at">[] = [];

  // streak_at_risk: has a streak but no activity today
  const streak = profile.data?.current_streak ?? 0;
  const activeToday = (dailyActivityToday.data?.length ?? 0) > 0;
  if (streak > 0 && !activeToday) {
    const already = await alreadyNotifiedToday(supabase, user.id, "streak_at_risk");
    if (!already) {
      inserts.push({
        type: "streak_at_risk",
        title: "Streak at risk!",
        message: `Your ${streak}-day streak is in danger. Log something today to keep it alive.`,
        read: false,
        metadata: { streak },
      });
    }
  }

  // vocab_review_due: cards overdue
  const vocabCount = vocabDue.count ?? 0;
  if (vocabCount > 0) {
    const already = await alreadyNotifiedToday(supabase, user.id, "vocab_review_due");
    if (!already) {
      inserts.push({
        type: "vocab_review_due",
        title: "Vocab review due",
        message: `${vocabCount} vocab card${vocabCount > 1 ? "s" : ""} ${vocabCount > 1 ? "are" : "is"} due for review.`,
        read: false,
        metadata: { count: vocabCount },
      });
    }
  }

  // writing_reminder: no writing entry in last 7 days
  if (lastWriting.data) {
    const lastDate = lastWriting.data[0]?.date;
    if (lastDate) {
      const daysSince = Math.floor(
        (new Date().getTime() - new Date(lastDate).getTime()) / 86400000
      );
      if (daysSince >= 7) {
        const already = await alreadyNotifiedThisWeek(supabase, user.id, "writing_reminder");
        if (!already) {
          inserts.push({
            type: "writing_reminder",
            title: "Writing practice needed",
            message: `You haven't logged a writing entry in ${daysSince} days. Keep your skills sharp!`,
            read: false,
            metadata: { daysSince },
          });
        }
      }
    }
  }

  // achievement_unlocked: XP level milestones
  const totalXp = profile.data?.total_xp ?? 0;
  const { LEVEL_THRESHOLDS } = await import("@/lib/constants/gamification");
  for (const milestoneLevel of ACHIEVEMENT_LEVELS) {
    const threshold = LEVEL_THRESHOLDS.find((t) => t.level === milestoneLevel);
    if (!threshold) continue;
    if (totalXp >= threshold.xp) {
      const already = await alreadyNotifiedAchievement(supabase, user.id, milestoneLevel);
      if (!already) {
        inserts.push({
          type: "achievement_unlocked",
          title: `Level ${milestoneLevel} reached!`,
          message: `You've reached Level ${milestoneLevel} — ${threshold.title}! Keep up the amazing work.`,
          read: false,
          metadata: { level: milestoneLevel, xp: totalXp },
        });
      }
    }
  }

  // Insert new notifications
  if (inserts.length > 0) {
    await supabase.from("notifications").insert(
      inserts.map((n) => ({ ...n, user_id: user.id }))
    );
  }

  // Return current notifications
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const rows = (notifications ?? []) as NotificationRow[];
  const unreadCount = rows.filter((n) => !n.read).length;

  return NextResponse.json({ notifications: rows, unreadCount });
}

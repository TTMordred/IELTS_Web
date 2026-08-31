"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { addDays, getTodayDateString } from "@/lib/planner/date";
import type { ModuleKey } from "@/lib/planner/modules";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  getAccessToken,
  getCalendarEvent,
  listCalendarEvents,
  sessionEventTitle,
  updateCalendarEvent,
  type ParsedGcalEvent,
} from "@/lib/gcal";

export type PlanItem = {
  id: string;
  user_id: string;
  date: string;
  module: ModuleKey | null;
  topic: string | null;
  duration_min: number;
  completed: boolean;
  gcal_event_id: string | null;
  created_at: string;
};

export type AddPlanItemInput = {
  date: string;
  module: ModuleKey;
  topic?: string;
  duration_min?: number;
};

export async function getWeekPlan(weekStart: string): Promise<PlanItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const weekEnd = addDays(weekStart, 6);

  const { data, error } = await supabase
    .from("study_plan_items")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", weekStart)
    .lte("date", weekEnd)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []) as PlanItem[];
}

export async function addPlanItem(input: AddPlanItemInput): Promise<PlanItem> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("study_plan_items")
    .insert({
      user_id: user.id,
      date: input.date,
      module: input.module,
      topic: input.topic || null,
      duration_min: input.duration_min ?? 30,
    })
    .select()
    .single();
  if (error) throw error;
  const item = data as PlanItem;

  // Best-effort: push the session to the user's calendar.
  try {
    const token = await getAccessToken();
    if (token) {
      const eventId = await createCalendarEvent({
        accessToken: token.accessToken,
        summary: sessionEventTitle(item.module, item.topic),
        date: item.date,
        sessionId: item.id,
      });
      const { data: updated, error: updErr } = await supabase
        .from("study_plan_items")
        .update({ gcal_event_id: eventId })
        .eq("id", item.id)
        .select()
        .single();
      if (!updErr && updated) {
        revalidatePath("/planner");
        return updated as PlanItem;
      }
    }
  } catch (err) {
    // Local session stays; the backfill button covers it later.
    console.error("gcal auto-sync create:", err);
  }

  revalidatePath("/planner");
  return item;
}

export async function togglePlanItem(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: item, error: fetchError } = await supabase
    .from("study_plan_items")
    .select("completed, module, topic, gcal_event_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (fetchError) throw fetchError;

  const completed = !item.completed;
  const { error } = await supabase
    .from("study_plan_items")
    .update({ completed })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;

  if (item.gcal_event_id) {
    try {
      const token = await getAccessToken();
      if (token) {
        const summary = sessionEventTitle(item.module, item.topic);
        await updateCalendarEvent({
          accessToken: token.accessToken,
          eventId: item.gcal_event_id,
          summary: completed ? `✓ ${summary}` : summary,
        });
      }
    } catch (err) {
      console.error("gcal auto-sync toggle:", err);
    }
  }
  revalidatePath("/planner");
}

export async function deletePlanItem(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: item, error: fetchError } = await supabase
    .from("study_plan_items")
    .select("gcal_event_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (fetchError) throw fetchError;

  if (item?.gcal_event_id) {
    try {
      const token = await getAccessToken();
      if (token) {
        await deleteCalendarEvent({
          accessToken: token.accessToken,
          eventId: item.gcal_event_id,
        });
      }
    } catch (err) {
      console.error("gcal auto-sync delete:", err);
    }
  }

  const { error } = await supabase
    .from("study_plan_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/planner");
}

/** Fully disconnect: wipe all planner sessions, delete pushed Google Calendar
 * events (best-effort), and remove the stored Google tokens so reconnecting
 * starts fresh. */
export async function disconnectGoogleCalendar(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Grab a valid access token before deleting tokens, so Google events can
  // still be removed from the user's calendar.
  const token = await getAccessToken();

  // Delete the calendar events we pushed for this user (best-effort).
  if (token) {
    const { data: items } = await supabase
      .from("study_plan_items")
      .select("gcal_event_id")
      .eq("user_id", user.id)
      .not("gcal_event_id", "is", null);

    for (const item of items ?? []) {
      if (!item.gcal_event_id) continue;
      try {
        await deleteCalendarEvent({
          accessToken: token.accessToken,
          eventId: item.gcal_event_id,
        });
      } catch (err) {
        console.error("gcal disconnect delete event:", err);
      }
    }
  }

  // Wipe the planner so it starts fresh on the next connection.
  const { error: wipeError } = await supabase
    .from("study_plan_items")
    .delete()
    .eq("user_id", user.id);
  if (wipeError) throw wipeError;

  // Remove the stored Google tokens so the header falls back to "Connect".
  const { error } = await supabase
    .from("user_google_tokens")
    .delete()
    .eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/planner");
}

export type GcalReconcileResult = {
  syncedDates: number;
  deletedSessions: number;
  deletedOrphans: number;
};

/**
 * Two-way reconcile for a range of Google events against planner sessions.
 *
 * Google is the source of truth for markers and dates:
 * - Events carrying the app's marker are linked back into the planner
 *   (gcal_event_id backfilled if missing; the session date follows the event).
 * - An app-created event whose session no longer exists is deleted (orphan).
 * - A session whose Google event is gone (verified with a direct GET so a
 *   merely-moved event is never misread) is removed from the planner.
 */
async function reconcileGcalRange(opts: {
  accessToken: string;
  timeMin: string;
  timeMax: string;
  dateMin: string;
  dateMax: string;
}): Promise<GcalReconcileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const result: GcalReconcileResult = {
    syncedDates: 0,
    deletedSessions: 0,
    deletedOrphans: 0,
  };
  if (!user) return result;

  let events: ParsedGcalEvent[];
  try {
    events = await listCalendarEvents({
      accessToken: opts.accessToken,
      timeMin: opts.timeMin,
      timeMax: opts.timeMax,
    });
  } catch (err) {
    console.error("gcal reconcile:", err);
    return result;
  }

  const eventIdsInRange = new Set(events.map((e) => e.eventId).filter(Boolean));

  // Marker events: link/backfill + date sync (calendar wins), or orphan cleanup.
  for (const ev of events) {
    if (!ev.sessionId || !ev.date || !ev.eventId) continue;

    const { data: s } = await supabase
      .from("study_plan_items")
      .select("id, date, gcal_event_id")
      .eq("id", ev.sessionId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!s) {
      try {
        await deleteCalendarEvent({
          accessToken: opts.accessToken,
          eventId: ev.eventId,
        });
        result.deletedOrphans += 1;
      } catch (err) {
        console.error("gcal orphan cleanup:", err);
      }
      continue;
    }
    if (!s.gcal_event_id) {
      await supabase
        .from("study_plan_items")
        .update({ gcal_event_id: ev.eventId })
        .eq("id", s.id);
    }
    if (s.date !== ev.date) {
      await supabase
        .from("study_plan_items")
        .update({ date: ev.date })
        .eq("id", s.id);
      result.syncedDates += 1;
    }
  }

  // Deleted detection: sessions whose event is outside the fetched range get a
  // direct GET probe; a 404 means the user deleted it in Google → remove the
  // session so the planner mirrors the calendar.
  const { data: rows, error: rowsError } = await supabase
    .from("study_plan_items")
    .select("id, gcal_event_id")
    .eq("user_id", user.id)
    .not("gcal_event_id", "is", null)
    .gte("date", opts.dateMin)
    .lte("date", opts.dateMax);
  if (!rowsError) {
    for (const row of rows ?? []) {
      const gcalId = row.gcal_event_id as string;
      if (!gcalId || eventIdsInRange.has(gcalId)) continue;
      try {
        const exists = await getCalendarEvent({
          accessToken: opts.accessToken,
          eventId: gcalId,
        });
        if (!exists) {
          await supabase
            .from("study_plan_items")
            .delete()
            .eq("id", row.id)
            .eq("user_id", user.id);
          result.deletedSessions += 1;
        }
      } catch (err) {
        console.error("gcal deleted-detection:", err);
      }
    }
  }

  return result;
}

/** Reconcile the visible week (calendar wins on dates; deletions propagate). */
export async function reconcileCalendarDates(weekStart: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const token = await getAccessToken();
  if (!token) return;

  await reconcileGcalRange({
    accessToken: token.accessToken,
    timeMin: new Date(`${weekStart}T00:00:00`).toISOString(),
    timeMax: new Date(`${addDays(weekStart, 7)}T00:00:00`).toISOString(),
    dateMin: weekStart,
    dateMax: addDays(weekStart, 6),
  });
  // NOTE: no revalidatePath here — this runs during page render (PlannerPage),
  // which re-renders fresh data immediately after. Revalidating during render
  // throws in Next.js 16.
}

/** Full two-way scan of the user's calendar. Runs once after connecting. */
export async function reconcileAllCalendarEvents(): Promise<GcalReconcileResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const token = await getAccessToken();
  if (!token) throw new Error("Google Calendar not connected");

  const today = getTodayDateString();
  const dateMin = addDays(today, -365);
  const dateMax = addDays(today, 365);

  return reconcileGcalRange({
    accessToken: token.accessToken,
    timeMin: new Date(`${dateMin}T00:00:00`).toISOString(),
    timeMax: new Date(`${addDays(dateMax, 1)}T00:00:00`).toISOString(),
    dateMin,
    dateMax,
  });
}

/** Push every session that has no calendar event yet. Used by the backfill button. */
export async function syncAllSessionsToCalendar(): Promise<{ synced: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const token = await getAccessToken();
  if (!token) throw new Error("Google Calendar not connected");

  const { data: rows, error } = await supabase
    .from("study_plan_items")
    .select("id, date, module, topic, gcal_event_id")
    .eq("user_id", user.id)
    .is("gcal_event_id", null);
  if (error) throw error;

  let synced = 0;
  for (const row of rows ?? []) {
    try {
      const eventId = await createCalendarEvent({
        accessToken: token.accessToken,
        summary: sessionEventTitle(row.module, row.topic),
        date: row.date,
        sessionId: row.id,
      });
      await supabase
        .from("study_plan_items")
        .update({ gcal_event_id: eventId })
        .eq("id", row.id);
      synced += 1;
    } catch (err) {
      console.error("gcal backfill:", err);
    }
  }
  revalidatePath("/planner");
  return { synced };
}


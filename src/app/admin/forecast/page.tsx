import { checkIsAdmin } from "../actions";
import { createClient } from "@/lib/supabase/server";
import { ForecastManager } from "@/components/topics/forecast-manager";

export default async function ForecastPage() {
  await checkIsAdmin();

  const supabase = await createClient();
  const { data: forecasts } = await supabase
    .from("global_topics")
    .select("*")
    .eq("is_forecast", true)
    .order("part")
    .order("name");

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="heading-lg">Forecast Topics</h1>
        <p className="text-[var(--color-ink-secondary)] mt-1">
          Manage IELTS Speaking forecast topics by quarter. {(forecasts || []).length} forecast topics.
        </p>
      </div>
      <ForecastManager initialTopics={forecasts || []} />
    </div>
  );
}

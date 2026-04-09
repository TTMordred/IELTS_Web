"use client";

import { useDashboardWidgets } from "./dashboard-toggles";

type Props = {
  widgetId: string;
  children: React.ReactNode;
};

/**
 * Client wrapper that hides/shows a dashboard widget based on the user's
 * toggle settings (stored in localStorage via useDashboardWidgets).
 * Children are server-rendered; this component controls visibility client-side.
 */
export function WidgetSection({ widgetId, children }: Props) {
  const { isVisible } = useDashboardWidgets();
  if (!isVisible(widgetId)) return null;
  return <>{children}</>;
}

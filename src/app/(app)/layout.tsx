import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getAuthUser } from "@/lib/supabase/cached-auth";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();

  if (!user) {
    redirect("/auth");
  }

  // Fetch user profile
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("id", user.id)
    .single();

  return <AppShell user={user} profile={profile}>{children}</AppShell>;
}

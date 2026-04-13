import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getAuthUser } from "@/lib/supabase/cached-auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();

  if (!user) {
    redirect("/auth");
  }

  return <AppShell>{children}</AppShell>;
}

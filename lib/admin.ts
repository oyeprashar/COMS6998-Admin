import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) redirect("/");
  const { data: isAdmin, error: adminError } = await supabase.rpc("is_superadmin");
  if (adminError || isAdmin !== true) redirect("/unauthorized");
  return supabase;
}

export async function requireAdminAction() {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error("Authentication required");
  const { data: isAdmin, error: adminError } = await supabase.rpc("is_superadmin");
  if (adminError || isAdmin !== true) throw new Error("Administrator access required");
  return supabase;
}

"use server";

import { requireAdminAction } from "@/lib/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function fields(formData: FormData) {
  const term = formData.get("term");
  const description = formData.get("description");
  const active = formData.get("is_active");
  if (typeof term !== "string" || !term.trim() || term.trim().length > 200) throw new Error("Term must contain 1–200 characters");
  if (typeof description !== "string" || description.length > 5000) throw new Error("Description is invalid");
  return { term: term.trim(), description: description.trim() || null, is_active: active === "on" };
}
function idFrom(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error("Invalid term ID");
  return id;
}
function finish() {
  revalidatePath("/dashboard/terms");
  redirect("/dashboard/terms");
}
export async function createTerm(formData: FormData) {
  const supabase = await requireAdminAction();
  const { error } = await supabase.from("terms").insert(fields(formData));
  if (error) throw new Error(error.message);
  finish();
}
export async function updateTerm(formData: FormData) {
  const supabase = await requireAdminAction();
  const id = idFrom(formData);
  const { data, error } = await supabase.from("terms").update(fields(formData)).eq("id", id).select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("Term not found");
  finish();
}
export async function deleteTerm(formData: FormData) {
  const supabase = await requireAdminAction();
  const id = idFrom(formData);
  const { data, error } = await supabase.from("terms").delete().eq("id", id).select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("Term not found");
  finish();
}

"use server";
import { requireAdminAction } from "@/lib/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const base = "/dashboard/ai-generation-examples";
function required(form: FormData, key: string, max = 10000) {
  const input = form.get(key);
  if (typeof input !== "string" || !input.trim() || input.trim().length > max) {
    throw new Error("Invalid " + key);
  }
  return input.trim();
}
function optional(form: FormData, key: string, max = 10000) {
  const input = form.get(key);
  if (typeof input !== "string" || input.length > max) throw new Error("Invalid " + key);
  return input.trim() || null;
}
function uuid(value: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error("Invalid record ID");
  }
  return value;
}
function payload(form: FormData) {
  const chain = optional(form, "prompt_chain_id", 40);
  return {
    title: required(form, "title", 200),
    input_text: required(form, "input_text"),
    expected_output: required(form, "expected_output"),
    notes: optional(form, "notes"),
    prompt_chain_id: chain ? uuid(chain) : null,
  };
}
function fail(code?: string): never {
  redirect(base + "?error=" + (code === "23503" ? "reference" : code === "23505" ? "duplicate" : "save"));
}
function success(value: string): never {
  revalidatePath(base);
  redirect(base + "?success=" + value);
}
export async function createExample(form: FormData) {
  const db = await requireAdminAction();
  const { error } = await db.from("ai_generation_examples").insert(payload(form));
  if (error) fail(error.code);
  success("created");
}
export async function updateExample(form: FormData) {
  const db = await requireAdminAction();
  const id = uuid(required(form, "id", 40));
  const { data, error } = await db.from("ai_generation_examples")
    .update(payload(form)).eq("id", id).select("id");
  if (error) fail(error.code);
  if (!data?.length) redirect(base + "?error=missing");
  success("updated");
}
export async function deleteExample(form: FormData) {
  const db = await requireAdminAction();
  const id = uuid(required(form, "id", 40));
  const { data, error } = await db.from("ai_generation_examples")
    .delete().eq("id", id).select("id");
  if (error) fail(error.code);
  if (!data?.length) redirect(base + "?error=missing");
  success("deleted");
}

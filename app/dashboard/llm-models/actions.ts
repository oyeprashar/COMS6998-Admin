"use server";
import { requireAdminAction } from "@/lib/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
const base = "/dashboard/llm-models";
const table = "llm_models";
function str(form: FormData, key: string) {
  const v = form.get(key);
  if(typeof v !== "string" || v.trim().length > 200) throw new Error("Invalid " + key);
  return v.trim();
}
function uuid(form: FormData, key: string) {
  const v = str(form,key);
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) throw new Error("Invalid " + key);
  return v;
}
function data(form: FormData) {
  const name = str(form,"name");
  if(!name) throw new Error("Name is required");
  const model_identifier = str(form,"model_identifier");
  if(!model_identifier) throw new Error("Model identifier required");
  return { name, model_identifier, llm_provider_id: uuid(form,"llm_provider_id"), is_active: form.get("is_active") === "on" };
}
function done(operation:string): never { revalidatePath(base); redirect(base+"?success="+operation); }
function failure(code?:string): never {
  redirect(base+"?error="+(code==="23505"?"duplicate":code==="23503"?"referenced":"save"));
}
export async function createRecord(form:FormData) {
  const db = await requireAdminAction();
  const {error}=await db.from(table).insert(data(form));
  if(error) failure(error.code);
  done("created");
}
export async function updateRecord(form:FormData) {
  const db = await requireAdminAction();
  const {data:rows,error}=await db.from(table).update(data(form)).eq("id",uuid(form,"id")).select("id");
  if(error) failure(error.code);
  if(!rows?.length) redirect(base+"?error=not_found");
  done("updated");
}
export async function deleteRecord(form:FormData) {
  const db = await requireAdminAction();
  const {data:rows,error}=await db.from(table).delete().eq("id",uuid(form,"id")).select("id");
  if(error) failure(error.code);
  if(!rows?.length) redirect(base+"?error=not_found");
  done("deleted");
}

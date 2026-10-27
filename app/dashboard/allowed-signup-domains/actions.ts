"use server";
import { requireAdminAction } from "@/lib/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
const base = "/dashboard/allowed-signup-domains";
const table = "allowed_signup_domains";
function getId(form: FormData) {
 const id = form.get("id");
 if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error("Invalid id");
 return id;
}
function payload(form: FormData) {
 const raw = form.get("domain");
 if(typeof raw !== "string") throw new Error("Invalid domain");
 const value = raw.trim().toLowerCase();
 if (!value || value.length > 254 || ! /^(?=.{1,253}$)[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(value)) throw new Error("Invalid domain");
 return { domain: value, is_active: form.get("is_active") === "on" };
}
function done(result: string): never { revalidatePath(base); redirect(base + "?success=" + result); }
function fail(code?:string): never { redirect(base+"?error="+(code==="23505"?"duplicate":"save")); }
export async function createEntry(form: FormData) {
 const db=await requireAdminAction();
 const {error}=await db.from(table).insert(payload(form));
 if(error) fail(error.code);
 done("created");
}
export async function updateEntry(form: FormData) {
 const db=await requireAdminAction();
 const {data,error}=await db.from(table).update(payload(form)).eq("id",getId(form)).select("id");
 if(error) fail(error.code);
 if(!data?.length) redirect(base+"?error=missing");
 done("updated");
}
export async function deleteEntry(form: FormData) {
 const db=await requireAdminAction();
 const {data,error}=await db.from(table).delete().eq("id",getId(form)).select("id");
 if(error) fail(error.code);
 if(!data?.length) redirect(base+"?error=missing");
 done("deleted");
}

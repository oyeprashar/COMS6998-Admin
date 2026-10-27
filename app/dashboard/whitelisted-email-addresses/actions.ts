"use server";
import { requireSuperadminAction } from "@/lib/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
const base = "/dashboard/whitelisted-email-addresses";
const table = "whitelisted_email_addresses";
function getId(form: FormData) {
 const id = form.get("id");
 if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error("Invalid id");
 return id;
}
function payload(form: FormData) {
 const raw = form.get("email");
 if(typeof raw !== "string") throw new Error("Invalid email");
 const value = raw.trim().toLowerCase();
 if (!value || value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error("Invalid email");
 return { email: value, is_active: form.get("is_active") === "on" };
}
function done(result: string): never { revalidatePath(base); redirect(base + "?success=" + result); }
function fail(code?:string): never { redirect(base+"?error="+(code==="23505"?"duplicate":"save")); }
export async function createEntry(form: FormData) {
 const db=await requireSuperadminAction();
 const {error}=await db.from(table).insert(payload(form));
 if(error) fail(error.code);
 done("created");
}
export async function updateEntry(form: FormData) {
 const db=await requireSuperadminAction();
 const {data,error}=await db.from(table).update(payload(form)).eq("id",getId(form)).select("id");
 if(error) fail(error.code);
 if(!data?.length) redirect(base+"?error=missing");
 done("updated");
}
export async function deleteEntry(form: FormData) {
 const db=await requireSuperadminAction();
 const {data,error}=await db.from(table).delete().eq("id",getId(form)).select("id");
 if(error) fail(error.code);
 if(!data?.length) redirect(base+"?error=missing");
 done("deleted");
}

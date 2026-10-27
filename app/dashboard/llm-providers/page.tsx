import { connection } from "next/server";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import SubmitButton from "@/app/dashboard/terms/submit-button";
import { createRecord,updateRecord,deleteRecord } from "./actions";
type RecordItem = { id:string; name:string; is_active:boolean; description:string|null };

export default async function Page({searchParams}:{searchParams:Promise<{error?:string;success?:string}>}) {
  await connection();
  const db=await requireAdmin();
  const [records, providers]=await Promise.all([
    db.from("llm_providers").select("id,name,is_active,description").order("name"),
    Promise.resolve(null)
  ]);
   
  const items=(records.data??[]) as RecordItem[];
  const {error,success}=await searchParams;
  return <main className="min-h-screen bg-black p-8 text-white md:p-12"><div className="mx-auto max-w-5xl">
    <Link href="/dashboard" className="text-purple-400 hover:underline">← Back to Dashboard</Link>
    <h1 className="mt-6 text-4xl font-bold">LLM Providers</h1>
    <p className="mt-3 text-gray-400">Create, read, update, and delete LLM providers.</p>
    {success && ["created","updated","deleted"].includes(success) && <p role="status" className="mt-5 rounded-lg border border-green-800 bg-green-950/30 p-4 text-green-300">Provider {success} successfully.</p>}
    {error && <p role="alert" className="mt-5 rounded-lg border border-red-800 bg-red-950/30 p-4 text-red-300">{error==="duplicate"?"A matching record already exists.":error==="referenced"?"This record is in use by other records.":error==="not_found"?"Record not found.":"Unable to save changes."}</p>}
    
    {records.error?<p role="alert" className="mt-6 text-red-400">Database error: {records.error.message}</p>:<>
      <section className="mt-8 rounded-xl border border-gray-800 bg-zinc-950 p-6">
        <h2 className="text-xl font-semibold">Create Provider</h2>
        <form action={createRecord} className="mt-5 space-y-4">
          <label className="block text-sm">Name<input name="name" required maxLength={200}  className="mt-2 w-full rounded-lg border border-gray-700 bg-black p-3" /></label><label className="block text-sm">Description<textarea name="description" maxLength={200}  className="mt-2 w-full rounded-lg border border-gray-700 bg-black p-3" /></label>
          <label className="flex items-center gap-3"><input type="checkbox" name="is_active" defaultChecked />Active</label>
          <SubmitButton idleLabel="Create Provider" pendingLabel="Creating..." className="rounded-lg bg-purple-600 px-5 py-3 hover:bg-purple-700"/>
        </form>
      </section>
      <h2 className="mt-10 text-xl font-semibold">Existing Providers ({items.length})</h2>
      {items.length===0?<p className="mt-4 text-gray-400">No providers yet.</p>:<div className="mt-4 space-y-5">
        {items.map(item=><section key={item.id} className="rounded-xl border border-gray-800 bg-zinc-950 p-6">
          <form action={updateRecord} className="space-y-4">
            <input type="hidden" name="id" value={item.id}/>
            <label className="block text-sm">Name<input name="name" required maxLength={200} defaultValue={item.name} className="mt-2 w-full rounded-lg border border-gray-700 bg-black p-3" /></label><label className="block text-sm">Description<textarea name="description" maxLength={200} defaultValue={item.description ?? ""} className="mt-2 w-full rounded-lg border border-gray-700 bg-black p-3" /></label>
            <label className="flex items-center gap-3"><input type="checkbox" name="is_active" defaultChecked={item.is_active}/>Active</label>
            <SubmitButton idleLabel="Save Changes" pendingLabel="Saving..." className="rounded-lg border border-purple-500 px-4 py-2 text-purple-400 hover:bg-purple-950"/>
          </form>
          <details className="mt-5 border-t border-gray-800 pt-4"><summary className="cursor-pointer text-red-400">Delete Provider...</summary>
            <p className="my-3 text-gray-400">Permanently delete this provider?</p>
            <form action={deleteRecord}><input type="hidden" name="id" value={item.id}/>
              <SubmitButton idleLabel="Confirm Delete" pendingLabel="Deleting..." className="rounded-lg bg-red-700 px-4 py-2 hover:bg-red-800"/>
            </form>
          </details>
        </section>)}
      </div>}
    </>}
  </div></main>;
}
import { connection } from "next/server";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import SubmitButton from "@/app/dashboard/terms/submit-button";
import { createEntry, updateEntry, deleteEntry } from "./actions";
type Entry={ id:string; email:string; is_active:boolean; created_at:string };
export default async function Page({ searchParams }: { searchParams: Promise<{ error?:string; success?:string }> }) {
 await connection();
 const db=await requireAdmin();
 const {data,error}=await db.from("whitelisted_email_addresses").select("id,email,is_active,created_at").order("email");
 const entries=(data??[]) as Entry[];
 const status=await searchParams;
 return <main className="min-h-screen bg-black p-8 text-white md:p-12"><div className="mx-auto max-w-5xl">
  <Link href="/dashboard" className="text-purple-400 hover:underline">← Back to Dashboard</Link>
  <h1 className="mt-6 text-4xl font-bold">Whitelisted Email Addresses</h1>
  <p className="mt-3 text-gray-400">Manage whitelisted email addresses records. These lists do not automatically enforce signup restrictions in Supabase Auth.</p>
  {status.success && ["created","updated","deleted"].includes(status.success) && <p role="status" className="mt-5 rounded-lg border border-green-800 bg-green-950/30 p-4 text-green-300">Record {status.success} successfully.</p>}
  {status.error && <p role="alert" className="mt-5 rounded-lg border border-red-800 bg-red-950/30 p-4 text-red-300">{status.error==="duplicate"?"This entry already exists.":status.error==="missing"?"Entry no longer exists.":"Unable to save changes."}</p>}
  {error?<p role="alert" className="mt-6 text-red-400">Unable to load entries: {error.message}</p>:<>
   <section className="mt-8 rounded-xl border border-gray-800 bg-zinc-950 p-6">
    <h2 className="text-xl font-semibold">Add Email Address</h2>
    <form action={createEntry} className="mt-5 space-y-4"><label className="block text-sm">Email Address
<input type="email" name="email" required maxLength={254} placeholder="student@example.edu"  className="mt-2 w-full rounded-lg border border-gray-700 bg-black p-3" />
</label><label className="flex items-center gap-3 text-sm"><input type="checkbox" name="is_active" defaultChecked />Active</label>
     <SubmitButton idleLabel="Add Email Address" pendingLabel="Adding..." className="rounded-lg bg-purple-600 px-5 py-3 hover:bg-purple-700" />
    </form>
   </section>
   <h2 className="mt-10 text-xl font-semibold">Existing Entries ({entries.length})</h2>
   {entries.length===0?<p className="mt-4 text-gray-400">No entries found.</p>:
    <div className="mt-4 space-y-5">{entries.map(item=><section key={item.id} className="rounded-xl border border-gray-800 bg-zinc-950 p-6">
     <form action={updateEntry} className="space-y-4"><input type="hidden" name="id" value={item.id}/><label className="block text-sm">Email Address
<input type="email" name="email" required maxLength={254} placeholder="student@example.edu" defaultValue={item.email} className="mt-2 w-full rounded-lg border border-gray-700 bg-black p-3" />
</label><label className="flex items-center gap-3 text-sm"><input type="checkbox" name="is_active" defaultChecked={item.is_active} />Active</label>
      <SubmitButton idleLabel="Save Changes" pendingLabel="Saving..." className="rounded-lg border border-purple-500 px-4 py-2 text-purple-400 hover:bg-purple-950"/>
     </form>
     <details className="mt-5 border-t border-gray-800 pt-4"><summary className="cursor-pointer text-red-400">Delete Email Address...</summary>
      <p className="my-3 text-sm text-gray-400">Permanently delete this entry?</p>
      <form action={deleteEntry}><input type="hidden" name="id" value={item.id}/><SubmitButton idleLabel="Confirm Delete" pendingLabel="Deleting..." className="rounded-lg bg-red-700 px-4 py-2 hover:bg-red-800"/></form>
     </details>
    </section>)}</div>}
   </>}
 </div></main>;
}

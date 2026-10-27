import { connection } from "next/server";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

type Request = {
  id:string; requested_by:string|null; image_id:string|null; prompt_chain_id:string|null;
  llm_model_id:string|null; input_text:string|null; status:string;
  error_message:string|null; created_at:string; completed_at:string|null;
};
function date(value:string|null) { return value ? new Date(value).toLocaleString("en-US",{dateStyle:"medium",timeStyle:"short"}) : "—"; }
export default async function Page() {
  await connection();
  const db=await requireAdmin();
  const {data,error}=await db.from("generation_requests").select("id,requested_by,image_id,prompt_chain_id,llm_model_id,input_text,status,error_message,created_at,completed_at").order("created_at",{ascending:false}).limit(200);
  const requests=(data??[]) as Request[];
  return <main className="min-h-screen bg-black p-8 text-white md:p-12"><div className="mx-auto max-w-6xl">
    <Link href="/dashboard" className="text-purple-400 hover:underline">← Back to Dashboard</Link>
    <h1 className="mt-6 text-4xl font-bold">Generation Requests</h1>
    <p className="mt-3 text-gray-400">Read-only activity log, showing up to 200 most recent requests.</p>
    {error?<p role="alert" className="mt-6 text-red-400">Unable to load requests: {error.message}</p>:
    requests.length===0?<p className="mt-8 rounded-xl border border-gray-800 p-6 text-gray-400">No generation requests recorded yet.</p>:
    <div className="mt-8 space-y-4">{requests.map(item=><section key={item.id} className="rounded-xl border border-gray-800 bg-zinc-950 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="break-all font-mono text-sm text-gray-300">{item.id}</p>
        <span className={item.status==="completed"?"text-green-400":item.status==="failed"?"text-red-400":"text-yellow-400"}>{item.status}</span>
      </div>
      <p className="mt-3 text-sm text-gray-400">Created: {date(item.created_at)} · Completed: {date(item.completed_at)}</p>
      <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <div><dt className="text-gray-500">User ID</dt><dd className="break-all">{item.requested_by??"—"}</dd></div>
        <div><dt className="text-gray-500">Model ID</dt><dd className="break-all">{item.llm_model_id??"—"}</dd></div>
        <div><dt className="text-gray-500">Image ID</dt><dd className="break-all">{item.image_id??"—"}</dd></div>
        <div><dt className="text-gray-500">Prompt Chain ID</dt><dd className="break-all">{item.prompt_chain_id??"—"}</dd></div>
      </dl>
      {item.input_text&&<div className="mt-4"><h2 className="text-sm text-gray-400">Input</h2><p className="mt-1 whitespace-pre-wrap break-words">{item.input_text}</p></div>}
      {item.error_message&&<p className="mt-4 whitespace-pre-wrap break-words text-red-400">Error: {item.error_message}</p>}
    </section>)}</div>}
  </div></main>;
}

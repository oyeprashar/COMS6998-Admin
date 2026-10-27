import { connection } from "next/server";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

type Response = {
  id:string; generation_request_id:string; llm_model_id:string|null;
  response_text:string|null; prompt_tokens:number|null; completion_tokens:number|null;
  latency_ms:number|null; created_at:string;
};
export default async function Page() {
  await connection();
  const db=await requireAdmin();
  const {data,error}=await db.from("llm_responses")
    .select("id,generation_request_id,llm_model_id,response_text,prompt_tokens,completion_tokens,latency_ms,created_at")
    .order("created_at",{ascending:false}).limit(200);
  const responses=(data??[]) as Response[];
  return <main className="min-h-screen bg-black p-8 text-white md:p-12"><div className="mx-auto max-w-6xl">
    <Link href="/dashboard" className="text-purple-400 hover:underline">← Back to Dashboard</Link>
    <h1 className="mt-6 text-4xl font-bold">LLM Responses</h1>
    <p className="mt-3 text-gray-400">Read-only model outputs and performance metadata, up to 200 newest records.</p>
    {error?<p role="alert" className="mt-6 text-red-400">Unable to load LLM responses: {error.message}</p>:
    responses.length===0?<p className="mt-8 rounded-xl border border-gray-800 p-6 text-gray-400">No LLM responses recorded yet.</p>:
    <div className="mt-8 space-y-4">{responses.map(item=><section key={item.id} className="rounded-xl border border-gray-800 bg-zinc-950 p-5">
      <p className="break-all font-mono text-sm text-gray-400">Response {item.id}</p>
      <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <div><dt className="text-gray-500">Request ID</dt><dd className="break-all">{item.generation_request_id}</dd></div>
        <div><dt className="text-gray-500">Model ID</dt><dd className="break-all">{item.llm_model_id??"—"}</dd></div>
        <div><dt className="text-gray-500">Prompt tokens</dt><dd>{item.prompt_tokens??"—"}</dd></div>
        <div><dt className="text-gray-500">Completion tokens</dt><dd>{item.completion_tokens??"—"}</dd></div>
        <div><dt className="text-gray-500">Latency (ms)</dt><dd>{item.latency_ms??"—"}</dd></div>
        <div><dt className="text-gray-500">Created</dt><dd>{new Date(item.created_at).toLocaleString("en-US",{dateStyle:"medium",timeStyle:"short"})}</dd></div>
      </dl>
      <h2 className="mt-4 text-sm text-gray-400">Model output</h2>
      <p className="mt-2 whitespace-pre-wrap break-words">{item.response_text??"No response text recorded."}</p>
    </section>)}</div>}
  </div></main>;
}

import { connection } from "next/server";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
type Media = {
 id:string; generation_request_id:string|null; storage_path:string;
 mime_type:string|null; description:string|null; created_at:string;
};
export default async function Page() {
 await connection();
 const db=await requireAdmin();
 const {data,error}=await db.from("ai_generated_media")
  .select("id,generation_request_id,storage_path,mime_type,description,created_at")
  .order("created_at",{ascending:false}).limit(200);
 const media=(data??[]) as Media[];
 // Storage bucket is configurable; the SQL migration only created the table.
 const bucket=process.env.AI_GENERATED_MEDIA_BUCKET ?? "ai-generated-media";
 const entries=await Promise.all(media.map(async (item)=>{
   const {data:signed,error:signError}=await db.storage.from(bucket).createSignedUrl(item.storage_path,3600);
   return { ...item, previewUrl: signError ? null : signed?.signedUrl ?? null };
 }));
 return <main className="min-h-screen bg-black p-8 text-white md:p-12"><div className="mx-auto max-w-6xl">
  <Link href="/dashboard" className="text-purple-400 hover:underline">← Back to Dashboard</Link>
  <h1 className="mt-6 text-4xl font-bold">AI Generated Media</h1>
  <p className="mt-3 text-gray-400">Read-only generated content records. Preview links expire after one hour.</p>
  {error?<p role="alert" className="mt-6 text-red-400">Unable to load generated media: {error.message}</p>:
   entries.length===0?<p className="mt-8 rounded-xl border border-gray-800 p-6 text-gray-400">No AI-generated media recorded yet.</p>:
   <div className="mt-8 grid gap-5 md:grid-cols-2">{entries.map(item=><section key={item.id} className="overflow-hidden rounded-xl border border-gray-800 bg-zinc-950 p-5">
     {item.previewUrl && item.mime_type?.startsWith("image/") ?
      <a href={item.previewUrl} target="_blank" rel="noopener noreferrer" aria-label="View full-size generated image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.previewUrl} alt={item.description??"AI generated image"} className="mb-4 max-h-80 w-full rounded-lg object-contain"/>
      </a>:
      <p className="mb-4 rounded-lg border border-gray-800 p-4 text-sm text-gray-400">
        Preview unavailable. Confirm the storage bucket and object permissions.
      </p>}
     {item.previewUrl && !item.mime_type?.startsWith("image/") &&
      <a href={item.previewUrl} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">Open generated media</a>}
     <h2 className="break-words font-semibold">{item.description??"Generated media"}</h2>
     <dl className="mt-3 space-y-2 text-sm">
      <div><dt className="text-gray-500">Storage path</dt><dd className="break-all">{item.storage_path}</dd></div>
      <div><dt className="text-gray-500">Type</dt><dd>{item.mime_type??"Unspecified"}</dd></div>
      <div><dt className="text-gray-500">Generation request</dt><dd className="break-all">{item.generation_request_id??"—"}</dd></div>
      <div><dt className="text-gray-500">Created</dt><dd>{new Date(item.created_at).toLocaleString("en-US",{dateStyle:"medium",timeStyle:"short"})}</dd></div>
     </dl>
   </section>)}</div>}
 </div></main>;
}

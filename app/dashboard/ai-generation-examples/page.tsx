import { connection } from "next/server";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import SubmitButton from "@/app/dashboard/terms/submit-button";
import { createExample, updateExample, deleteExample } from "./actions";

type Example = {
  id: string;
  title: string;
  input_text: string;
  expected_output: string;
  notes: string | null;
  prompt_chain_id: string | null;
};
type Chain = { id: string; name: string };

export default async function ExamplesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  await connection();
  const db = await requireAdmin();
  const [examplesResult, chainsResult] = await Promise.all([
    db.from("ai_generation_examples")
      .select("id,title,input_text,expected_output,notes,prompt_chain_id")
      .order("created_at", { ascending: false }),
    db.from("prompt_chains").select("id,name").order("name"),
  ]);
  const examples = (examplesResult.data ?? []) as Example[];
  const chains = (chainsResult.data ?? []) as Chain[];
  const { error, success } = await searchParams;
  const failure = examplesResult.error ?? chainsResult.error;

  function chainSelector(selected: string | null) {
    return (
      <label className="block text-sm">
        Prompt Chain (optional)
        <select name="prompt_chain_id" defaultValue={selected ?? ""}
          className="mt-2 w-full rounded-lg border border-gray-700 bg-black p-3">
          <option value="">No prompt chain</option>
          {chains.map((chain) => (
            <option key={chain.id} value={chain.id}>{chain.name}</option>
          ))}
        </select>
      </label>
    );
  }

  function fields(example?: Example) {
    return (
      <>
        <label className="block text-sm">
          Title
          <input name="title" required maxLength={200} defaultValue={example?.title ?? ""}
            className="mt-2 w-full rounded-lg border border-gray-700 bg-black p-3" />
        </label>
        <label className="block text-sm">
          Input Text
          <textarea name="input_text" required rows={3} maxLength={10000}
            defaultValue={example?.input_text ?? ""}
            className="mt-2 w-full rounded-lg border border-gray-700 bg-black p-3" />
        </label>
        <label className="block text-sm">
          Expected Output
          <textarea name="expected_output" required rows={3} maxLength={10000}
            defaultValue={example?.expected_output ?? ""}
            className="mt-2 w-full rounded-lg border border-gray-700 bg-black p-3" />
        </label>
        {chainSelector(example?.prompt_chain_id ?? null)}
        <label className="block text-sm">
          Notes (optional)
          <textarea name="notes" rows={2} maxLength={10000}
            defaultValue={example?.notes ?? ""}
            className="mt-2 w-full rounded-lg border border-gray-700 bg-black p-3" />
        </label>
      </>
    );
  }

  return (
    <main className="min-h-screen bg-black p-8 text-white md:p-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard" className="text-purple-400 hover:underline">
          ← Back to Dashboard
        </Link>
        <h1 className="mt-6 text-4xl font-bold">AI Generation Examples</h1>
        <p className="mt-3 text-gray-400">
          Manage example inputs and expected outputs. These are reference records,
          not automatic model invocations.
        </p>
        {success && ["created", "updated", "deleted"].includes(success) && (
          <p role="status" className="mt-5 rounded-lg border border-green-800 bg-green-950/30 p-4 text-green-300">
            Example {success} successfully.
          </p>
        )}
        {error && (
          <p role="alert" className="mt-5 rounded-lg border border-red-800 bg-red-950/30 p-4 text-red-300">
            {error === "reference" ? "The selected prompt chain no longer exists." :
              error === "missing" ? "Example not found. Refresh the page." :
              error === "duplicate" ? "A matching example already exists." :
              "Unable to save the example."}
          </p>
        )}
        {failure ? (
          <p role="alert" className="mt-6 text-red-400">
            Unable to load examples: {failure.message}
          </p>
        ) : (
          <>
            <section className="mt-8 rounded-xl border border-gray-800 bg-zinc-950 p-6">
              <h2 className="text-xl font-semibold">Create Example</h2>
              <form action={createExample} className="mt-5 space-y-4">
                {fields()}
                <SubmitButton idleLabel="Create Example" pendingLabel="Creating..."
                  className="rounded-lg bg-purple-600 px-5 py-3 hover:bg-purple-700" />
              </form>
            </section>
            <h2 className="mt-10 text-xl font-semibold">
              Existing Examples ({examples.length})
            </h2>
            {examples.length === 0 ? (
              <p className="mt-4 text-gray-400">No generation examples yet.</p>
            ) : (
              <div className="mt-4 space-y-5">
                {examples.map((example) => (
                  <section key={example.id} className="rounded-xl border border-gray-800 bg-zinc-950 p-6">
                    <form action={updateExample} className="space-y-4">
                      <input type="hidden" name="id" value={example.id} />
                      {fields(example)}
                      <SubmitButton idleLabel="Save Changes" pendingLabel="Saving..."
                        className="rounded-lg border border-purple-500 px-4 py-2 text-purple-400 hover:bg-purple-950" />
                    </form>
                    <details className="mt-5 border-t border-gray-800 pt-4">
                      <summary className="cursor-pointer text-red-400">
                        Delete Example...
                      </summary>
                      <p className="my-3 text-sm text-gray-400">
                        Permanently delete this example?
                      </p>
                      <form action={deleteExample}>
                        <input type="hidden" name="id" value={example.id} />
                        <SubmitButton idleLabel="Confirm Delete" pendingLabel="Deleting..."
                          className="rounded-lg bg-red-700 px-4 py-2 hover:bg-red-800" />
                      </form>
                    </details>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

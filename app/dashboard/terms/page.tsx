import { connection } from "next/server";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { createTerm, updateTerm, deleteTerm } from "./actions";
import SubmitButton from "./submit-button";

type Term = { id: string; term: string; description: string | null; is_active: boolean };

export default async function TermsPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  await connection();
  const supabase = await requireAdmin();
  const { error: formError, success } = await searchParams;
  const { data, error } = await supabase.from("terms").select("id,term,description,is_active").order("term");
  const terms = (data ?? []) as Term[];
  return (
    <main className="min-h-screen bg-black p-8 text-white md:p-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard" className="text-purple-400 hover:underline">← Back to Dashboard</Link>
        <h1 className="mt-6 text-4xl font-bold">Terms Management</h1>
        <p className="mt-3 text-gray-400">Create, view, edit, activate, and delete terms.</p>
        {["created", "updated", "deleted"].includes(success ?? "") && (
          <p role="status" aria-live="polite" className="mt-5 rounded-lg border border-green-800 bg-green-950/30 p-4 text-green-300">
            {success === "created" ? "Term created successfully." :
             success === "updated" ? "Changes saved successfully." :
             "Term deleted successfully."}
          </p>
        )}
        {formError && (
          <p role="alert" className="mt-5 rounded-lg border border-red-800 bg-red-950/40 p-4 text-red-300">
            {formError === "duplicate" ? "A term with this name already exists. Choose a different name." :
             formError === "not_found" ? "That term could not be found. Refresh and try again." :
             "Unable to save your change. Please try again."}
          </p>
        )}
        {error ? <p role="alert" className="mt-6 text-red-400">Unable to load terms: {error.message}</p> :
          <>
            <section className="mt-8 rounded-xl border border-gray-800 bg-zinc-950 p-6">
              <h2 className="text-xl font-semibold">Create Term</h2>
              <form action={createTerm} className="mt-5 space-y-4">
                <label className="block text-sm">Term
                  <input name="term" required maxLength={200} className="mt-2 w-full rounded-lg border border-gray-700 bg-black p-3" />
                </label>
                <label className="block text-sm">Description
                  <textarea name="description" maxLength={5000} rows={2} className="mt-2 w-full rounded-lg border border-gray-700 bg-black p-3" />
                </label>
                <label className="flex items-center gap-3 text-sm"><input type="checkbox" name="is_active" defaultChecked /> Active</label>
                <SubmitButton idleLabel="Create Term" pendingLabel="Creating..." className="rounded-lg bg-purple-600 px-5 py-3 hover:bg-purple-700" />
              </form>
            </section>
            <h2 className="mt-10 text-xl font-semibold">Existing Terms ({terms.length})</h2>
            {terms.length === 0 ? <p className="mt-4 text-gray-400">No terms found.</p> :
              <div className="mt-4 space-y-5">
                {terms.map((item) => (
                  <section key={item.id} className="rounded-xl border border-gray-800 bg-zinc-950 p-6">
                    <form action={updateTerm} className="space-y-4">
                      <input type="hidden" name="id" value={item.id} />
                      <label className="block text-sm">Term
                        <input name="term" required maxLength={200} defaultValue={item.term} className="mt-2 w-full rounded-lg border border-gray-700 bg-black p-3" />
                      </label>
                      <label className="block text-sm">Description
                        <textarea name="description" maxLength={5000} rows={2} defaultValue={item.description ?? ""} className="mt-2 w-full rounded-lg border border-gray-700 bg-black p-3" />
                      </label>
                      <label className="flex items-center gap-3 text-sm"><input type="checkbox" name="is_active" defaultChecked={item.is_active} /> Active</label>
                      <SubmitButton idleLabel="Save Changes" pendingLabel="Saving..." className="rounded-lg border border-purple-500 px-4 py-2 text-purple-400 hover:bg-purple-950" />
                    </form>
                    <details className="mt-5 border-t border-gray-800 pt-4">
                      <summary className="cursor-pointer text-sm text-red-400">Delete Term...</summary>
                      <p className="my-3 text-sm text-gray-400">Permanently delete this term?</p>
                      <form action={deleteTerm}>
                        <input type="hidden" name="id" value={item.id} />
                        <SubmitButton idleLabel="Confirm Delete" pendingLabel="Deleting..." className="rounded-lg bg-red-700 px-4 py-2 hover:bg-red-800" />
                      </form>
                    </details>
                  </section>
                ))}
              </div>}
          </>}
      </div>
    </main>
  );
}

import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { savePromptChainWeight } from "./actions";

type Chain = { id: string; name: string; is_active: boolean };
type Mix = { prompt_chain_id: string; weight: number };

export default async function PromptChainMixPage() {
  const supabase = await requireAdmin();
  const [chainResult, mixResult] = await Promise.all([
    supabase.from("prompt_chains").select("id,name,is_active").order("name"),
    supabase.from("prompt_chain_mix").select("prompt_chain_id,weight"),
  ]);
  const error = chainResult.error ?? mixResult.error;
  const chains = (chainResult.data ?? []) as Chain[];
  const mix = (mixResult.data ?? []) as Mix[];
  const weights = new Map(mix.map((entry) => [entry.prompt_chain_id, entry.weight]));
  return (
    <main className="min-h-screen bg-black p-8 text-white md:p-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard" className="text-purple-400 hover:underline">← Back to Dashboard</Link>
        <h1 className="mt-6 text-4xl font-bold">Prompt Chain Mix</h1>
        <p className="mt-3 text-gray-400">Configure each chain&apos;s relative selection weight. A weight of 0 disables selection.</p>
        {error ? <p role="alert" className="mt-8 text-red-400">Failed to load prompt chain mix: {error.message}</p> :
          chains.length === 0 ? <p className="mt-8 rounded-xl border border-gray-800 p-6 text-gray-400">No prompt chains yet. Add chain records to Supabase before configuring the mix.</p> :
          <div className="mt-8 space-y-4">
            {chains.map((chain) => (
              <form action={savePromptChainWeight} key={chain.id} className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-800 bg-zinc-950 p-5">
                <input type="hidden" name="prompt_chain_id" value={chain.id} />
                <div className="min-w-48 flex-1">
                  <h2 className="font-semibold">{chain.name}</h2>
                  <p className="mt-1 text-sm text-gray-400">{chain.is_active ? "Active chain" : "Inactive chain"}</p>
                </div>
                <label className="text-sm text-gray-300">Weight
                  <input name="weight" type="number" min="0" max="999999.9999" step="0.0001" required defaultValue={weights.get(chain.id) ?? 1}
                    className="mt-2 block w-44 rounded-lg border border-gray-700 bg-black p-3 text-white" />
                </label>
                <button type="submit" className="rounded-lg bg-purple-600 px-5 py-3 font-medium hover:bg-purple-700">Save Weight</button>
              </form>
            ))}
          </div>}
      </div>
    </main>
  );
}

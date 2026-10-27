import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

type PromptChain = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

type PromptChainStep = {
  id: string;
  prompt_chain_id: string;
  step_number: number;
  name: string;
  prompt_template: string;
};

export default async function PromptChainsPage() {
  await connection();
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) redirect("/");

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_superadmin");
  if (adminError || isAdmin !== true) redirect("/unauthorized");

  const [chainsResult, stepsResult] = await Promise.all([
    supabase.from("prompt_chains")
      .select("id, name, description, is_active, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("prompt_chain_steps")
      .select("id, prompt_chain_id, step_number, name, prompt_template")
      .order("step_number", { ascending: true }),
  ]);

  const chains = (chainsResult.data ?? []) as PromptChain[];
  const steps = (stepsResult.data ?? []) as PromptChainStep[];
  const error = chainsResult.error ?? stepsResult.error;

  return (
    <main className="min-h-screen bg-black p-6 text-white md:p-12">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard" className="text-purple-400 hover:underline">
          ← Back to Dashboard
        </Link>
        <h1 className="mt-7 text-4xl font-bold">Prompt Chains</h1>
        <p className="mt-3 text-gray-400">
          View configured prompt chains and their ordered steps.
        </p>

        {error ? (
          <div role="alert" className="mt-8 rounded-xl border border-red-900 p-5 text-red-400">
            Unable to load prompt chains or steps: {error.message}
          </div>
        ) : chains.length === 0 ? (
          <p className="mt-8 rounded-xl border border-gray-800 p-6 text-gray-400">
            No prompt chains configured yet.
          </p>
        ) : (
          <div className="mt-8 space-y-6">
            {chains.map((chain) => {
              const chainSteps = steps.filter((step) => step.prompt_chain_id === chain.id);
              return (
                <section key={chain.id} className="rounded-xl border border-gray-800 bg-zinc-950 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold">{chain.name}</h2>
                      <p className="mt-2 text-gray-400">{chain.description || "No description"}</p>
                    </div>
                    <span className={chain.is_active ? "text-green-400" : "text-gray-400"}>
                      {chain.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <h3 className="mt-6 font-semibold">Steps ({chainSteps.length})</h3>
                  {chainSteps.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-400">No steps in this chain.</p>
                  ) : (
                    <ol className="mt-4 space-y-3">
                      {chainSteps.map((step) => (
                        <li key={step.id} className="rounded-lg border border-gray-800 p-4">
                          <p className="font-semibold">
                            Step {step.step_number}: {step.name}
                          </p>
                          <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm text-gray-300">
                            {step.prompt_template}
                          </pre>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

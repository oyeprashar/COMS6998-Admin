"use server";

import { requireAdminAction } from "@/lib/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function savePromptChainWeight(formData: FormData) {
  const supabase = await requireAdminAction();
  const chainId = formData.get("prompt_chain_id");
  const rawWeight = formData.get("weight");
  if (typeof chainId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chainId)) {
    throw new Error("Invalid prompt chain ID");
  }
  if (typeof rawWeight !== "string" || rawWeight.trim() === "" || !/^\d+(\.\d{1,4})?$/.test(rawWeight.trim())) {
    throw new Error("Weight must be nonnegative with at most four decimal places");
  }
  const weight = Number(rawWeight);
  if (!Number.isFinite(weight) || weight > 999999.9999) throw new Error("Weight out of range");

  const { data: chain, error: lookupError } = await supabase
    .from("prompt_chains").select("id").eq("id", chainId).single();
  if (lookupError || !chain) throw new Error("Prompt chain not found");

  const { error } = await supabase.from("prompt_chain_mix")
    .upsert({ prompt_chain_id: chainId, weight }, { onConflict: "prompt_chain_id" });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/prompt-chain-mix");
  redirect("/dashboard/prompt-chain-mix?status=saved");
}

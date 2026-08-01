"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createLead(formData: FormData) {
  const contactName = String(formData.get("contactName") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim() || null;
  const contactPhone = String(formData.get("contactPhone") ?? "").trim() || null;
  const accountId = String(formData.get("accountId") ?? "");
  const newAccountName = String(formData.get("newAccountName") ?? "").trim();
  const source = String(formData.get("source") ?? "OTHER");
  const serviceLine = String(formData.get("serviceLine") ?? "OTHER");
  const ownerId = String(formData.get("ownerId") ?? "");

  if (!contactName || !ownerId) {
    throw new Error("Contact name and owner are required");
  }

  let resolvedAccountId = accountId || null;
  if (!resolvedAccountId && newAccountName) {
    const account = await prisma.account.create({ data: { name: newAccountName } });
    resolvedAccountId = account.id;
  }

  await prisma.lead.create({
    data: {
      contactName,
      contactEmail,
      contactPhone,
      accountId: resolvedAccountId,
      source: source as never,
      serviceLine: serviceLine as never,
      ownerId,
    },
  });

  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  redirect("/quick-entry?created=lead");
}

export async function logActivity(formData: FormData) {
  const type = String(formData.get("type") ?? "NOTE");
  const note = String(formData.get("note") ?? "").trim();
  const userId = String(formData.get("userId") ?? "");
  const target = String(formData.get("target") ?? "");
  const [targetKind, targetId] = target.split(":");
  const leadId = targetKind === "lead" ? targetId : null;
  const dealId = targetKind === "deal" ? targetId : null;

  if (!note || !userId || !targetId) {
    throw new Error("Note, owner, and a lead or deal are required");
  }

  await prisma.activity.create({
    data: {
      type: type as never,
      note,
      userId,
      leadId,
      dealId,
    },
  });

  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  redirect("/quick-entry?created=activity");
}

export async function updateDealStage(formData: FormData) {
  const dealId = String(formData.get("dealId") ?? "");
  const stage = String(formData.get("stage") ?? "");
  const lostReason = String(formData.get("lostReason") ?? "") || null;

  if (!dealId || !stage) {
    throw new Error("Deal and stage are required");
  }

  const isClosed = stage === "WON" || stage === "LOST";

  await prisma.deal.update({
    where: { id: dealId },
    data: {
      stage: stage as never,
      actualCloseDate: isClosed ? new Date() : null,
      lostReason: stage === "LOST" ? (lostReason as never) : null,
    },
  });

  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
}

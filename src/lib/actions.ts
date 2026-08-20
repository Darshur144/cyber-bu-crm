"use server";

import { prisma } from "@/lib/db";
import { generateSampleTelemetry } from "@/lib/telemetry";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function revalidateCrm() {
  revalidatePath("/executive-dashboard");
  revalidatePath("/opportunities");
  revalidatePath("/renewals");
  revalidatePath("/oem");
  revalidatePath("/lead-generation");
  revalidatePath("/accounts");
  revalidatePath("/our-people");
  revalidatePath("/pipeline");
}

export async function createLead(formData: FormData) {
  const contactName = String(formData.get("contactName") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim() || null;
  const contactPhone = String(formData.get("contactPhone") ?? "").trim() || null;
  const accountId = String(formData.get("accountId") ?? "");
  const newAccountName = String(formData.get("newAccountName") ?? "").trim();
  const source = String(formData.get("source") ?? "OTHER");
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
      ownerId,
    },
  });

  revalidateCrm();
  redirect("/lead-generation?created=lead");
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

  revalidateCrm();
  redirect("/lead-generation?created=activity");
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

  revalidateCrm();
}

export async function updateDeal(formData: FormData) {
  const dealId = String(formData.get("dealId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const accountId = String(formData.get("accountId") ?? "");
  const oem = String(formData.get("oem") ?? "").trim();
  const category = String(formData.get("category") ?? "NEW_BUSINESS");
  const stage = String(formData.get("stage") ?? "QUALIFIED");
  const value = Number(formData.get("value") ?? 0);
  const fiscalQuarter = formData.get("fiscalQuarter") ? Number(formData.get("fiscalQuarter")) : null;
  const fiscalYear = formData.get("fiscalYear") ? Number(formData.get("fiscalYear")) : null;
  const salesOwnerId = String(formData.get("salesOwnerId") ?? "") || null;
  const presalesOwnerId = String(formData.get("presalesOwnerId") ?? "") || null;
  const lostReason = String(formData.get("lostReason") ?? "") || null;

  if (!dealId || !title || !accountId || !oem) {
    throw new Error("Deal, title, account, and OEM are required");
  }

  const isClosed = stage === "WON" || stage === "LOST";

  await prisma.deal.update({
    where: { id: dealId },
    data: {
      title,
      accountId,
      oem,
      category: category as never,
      stage: stage as never,
      value,
      fiscalQuarter,
      fiscalYear,
      salesOwnerId,
      presalesOwnerId,
      lostReason: stage === "LOST" ? (lostReason as never) : null,
      actualCloseDate: isClosed ? new Date() : null,
    },
  });

  revalidateCrm();
  redirect(`/opportunities/${dealId}`);
}

export async function generateSampleTelemetryAction() {
  await generateSampleTelemetry(18);
  revalidatePath("/telemetry", "layout");
}

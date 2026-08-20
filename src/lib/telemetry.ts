import { prisma } from "@/lib/db";

export const TELEMETRY_KINDS = ["AGENT", "MCP", "GATEWAY"] as const;
export type TelemetryKind = (typeof TELEMETRY_KINDS)[number];

export type IncomingTelemetryEvent = {
  sourceKind?: string;
  kind?: string;
  sourceName?: string;
  name?: string;
  eventType?: string;
  type?: string;
  status?: string;
  durationMs?: number | null;
  model?: string | null;
  operation?: string | null;
  tokensIn?: number | null;
  tokensOut?: number | null;
  costUsd?: number | null;
  errorMessage?: string | null;
  traceId?: string | null;
  occurredAt?: string | null;
  metadata?: unknown;
};

const KIND_ALIASES: Record<string, TelemetryKind> = {
  AGENT: "AGENT",
  AGENTS: "AGENT",
  MCP: "MCP",
  GATEWAY: "GATEWAY",
  GATEWAYS: "GATEWAY",
  "AI-GATEWAY": "GATEWAY",
  AI_GATEWAY: "GATEWAY",
};

export function parseTelemetryKind(value: string | null | undefined): TelemetryKind | null {
  if (!value) return null;
  return KIND_ALIASES[value.trim().toUpperCase()] ?? null;
}

function asInt(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

function asFloat(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function clip(value: string | null | undefined, max: number): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

function hourKey(date: Date): string {
  const copy = new Date(date);
  copy.setMinutes(0, 0, 0);
  return copy.toISOString();
}

function formatHourLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

type NormalizedEvent = {
  kind: TelemetryKind;
  sourceName: string;
  eventType: string;
  status: "OK" | "ERROR";
  durationMs: number | null;
  model: string | null;
  operation: string | null;
  tokensIn: number | null;
  tokensOut: number | null;
  costUsd: number | null;
  errorMessage: string | null;
  traceId: string | null;
  occurredAt: Date;
  metadata: string | null;
};

export function normalizeIncomingEvent(
  raw: IncomingTelemetryEvent,
): { error: string } | { event: NormalizedEvent } {
  const kind = parseTelemetryKind(raw.sourceKind ?? raw.kind);
  const sourceName = clip(raw.sourceName ?? raw.name, 120);
  const eventType = clip(raw.eventType ?? raw.type, 80);
  if (!kind || !sourceName || !eventType) {
    return { error: "Each event needs sourceKind (AGENT|MCP|GATEWAY), sourceName, and eventType." };
  }

  const statusRaw = (raw.status ?? "OK").toString().trim().toUpperCase();
  const status = statusRaw === "ERROR" || statusRaw === "ERR" || statusRaw === "FAIL" ? "ERROR" : "OK";
  const occurredAt = raw.occurredAt ? new Date(raw.occurredAt) : new Date();
  if (Number.isNaN(occurredAt.getTime())) {
    return { error: "occurredAt must be a valid ISO timestamp." };
  }

  let metadata: string | null = null;
  if (raw.metadata != null) {
    try {
      metadata = JSON.stringify(raw.metadata).slice(0, 4000);
    } catch {
      metadata = null;
    }
  }

  return {
    event: {
      kind,
      sourceName,
      eventType,
      status,
      durationMs: asInt(raw.durationMs),
      model: clip(raw.model ?? undefined, 80),
      operation: clip(raw.operation ?? undefined, 120),
      tokensIn: asInt(raw.tokensIn),
      tokensOut: asInt(raw.tokensOut),
      costUsd: asFloat(raw.costUsd),
      errorMessage: clip(raw.errorMessage ?? undefined, 2000),
      traceId: clip(raw.traceId ?? undefined, 80),
      occurredAt,
      metadata,
    },
  };
}

export async function ingestTelemetryEvents(rawEvents: IncomingTelemetryEvent[]) {
  if (rawEvents.length === 0) return { ingested: 0 };
  if (rawEvents.length > 200) {
    throw new Error("Batch too large. Send at most 200 events per request.");
  }

  const events: NormalizedEvent[] = [];
  for (const raw of rawEvents) {
    const normalized = normalizeIncomingEvent(raw);
    if ("error" in normalized) {
      throw new Error(normalized.error);
    }
    events.push(normalized.event);
  }

  const sourceKey = (kind: TelemetryKind, name: string) => `${kind}::${name}`;
  const unique = new Map<string, { kind: TelemetryKind; name: string; lastSeenAt: Date }>();
  for (const event of events) {
    const key = sourceKey(event.kind, event.sourceName);
    const existing = unique.get(key);
    if (!existing || event.occurredAt > existing.lastSeenAt) {
      unique.set(key, { kind: event.kind, name: event.sourceName, lastSeenAt: event.occurredAt });
    }
  }

  const sourceIds = new Map<string, string>();
  await prisma.$transaction(async (tx) => {
    for (const source of unique.values()) {
      const row = await tx.telemetrySource.upsert({
        where: { kind_name: { kind: source.kind, name: source.name } },
        create: { kind: source.kind, name: source.name, lastSeenAt: source.lastSeenAt },
        update: { lastSeenAt: source.lastSeenAt },
      });
      sourceIds.set(sourceKey(source.kind, source.name), row.id);
    }

    await tx.telemetryEvent.createMany({
      data: events.map((event) => ({
        sourceId: sourceIds.get(sourceKey(event.kind, event.sourceName))!,
        eventType: event.eventType,
        status: event.status,
        durationMs: event.durationMs,
        model: event.model,
        operation: event.operation,
        tokensIn: event.tokensIn,
        tokensOut: event.tokensOut,
        costUsd: event.costUsd,
        errorMessage: event.errorMessage,
        traceId: event.traceId,
        occurredAt: event.occurredAt,
        metadata: event.metadata,
      })),
    });
  });

  return { ingested: events.length };
}

const SAMPLE_SOURCES: { kind: TelemetryKind; name: string }[] = [
  { kind: "AGENT", name: "presales-copilot" },
  { kind: "AGENT", name: "soc-triage-agent" },
  { kind: "AGENT", name: "rfp-writer" },
  { kind: "MCP", name: "jira-mcp" },
  { kind: "MCP", name: "confluence-mcp" },
  { kind: "MCP", name: "siem-query-mcp" },
  { kind: "GATEWAY", name: "litellm-prod" },
  { kind: "GATEWAY", name: "cloudflare-ai-gateway" },
];

const SAMPLE_SHAPES: Record<TelemetryKind, { eventType: string; operation: string; model?: string }[]> = {
  AGENT: [
    { eventType: "llm.request", operation: "plan", model: "gpt-4.1-mini" },
    { eventType: "tool.call", operation: "search_accounts" },
    { eventType: "agent.run", operation: "complete_task", model: "claude-sonnet-4" },
  ],
  MCP: [
    { eventType: "mcp.tools/call", operation: "jira.search_issues" },
    { eventType: "mcp.resources/read", operation: "confluence.page" },
    { eventType: "mcp.tools/call", operation: "siem.run_query" },
  ],
  GATEWAY: [
    { eventType: "gateway.route", operation: "chat.completions", model: "gpt-4.1-mini" },
    { eventType: "gateway.route", operation: "chat.completions", model: "claude-sonnet-4" },
    { eventType: "gateway.fallback", operation: "chat.completions", model: "llama-3.3-70b" },
  ],
};

function sampleCost(model: string | undefined, tokensIn: number, tokensOut: number): number | null {
  if (!model) return null;
  const rates: Record<string, [number, number]> = {
    "gpt-4.1-mini": [0.4, 1.6],
    "claude-sonnet-4": [3, 15],
    "llama-3.3-70b": [0.2, 0.6],
  };
  const [inRate, outRate] = rates[model] ?? [1, 3];
  return (tokensIn * inRate + tokensOut * outRate) / 1_000_000;
}

function buildSampleEvent(i: number, occurredAt: Date): IncomingTelemetryEvent {
  const source = SAMPLE_SOURCES[i % SAMPLE_SOURCES.length];
  const shape = SAMPLE_SHAPES[source.kind][i % SAMPLE_SHAPES[source.kind].length];
  const isError = i % 17 === 0;
  const tokensIn = shape.model ? 400 + (i % 8) * 120 : null;
  const tokensOut = shape.model ? 180 + (i % 5) * 40 : null;
  return {
    sourceKind: source.kind,
    sourceName: source.name,
    eventType: isError && source.kind === "GATEWAY" ? "gateway.rate_limit" : shape.eventType,
    status: isError ? "ERROR" : "OK",
    durationMs: 80 + (i % 12) * 45 + (source.kind === "AGENT" ? 200 : 40 + (i % 9) * 12),
    model: shape.model,
    operation: shape.operation,
    tokensIn,
    tokensOut,
    costUsd: tokensIn && tokensOut ? sampleCost(shape.model, tokensIn, tokensOut) : null,
    errorMessage: isError ? (source.kind === "MCP" ? "tool not found" : "upstream timeout") : null,
    traceId: `trc_${occurredAt.getTime().toString(36)}${i.toString(36)}`,
    occurredAt: occurredAt.toISOString(),
  };
}

export async function generateSampleTelemetry(count = 18) {
  const now = Date.now();
  const events = Array.from({ length: count }, (_, i) => buildSampleEvent(i, new Date(now - i * 90_000)));
  return ingestTelemetryEvents(events);
}

export async function seedHistoricalTelemetry(count = 360) {
  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000;
  const events = Array.from({ length: count }, (_, i) => {
    const occurredAt = new Date(now - Math.floor((i / count) * windowMs) - (i % 7) * 13_000);
    return buildSampleEvent(i, occurredAt);
  });

  const chunkSize = 200;
  let ingested = 0;
  for (let i = 0; i < events.length; i += chunkSize) {
    const result = await ingestTelemetryEvents(events.slice(i, i + chunkSize));
    ingested += result.ingested;
  }
  return { ingested };
}

export async function getTelemetryDashboard(kind?: TelemetryKind | null) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const where = {
    occurredAt: { gte: since },
    ...(kind ? { source: { kind } } : {}),
  };

  const [totals, recent, events] = await Promise.all([
    prisma.telemetryEvent.aggregate({
      where,
      _count: { _all: true },
      _sum: { tokensIn: true, tokensOut: true, costUsd: true },
      _avg: { durationMs: true },
    }),
    prisma.telemetryEvent.findMany({
      where,
      include: { source: true },
      orderBy: { occurredAt: "desc" },
      take: 50,
    }),
    prisma.telemetryEvent.findMany({
      where,
      select: {
        status: true,
        durationMs: true,
        occurredAt: true,
        eventType: true,
        operation: true,
        model: true,
        tokensIn: true,
        tokensOut: true,
        costUsd: true,
        errorMessage: true,
        source: { select: { kind: true, name: true } },
      },
      orderBy: { occurredAt: "desc" },
      take: 8000,
    }),
  ]);

  const errorCount = events.filter((e) => e.status === "ERROR").length;
  const durations = events.map((e) => e.durationMs).filter((n): n is number => n != null);
  const kindCounts: Record<TelemetryKind, { count: number; errors: number; avgMs: number }> = {
    AGENT: { count: 0, errors: 0, avgMs: 0 },
    MCP: { count: 0, errors: 0, avgMs: 0 },
    GATEWAY: { count: 0, errors: 0, avgMs: 0 },
  };
  const kindDurations: Record<TelemetryKind, number[]> = { AGENT: [], MCP: [], GATEWAY: [] };

  const hourMap = new Map<string, { hour: string; AGENT: number; MCP: number; GATEWAY: number; errors: number }>();
  for (let i = 23; i >= 0; i--) {
    const d = new Date(Date.now() - i * 60 * 60 * 1000);
    d.setMinutes(0, 0, 0);
    const key = d.toISOString();
    hourMap.set(key, { hour: formatHourLabel(key), AGENT: 0, MCP: 0, GATEWAY: 0, errors: 0 });
  }

  const sourceMap = new Map<
    string,
    { kind: TelemetryKind; name: string; count: number; errors: number; tokens: number; costUsd: number; durations: number[] }
  >();
  const opMap = new Map<string, { operation: string; count: number; errors: number }>();

  for (const event of events) {
    const k = event.source.kind as TelemetryKind;
    kindCounts[k].count += 1;
    if (event.status === "ERROR") kindCounts[k].errors += 1;
    if (event.durationMs != null) kindDurations[k].push(event.durationMs);

    const bucket = hourMap.get(hourKey(event.occurredAt));
    if (bucket) {
      bucket[k] += 1;
      if (event.status === "ERROR") bucket.errors += 1;
    }

    const sKey = `${event.source.kind}:${event.source.name}`;
    const source = sourceMap.get(sKey) ?? {
      kind: k,
      name: event.source.name,
      count: 0,
      errors: 0,
      tokens: 0,
      costUsd: 0,
      durations: [],
    };
    source.count += 1;
    if (event.status === "ERROR") source.errors += 1;
    source.tokens += (event.tokensIn ?? 0) + (event.tokensOut ?? 0);
    source.costUsd += event.costUsd ?? 0;
    if (event.durationMs != null) source.durations.push(event.durationMs);
    sourceMap.set(sKey, source);

    const op = event.operation ?? event.eventType;
    const opRow = opMap.get(op) ?? { operation: op, count: 0, errors: 0 };
    opRow.count += 1;
    if (event.status === "ERROR") opRow.errors += 1;
    opMap.set(op, opRow);
  }

  (Object.keys(kindCounts) as TelemetryKind[]).forEach((k) => {
    const ds = kindDurations[k];
    kindCounts[k].avgMs = ds.length ? Math.round(ds.reduce((s, n) => s + n, 0) / ds.length) : 0;
  });

  const topSources = [...sourceMap.values()]
    .map((s) => ({
      kind: s.kind,
      name: s.name,
      count: s.count,
      errors: s.errors,
      errorRate: s.count ? s.errors / s.count : 0,
      avgMs: s.durations.length ? Math.round(s.durations.reduce((a, b) => a + b, 0) / s.durations.length) : 0,
      tokens: s.tokens,
      costUsd: s.costUsd,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    windowHours: 24,
    kind: kind ?? null,
    eventCount: totals._count._all,
    errorCount,
    errorRate: totals._count._all ? errorCount / totals._count._all : 0,
    avgMs: Math.round(totals._avg.durationMs ?? 0),
    p95Ms: Math.round(percentile(durations, 95)),
    tokens: (totals._sum.tokensIn ?? 0) + (totals._sum.tokensOut ?? 0),
    costUsd: totals._sum.costUsd ?? 0,
    kindCounts,
    hourly: [...hourMap.values()],
    topSources,
    topOperations: [...opMap.values()].sort((a, b) => b.count - a.count).slice(0, 8),
    recentErrors: events
      .filter((e) => e.status === "ERROR")
      .slice(0, 8)
      .map((e) => ({
        occurredAt: e.occurredAt.toISOString(),
        kind: e.source.kind as TelemetryKind,
        name: e.source.name,
        operation: e.operation ?? e.eventType,
        errorMessage: e.errorMessage ?? "error",
      })),
    recent: recent.map((e) => ({
      id: e.id,
      occurredAt: e.occurredAt.toISOString(),
      kind: e.source.kind as TelemetryKind,
      name: e.source.name,
      eventType: e.eventType,
      operation: e.operation,
      model: e.model,
      status: e.status as "OK" | "ERROR",
      durationMs: e.durationMs,
      tokens: (e.tokensIn ?? 0) + (e.tokensOut ?? 0),
      costUsd: e.costUsd,
      errorMessage: e.errorMessage,
      traceId: e.traceId,
    })),
  };
}

export type TelemetryDashboardData = Awaited<ReturnType<typeof getTelemetryDashboard>>;

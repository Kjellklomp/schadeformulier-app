import { NextRequest, NextResponse } from "next/server";
import { getRedis, isKvConfigured, sessionKey, SESSION_TTL_SECONDS } from "@/lib/kv";
import { PartnerData } from "@/lib/types";

export const runtime = "nodejs";

const SESSION_ID_PATTERN = /^[A-Z0-9]{6,16}$/;

function isValidSessionId(id: string): boolean {
  return SESSION_ID_PATTERN.test(id);
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidSessionId(id)) {
    return NextResponse.json({ error: "Ongeldige sessie-id." }, { status: 400 });
  }
  if (!isKvConfigured()) {
    return NextResponse.json({ error: "Server is niet geconfigureerd: KV-omgevingsvariabelen ontbreken." }, { status: 500 });
  }

  try {
    const redis = getRedis();
    const data = await redis.get<PartnerData>(sessionKey(id));
    return NextResponse.json({ data: data ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Onbekende fout";
    return NextResponse.json({ error: `Sessie ophalen mislukt: ${message}` }, { status: 502 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidSessionId(id)) {
    return NextResponse.json({ error: "Ongeldige sessie-id." }, { status: 400 });
  }
  if (!isKvConfigured()) {
    return NextResponse.json({ error: "Server is niet geconfigureerd: KV-omgevingsvariabelen ontbreken." }, { status: 500 });
  }

  let body: Partial<PartnerData>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige request body." }, { status: 400 });
  }

  if (!body.naam || !body.kenteken || !body.verzekeraar) {
    return NextResponse.json({ error: "Vul in elk geval naam, kenteken en verzekeraar in." }, { status: 400 });
  }

  const payload: PartnerData = {
    naam: String(body.naam),
    voornaam: String(body.voornaam || ""),
    tel: String(body.tel || ""),
    kenteken: String(body.kenteken),
    verzekeraar: String(body.verzekeraar),
    toedracht: String(body.toedracht || ""),
  };

  try {
    const redis = getRedis();
    await redis.set(sessionKey(id), payload, { ex: SESSION_TTL_SECONDS });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Onbekende fout";
    return NextResponse.json({ error: `Versturen mislukt: ${message}` }, { status: 502 });
  }
}

import { PartnerData } from "./types";

export async function fetchPartnerData(sessionId: string): Promise<PartnerData | null> {
  const res = await fetch(`/api/session/${sessionId}`, { cache: "no-store" });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Sessie ophalen mislukt");
  return data.data ?? null;
}

export async function submitPartnerData(sessionId: string, payload: PartnerData): Promise<void> {
  const res = await fetch(`/api/session/${sessionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Versturen mislukt");
}

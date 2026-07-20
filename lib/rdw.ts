import { RdwRecord } from "./types";

export async function rdwLookup(kenteken: string): Promise<RdwRecord | null> {
  const clean = (kenteken || "").replace(/[\s-]+/g, "").toUpperCase();
  if (!clean) return null;
  const url = `https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=${encodeURIComponent(clean)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("rdw-fout");
  const arr = (await res.json()) as RdwRecord[];
  return arr && arr[0] ? arr[0] : null;
}

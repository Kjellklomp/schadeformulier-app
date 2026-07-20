export interface VisionImageBlock {
  mediaType: string;
  data: string;
}

export interface VisionRequest {
  system: string;
  userText: string;
  images?: VisionImageBlock[];
}

export async function callVision({ system, userText, images }: VisionRequest): Promise<string> {
  const res = await fetch("/api/vision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, userText, images }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || "AI-aanroep mislukt");
  }
  return data.text as string;
}

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MODEL = "claude-sonnet-4-6";
const MAX_IMAGES = 3;
const ALLOWED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

interface VisionImageBlock {
  mediaType: string;
  data: string;
}

interface VisionRequestBody {
  system: string;
  userText: string;
  images?: VisionImageBlock[];
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is niet geconfigureerd: ANTHROPIC_API_KEY ontbreekt." },
      { status: 500 }
    );
  }

  let body: VisionRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige request body." }, { status: 400 });
  }

  const { system, userText, images } = body;
  if (typeof system !== "string" || typeof userText !== "string") {
    return NextResponse.json({ error: "system en userText zijn verplicht." }, { status: 400 });
  }
  if (images && images.length > MAX_IMAGES) {
    return NextResponse.json({ error: `Maximaal ${MAX_IMAGES} afbeeldingen per aanvraag.` }, { status: 400 });
  }
  if (images) {
    for (const img of images) {
      if (!ALLOWED_MEDIA_TYPES.has(img.mediaType)) {
        return NextResponse.json({ error: `Niet-ondersteund beeldformaat: ${img.mediaType}` }, { status: 400 });
      }
    }
  }

  const content: Anthropic.MessageParam["content"] = [];
  if (images) {
    for (const img of images) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: img.mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
          data: img.data,
        },
      });
    }
  }
  content.push({ type: "text", text: userText });

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content }],
    });
    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");
    return NextResponse.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Onbekende fout";
    return NextResponse.json({ error: `AI-aanroep mislukt: ${message}` }, { status: 502 });
  }
}

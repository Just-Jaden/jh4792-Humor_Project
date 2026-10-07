"use server";

import { GoogleGenAI, Type } from "@google/genai";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

const configuredModel = process.env.GEMINI_MODEL;
const model =
  !configuredModel || configuredModel === "gemini-2.5-flash"
    ? "gemini-flash-lite-latest"
    : configuredModel;
const dailyLimit = 10;
const maxImageBytes = 5 * 1024 * 1024;
const generationTimeoutMs = 25_000;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const storagePathPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/[0-9a-f-]+\.(jpg|jpeg|png|webp)$/i;

const captionPrompt = `You write image-specific captions for Campus to City, a community humor app for Columbia undergraduates ages 18 to 22.

Use this audience persona to calibrate the taste and voice, not as a checklist of references: Sam is a chronically online college junior from the Midwest, living with roommates, balancing classes, friendships, clubs, dating, deadlines, limited money, new independence, late nights, and weekend exploration around New York.

Caption what is actually visible in the image. Only mention Columbia, dorms, the Midwest, New York, or the subway when the image genuinely supports it. Never force a location or college reference.

Write exactly 5 captions, each using a different lens:
1. A sharply specific observation about the image.
2. Relatable college or young-adult social life; if it does not fit, use independence or everyday adventure.
3. Group-chat or internet-native humor without stale slang.
4. Deadpan understatement.
5. An absurd but image-connected escalation.

Keep each caption under 20 words. Make every option meaningfully different and avoid generic meme filler. Use no hashtags or emojis. Do not be cruel, comment on anyone's appearance, or assume sensitive traits.
Respond only with a JSON array of 5 strings.`;

type GenerateResult = { ok: true } | { error: string };

function parseCaptions(value: string | undefined): string[] | null {
  if (!value) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length !== 5) {
      return null;
    }

    const captions = parsed.map((caption) =>
      typeof caption === "string" ? caption.trim() : ""
    );

    if (
      captions.some(
        (caption) => caption.length === 0 || caption.length > 280
      )
    ) {
      return null;
    }

    return captions;
  } catch {
    return null;
  }
}

export async function generateCaptions(
  storagePath: string
): Promise<GenerateResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Sign in to create a post." };
  }

  if (
    !storagePathPattern.test(storagePath) ||
    !storagePath.startsWith(`${user.id}/`)
  ) {
    return { error: "That upload path is not valid." };
  }

  async function removeUpload() {
    const { error } = await supabase.storage.from("memes").remove([storagePath]);
    return error?.message ?? null;
  }

  async function fail(message: string): Promise<GenerateResult> {
    const cleanupError = await removeUpload();
    return {
      error: cleanupError
        ? `${message} The unused upload also could not be removed: ${cleanupError}`
        : message,
    };
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("images")
    .select("id", { count: "exact", head: true })
    .eq("created_by", user.id)
    .gte("created_at", since);

  if (countError) {
    return fail(`Could not check your daily limit: ${countError.message}`);
  }

  if ((count ?? 0) >= dailyLimit) {
    return fail(`You can create up to ${dailyLimit} posts every 24 hours.`);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return fail("Caption generation is not configured yet.");
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("memes").getPublicUrl(storagePath);

  let imageResponse: Response;
  try {
    imageResponse = await fetch(publicUrl);
  } catch {
    return fail("The uploaded image could not be read.");
  }

  if (!imageResponse.ok) {
    return fail("The uploaded image could not be read.");
  }

  const mimeType = imageResponse.headers.get("content-type")?.split(";")[0];
  if (!mimeType || !allowedImageTypes.has(mimeType)) {
    return fail("Upload a JPEG, PNG, or WebP image.");
  }

  const imageBytes = await imageResponse.arrayBuffer();
  if (imageBytes.byteLength > maxImageBytes) {
    return fail("Upload an image smaller than 5 MB.");
  }

  let captions: string[] | null = null;
  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { timeout: generationTimeoutMs },
    });
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          inlineData: {
            mimeType,
            data: Buffer.from(imageBytes).toString("base64"),
          },
        },
        { text: captionPrompt },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          minItems: 5,
          maxItems: 5,
          items: { type: Type.STRING },
        },
      },
    });
    captions = parseCaptions(response.text);
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      error.message.toLowerCase().includes("timeout");
    return fail(
      timedOut
        ? "Caption generation took too long. Try a smaller image or try again."
        : "The AI could not write captions right now. Try again."
    );
  }

  if (!captions) {
    return fail("The AI returned an invalid set of captions. Try again.");
  }

  const { data: image, error: imageError } = await supabase
    .from("images")
    .insert({
      created_by: user.id,
      image_url: publicUrl,
      storage_path: storagePath,
    })
    .select("id")
    .single();

  if (imageError) {
    return fail(`Could not save the post: ${imageError.message}`);
  }

  const { error: captionError } = await supabase.from("captions").insert(
    captions.map((content) => ({
      image_id: image.id,
      created_by: user.id,
      content,
      prompt: captionPrompt,
      model,
    }))
  );

  if (captionError) {
    const { error: imageCleanupError } = await supabase
      .from("images")
      .delete()
      .eq("id", image.id)
      .eq("created_by", user.id);

    if (imageCleanupError) {
      return {
        error: `Could not save the captions: ${captionError.message}. The incomplete post also could not be removed: ${imageCleanupError.message}`,
      };
    }

    return fail(`Could not save the captions: ${captionError.message}`);
  }

  revalidatePath("/");
  return { ok: true };
}

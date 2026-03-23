/**
 * AI image generation for exercise photos (server-only).
 * Env: IMAGE_GENERATION_API_KEY (any provider), or OPENAI_API_KEY when provider is openai.
 * IMAGE_GENERATION_PROVIDER: openai | stability | replicate
 */

import { createServiceRoleClient } from "@/lib/supabase/service";

const LOG_PREFIX = "[exercise-image-generation]";

export type ImageGenProvider = "openai" | "stability" | "replicate";

export function getImageGenProvider(): ImageGenProvider {
  const p = (process.env.IMAGE_GENERATION_PROVIDER || "openai").toLowerCase().trim();
  if (p === "stability" || p === "replicate" || p === "openai") return p;
  return "openai";
}

/** API key for image providers: dedicated env first, then standard OpenAI key for DALL·E. */
export function getImageGenerationApiKey(provider: ImageGenProvider): string | null {
  const dedicated = process.env.IMAGE_GENERATION_API_KEY?.trim();
  if (dedicated) return dedicated;
  if (provider === "openai") {
    const openai = process.env.OPENAI_API_KEY?.trim();
    if (openai) return openai;
  }
  return null;
}

export function isImageGenerationApiKeyConfigured(provider: ImageGenProvider): boolean {
  return getImageGenerationApiKey(provider) != null;
}

function formatOpenAiErrorBody(status: number, body: string): string {
  const trimmed = body.trim();
  try {
    const j = JSON.parse(trimmed) as {
      error?: { message?: string; type?: string; code?: string | null; param?: string | null };
    };
    const e = j.error;
    if (e?.message) {
      const bits = [`OpenAI ${status}`, e.message];
      if (e.code) bits.push(`code=${e.code}`);
      if (e.type) bits.push(`type=${e.type}`);
      if (e.param) bits.push(`param=${e.param}`);
      return bits.join(" · ");
    }
  } catch {
    /* not JSON */
  }
  return `OpenAI HTTP ${status}${trimmed ? `: ${trimmed.slice(0, 2000)}` : " (empty body)"}`;
}

export function buildExerciseImagePrompt(exerciseName: string): string {
  return `Professional fitness photography, a single athletic person demonstrating correct exercise form for ${exerciseName}, modern gym environment, neutral soft lighting, full body in frame, proper biomechanics and posture, photorealistic, sharp focus, no text, no watermark, no logos`;
}

async function uploadPngToExerciseImages(slug: string, data: ArrayBuffer): Promise<string> {
  const supabase = createServiceRoleClient();
  const safe = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "") || "exercise";
  const path = `generated/${safe}.png`;
  const body = new Uint8Array(data);
  const { error } = await supabase.storage.from("exercise-images").upload(path, body, {
    contentType: "image/png",
    upsert: true,
  });
  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }
  const { data: pub } = supabase.storage.from("exercise-images").getPublicUrl(path);
  return pub.publicUrl;
}

async function generateOpenAI(apiKey: string, prompt: string): Promise<string> {
  const endpoint = "https://api.openai.com/v1/images/generations";
  const payload = {
    model: "dall-e-3",
    prompt,
    size: "1024x1024" as const,
    quality: "standard" as const,
    response_format: "url" as const,
    n: 1,
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const rawText = await res.text();

  if (!res.ok) {
    const msg = formatOpenAiErrorBody(res.status, rawText);
    console.error(`${LOG_PREFIX} OpenAI images/generations failed`, {
      status: res.status,
      endpoint,
      model: payload.model,
      message: msg,
    });
    throw new Error(msg);
  }

  type OpenAiImageOk = { data?: { url?: string; revised_prompt?: string }[] };
  let json: OpenAiImageOk;
  try {
    json = JSON.parse(rawText) as OpenAiImageOk;
  } catch {
    console.error(`${LOG_PREFIX} OpenAI success but invalid JSON`, rawText.slice(0, 500));
    throw new Error(`OpenAI: expected JSON body, got: ${rawText.slice(0, 300)}`);
  }

  const url = json.data?.[0]?.url;
  if (!url || typeof url !== "string") {
    console.error(`${LOG_PREFIX} OpenAI missing data[0].url`, JSON.stringify(json).slice(0, 800));
    throw new Error(
      `OpenAI: no image URL in response (check model billing and account access to Images API)`
    );
  }
  return url;
}

/** Stability Image Core — returns PNG bytes */
async function generateStabilityPng(apiKey: string, prompt: string): Promise<ArrayBuffer> {
  const form = new FormData();
  form.append("prompt", prompt);
  form.append("output_format", "png");
  const res = await fetch(
    "https://api.stability.ai/v2beta/stable-image/generate/core",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "image/*",
      },
      body: form,
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stability: ${res.status} ${err}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("image")) {
    const err = await res.text();
    throw new Error(`Stability: expected image, got ${ct} ${err}`);
  }
  return res.arrayBuffer();
}

async function pollReplicateOutput(apiKey: string, getUrl: string): Promise<string> {
  const maxAttempts = 90;
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(getUrl, {
      headers: { Authorization: `Token ${apiKey}` },
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Replicate poll: ${res.status} ${err}`);
    }
    const pred = (await res.json()) as {
      status?: string;
      output?: string | string[];
      error?: string;
    };
    if (pred.status === "succeeded") {
      const out = pred.output;
      const url = Array.isArray(out) ? out[0] : out;
      if (typeof url === "string" && url.startsWith("http")) return url;
      throw new Error("Replicate: unexpected output shape");
    }
    if (pred.status === "failed" || pred.status === "canceled") {
      throw new Error(pred.error || `Replicate: ${pred.status}`);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Replicate: prediction timed out");
}

async function generateReplicateUrl(apiKey: string, prompt: string): Promise<string> {
  const modelPath =
    process.env.IMAGE_GENERATION_REPLICATE_MODEL?.trim() ||
    "black-forest-labs/flux-schnell";
  const createRes = await fetch(`https://api.replicate.com/v1/models/${modelPath}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: {
        prompt,
        num_outputs: 1,
      },
    }),
  });
  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Replicate: ${createRes.status} ${err}`);
  }
  const created = (await createRes.json()) as { urls?: { get?: string } };
  const getUrl = created.urls?.get;
  if (!getUrl) throw new Error("Replicate: missing prediction URL");
  return pollReplicateOutput(apiKey, getUrl);
}

/**
 * Generates an image and returns a permanent https URL (provider URL or Supabase public URL for Stability).
 */
export async function generateExerciseImageUrl(params: {
  exerciseName: string;
  slug: string;
}): Promise<{ url: string } | { error: string }> {
  const provider = getImageGenProvider();
  const apiKey = getImageGenerationApiKey(provider);
  if (!apiKey) {
    const hint =
      provider === "openai"
        ? "Set IMAGE_GENERATION_API_KEY or OPENAI_API_KEY on the server"
        : "Set IMAGE_GENERATION_API_KEY on the server";
    console.error(`${LOG_PREFIX} missing API key`, { provider, exercise: params.exerciseName });
    return { error: hint };
  }
  const prompt = buildExerciseImagePrompt(params.exerciseName);

  try {
    if (provider === "openai") {
      const url = await generateOpenAI(apiKey, prompt);
      return { url };
    }
    if (provider === "stability") {
      const png = await generateStabilityPng(apiKey, prompt);
      const url = await uploadPngToExerciseImages(params.slug, png);
      return { url };
    }
    const url = await generateReplicateUrl(apiKey, prompt);
    return { url };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`${LOG_PREFIX} provider error`, {
      provider,
      exercise: params.exerciseName,
      slug: params.slug,
      error: msg,
    });
    return { error: msg };
  }
}

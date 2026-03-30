/**
 * Optional server-only meal photo estimate via OpenAI vision.
 * Set OPENAI_API_KEY in production; without it callers should use manual entry only.
 */

export type MealEstimateResult =
  | {
      ok: true;
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      brief: string;
    }
  | { ok: false; error: string; code: "no_api_key" | "api_error" | "parse_error" };

const MAX_DATA_URL_CHARS = 6_500_000;

export async function estimateMealFromImageBase64(
  dataUrl: string
): Promise<MealEstimateResult> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    return { ok: false, error: "AI estimate is not configured.", code: "no_api_key" };
  }
  if (!dataUrl.startsWith("data:image/") || dataUrl.length > MAX_DATA_URL_CHARS) {
    return { ok: false, error: "Invalid or oversized image.", code: "api_error" };
  }

  const body = {
    model: "gpt-4o-mini",
    max_tokens: 300,
    messages: [
      {
        role: "user" as const,
        content: [
          {
            type: "text" as const,
            text:
              "You are helping with a self-tracking food log (not medical advice). " +
              "Look at the meal photo and estimate total calories and approximate macros. " +
              "Reply with a single JSON object only, no markdown, keys: " +
              "calories (integer), protein_g (integer), carbs_g (integer), fat_g (integer), brief (short string). " +
              "Use reasonable guesses; round macros to whole grams.",
          },
          {
            type: "image_url" as const,
            image_url: { url: dataUrl },
          },
        ],
      },
    ],
  };

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text();
      return {
        ok: false,
        error: t.slice(0, 200) || res.statusText,
        code: "api_error",
      };
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content?.trim() ?? "";
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const calories = Number(parsed.calories);
    const protein_g = Number(parsed.protein_g);
    const carbs_g = Number(parsed.carbs_g);
    const fat_g = Number(parsed.fat_g);
    const brief = typeof parsed.brief === "string" ? parsed.brief : "";
    if (!Number.isFinite(calories) || calories < 0 || calories > 15000) {
      return { ok: false, error: "Could not read estimate.", code: "parse_error" };
    }
    return {
      ok: true,
      calories: Math.round(calories),
      protein_g: Number.isFinite(protein_g) ? Math.max(0, Math.round(protein_g)) : 0,
      carbs_g: Number.isFinite(carbs_g) ? Math.max(0, Math.round(carbs_g)) : 0,
      fat_g: Number.isFinite(fat_g) ? Math.max(0, Math.round(fat_g)) : 0,
      brief,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg, code: "parse_error" };
  }
}

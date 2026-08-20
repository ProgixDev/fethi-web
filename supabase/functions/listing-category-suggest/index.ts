// listing-category-suggest — suggest a listing category from its first photo.
//
// POST { imageBase64: string, listingType: 'VENTE' | 'LOCATION' | 'SERVICE' }
// Auth: user JWT (the seller, mid-listing-creation — nothing is published yet).
//
// Provider: OpenAI Responses API, model gpt-5-nano (see fethi-mobile#25 — low
// cost, image input, structured outputs). Structured output's `category_id`
// enum is built from the CURRENT leaf categories for the given listing type,
// so the model cannot return a stale/invalid id even before the defense-in-depth
// re-check below.
//
// This is a suggestion, never a final choice — the client always shows it as
// editable/dismissible. Every "can't produce a good suggestion" path (missing
// secret, no categories, timeout, provider error, provider rate limit, low
// confidence, invalid model output) returns 200 with `categoryId: null` and a
// `reason`, NOT an error — the mobile client falls back to manual category
// selection either way, and a scary error for a nice-to-have suggestion would
// be worse UX than silently not suggesting anything. Only auth failure (401),
// missing secret (503), and the caller's own rate limit (429) are real HTTP
// errors, since those are actionable/observable states, not "no opinion."
//
// The image is never persisted — forwarded to OpenAI in-memory and discarded.
// Retention beyond that is OpenAI's own API data-use policy, not ours.
import { corsHeaders, json } from '../_shared/cors.ts';
import { HttpError, requireUser, serviceClient } from '../_shared/supabase.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const MODEL = 'gpt-5-nano';
const MIN_CONFIDENCE = 0.5;
const DAILY_LIMIT = 5;
const RATE_LIMIT_SCOPE = 'listing-category-suggest';
const OPENAI_TIMEOUT_MS = 12_000;
// ~3MB decoded (base64 is ~4/3 the size of the raw bytes) — this is a
// classification image, not a display photo; the client resizes well below
// this before sending.
const MAX_BASE64_LEN = 4_000_000;

type ListingType = 'VENTE' | 'LOCATION' | 'SERVICE';
const VALID_LISTING_TYPES: ListingType[] = ['VENTE', 'LOCATION', 'SERVICE'];

type SuggestResponse = {
  categoryId: string | null;
  confidence: number | null;
  reason?: string;
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    if (!OPENAI_API_KEY) {
      throw new HttpError(503, 'openai_unconfigured');
    }

    const user = await requireUser(req);
    const svc = serviceClient();

    const body = await req.json().catch(() => ({}));
    const imageBase64: string | undefined = body.imageBase64;
    const listingType: ListingType | undefined = body.listingType;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      throw new HttpError(400, 'imageBase64 required');
    }
    if (imageBase64.length > MAX_BASE64_LEN) {
      throw new HttpError(400, 'image_too_large');
    }
    if (!listingType || !VALID_LISTING_TYPES.includes(listingType)) {
      throw new HttpError(400, 'listingType must be one of VENTE, LOCATION, SERVICE');
    }

    // --- per-user rate limit (SCR-018 `rate_limit_hits`) --------------------
    // Atomic increment-and-read via the SQL function — avoids the
    // check-then-act race a plain select+upsert from here would have.
    const windowStart = new Date();
    windowStart.setUTCHours(0, 0, 0, 0);
    const { data: currentCount, error: rlErr } = await svc.rpc('increment_rate_limit_hit', {
      p_user_id: user.id,
      p_scope: RATE_LIMIT_SCOPE,
      p_window_start: windowStart.toISOString(),
    });
    if (rlErr) throw new HttpError(500, rlErr.message);
    if ((currentCount ?? 0) > DAILY_LIMIT) {
      throw new HttpError(429, 'rate_limited');
    }

    // --- current valid categories for this listing type ---------------------
    const { data: categories, error: catErr } = await svc
      .from('categories')
      .select('id, label, parent_id')
      .eq('type', listingType);
    if (catErr) throw new HttpError(500, catErr.message);

    const parentIds = new Set((categories ?? []).map((c) => c.parent_id).filter(Boolean));
    const leaves = (categories ?? []).filter((c) => !parentIds.has(c.id));

    if (leaves.length === 0) {
      console.log('[listing-category-suggest] no categories for type', listingType);
      return json({ categoryId: null, confidence: null, reason: 'no_categories' } satisfies SuggestResponse);
    }

    const validIds = leaves.map((c) => c.id);
    const idLabelLines = leaves.map((c) => `${c.id}: ${c.label}`).join('\n');

    const schema = {
      type: 'object',
      properties: {
        category_id: { type: 'string', enum: validIds },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
      },
      required: ['category_id', 'confidence'],
      additionalProperties: false,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

    let openaiRes: Response;
    try {
      openaiRes = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          input: [
            {
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text:
                    'Pick the single best-matching category for the item shown in the photo, ' +
                    'from this exact list of id: label pairs (return the id, not the label):\n\n' +
                    idLabelLines,
                },
                { type: 'input_image', image_url: `data:image/jpeg;base64,${imageBase64}` },
              ],
            },
          ],
          text: {
            format: {
              type: 'json_schema',
              name: 'category_suggestion',
              schema,
              strict: true,
            },
          },
        }),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeout);
      const reason = err instanceof Error && err.name === 'AbortError' ? 'timeout' : 'provider_error';
      console.warn('[listing-category-suggest] openai fetch failed', reason, err);
      return json({ categoryId: null, confidence: null, reason } satisfies SuggestResponse);
    }
    clearTimeout(timeout);

    if (!openaiRes.ok) {
      const reason = openaiRes.status === 429 ? 'provider_rate_limited' : 'provider_error';
      console.warn('[listing-category-suggest] openai error', openaiRes.status, await openaiRes.text().catch(() => ''));
      return json({ categoryId: null, confidence: null, reason } satisfies SuggestResponse);
    }

    const openaiBody = await openaiRes.json().catch(() => null);
    const parsed = extractStructuredOutput(openaiBody);
    if (!parsed) {
      console.warn('[listing-category-suggest] could not parse openai response', JSON.stringify(openaiBody).slice(0, 500));
      return json({ categoryId: null, confidence: null, reason: 'provider_error' } satisfies SuggestResponse);
    }

    const { category_id: categoryId, confidence } = parsed;

    // Defense-in-depth: the schema enum already constrains this, but never
    // trust a provider response blindly.
    if (typeof categoryId !== 'string' || !validIds.includes(categoryId)) {
      console.warn('[listing-category-suggest] model returned invalid category_id', categoryId);
      return json({ categoryId: null, confidence: null, reason: 'invalid_model_output' } satisfies SuggestResponse);
    }
    if (typeof confidence !== 'number' || confidence < MIN_CONFIDENCE) {
      console.log('[listing-category-suggest] low confidence', confidence, 'for', categoryId);
      return json({ categoryId: null, confidence: confidence ?? null, reason: 'low_confidence' } satisfies SuggestResponse);
    }

    console.log('[listing-category-suggest] suggested', categoryId, 'confidence', confidence, 'user', user.id);
    return json({ categoryId, confidence } satisfies SuggestResponse);
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    console.error('[listing-category-suggest] internal error', err);
    return json({ error: 'internal_error' }, 500);
  }
});

function extractStructuredOutput(body: unknown): { category_id?: unknown; confidence?: unknown } | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;

  // Some Responses API deployments expose a convenience `output_text` string.
  const direct = typeof b.output_text === 'string' ? b.output_text : null;
  if (direct) {
    try {
      return JSON.parse(direct);
    } catch {
      /* fall through to output[] walk */
    }
  }

  const output = Array.isArray(b.output) ? b.output : [];
  for (const item of output) {
    if (!item || typeof item !== 'object') continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      const text = (part as Record<string, unknown> | undefined)?.text;
      if (typeof text === 'string') {
        try {
          return JSON.parse(text);
        } catch {
          continue;
        }
      }
    }
  }
  return null;
}

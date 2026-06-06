# MyStreet — Image generation prompts

For Midjourney / Flux / DALL-E / Sora-image. The hero (`<MarketingHero>`) takes a
video — you're handling that separately. Everything below is for the rest of the
landing page and the marketing site, in the order they appear.

## Global style — paste this into every prompt

These six lines should be the suffix of every prompt below. They guarantee
brand-consistent output.

```
editorial documentary photography, natural northern French light overcast soft daylight, warm terracotta + sage + paper-cream palette,
real people not models, no smiles directed at camera, no stock-photo poses, no laptops,
shot on 35mm film grain, slight desaturation, 1.6 aspect ratio,
in Lille France, brick and stone architecture, cobblestones, rainy-day texture,
shallow depth of field f/2.8, eye level, no signage no logos no text,
muted colors, considered composition, slightly imperfect, lived-in
```

**Universal negative prompt:**

```
no stock photography aesthetic, no perfect smiles, no Mediterranean / sunny look, no Paris landmarks, no Eiffel Tower, no New York, no anglo settings, no gradients, no neon, no AI hands, no extra fingers, no logos, no readable text, no overlays, no infographics, no flat-vector illustration, no isometric, no cartoon
```

---

## 1 — Pillars section (3 images)

Three side-by-side cards: **Acheter · Vendre · Services & Locations**. Each card
has a small square or 4:5 image floating above the eyebrow. Aspect 4:5 portrait
or 1:1 square. ~600×750.

Where it lives: `src/components/marketing/sections/Pillars.tsx`

### 1.1 — Acheter

```
A woman in her 30s, casually dressed, receiving a vintage Peugeot bicycle from a slightly older man, on a brick-paved residential street in Vieux-Lille. Both wearing modest autumn jackets — wool, brown, dark green. The bike has a worn leather saddle and slight rust patina. They are mid-handshake or mid-conversation. Background: red-brick Flemish-style townhouses with white trim, a blurred bakery awning to the side. Mid-day overcast light. The buyer is reaching for the handlebars; the seller is letting go. Quiet, real, neighborly.
```

Aspect: **4:5 portrait**

### 1.2 — Vendre

```
A man in his 40s, North African features, in a kitchen warmly lit by a single window. He is photographing with his phone a Nespresso machine and a stack of capsules on a wooden countertop. The scene is shot from slightly behind his shoulder so we see the phone screen framing the object. The kitchen has cream-painted brick, a small ceramic vase of dried hydrangeas, a half-eaten baguette on a board. A child's drawing taped to a cabinet door. The man is concentrated, not posed. Soft afternoon light, slight grain.
```

Aspect: **4:5 portrait**

### 1.3 — Services & Locations

```
A young woman returning a Bosch electric drill to an older neighbor at the doorstep of a brick Wazemmes townhouse. The drill is wrapped casually in a small cloth. The older neighbor — woman in her 60s wearing a thick cardigan — is opening her door slightly, smiling gently but not at camera. Tile entryway visible behind her. A small terracotta pot with a single geranium on the step. Late afternoon, low golden light fighting through cloud. Clean composition: the drill is the bridge between the two figures.
```

Aspect: **4:5 portrait**

---

## 2 — How It Works (3 images)

Three numbered steps: **Photographier · Discuter · Rencontrer à pied**. Aspect
varies — go 1:1 or 4:5. ~720×720.

Where it lives: `src/components/marketing/sections/HowItWorks.tsx`

### 2.1 — Photographier

```
Top-down (slightly tilted) overhead photograph of a phone in someone's hand framing a children's clothing pile (6-9 month sizes, neutrally folded — small denim, a cream knit, a striped onesie) on a pale linen blanket. The phone screen visible shows just the camera viewfinder with the clothes inside the frame. The phone is held with one hand, casual grip. A wooden floor edge with herringbone pattern visible at the corner. Soft window light from the upper left. The composition is calm, deliberate, almost still-life.
```

Aspect: **1:1**

### 2.2 — Discuter

```
A woman in her late 20s sitting on a windowsill in a Lille apartment, looking down at her phone, smiling slightly to herself. She is wearing a cream wool sweater, faded jeans, no shoes — comfortable. A mug of coffee on the sill beside her. The window behind her shows a slice of red-brick rooftop and grey sky typical of northern France. The phone screen is angled away — not legible — but its blue-white glow lights her face. Reading a message, not posing. Late morning, soft.
```

Aspect: **4:5 portrait**

### 2.3 — Rencontrer à pied

```
Two figures meeting on a cobblestoned Lille street — Rue Esquermoise or similar. One handing a wrapped IKEA-style cushion to the other. Both bundled in autumn coats, breath barely visible in cold air. Real distance: 3-4 meters between them in the shot, with Flemish brick facades on both sides framing the moment. Rain-wet cobbles reflect a hint of warm shop light. They are not staged — one has just stopped walking, the other is reaching out. Shot from across the street with a mild zoom (~50mm equivalent), giving the scene a documentary feel.
```

Aspect: **3:2 landscape**

---

## 3 — Neighborhoods section (1 hero image)

The Neighborhoods section has copy on the left and a 2-column neighborhood grid
on the right. Currently the right side is a tile grid; you may want to add a
single full-width photo above or below the section as a banner.

Where it lives: `src/components/marketing/sections/Neighborhoods.tsx`

```
A wide cinematic photograph of Vieux-Lille at dusk: cobblestones glistening, the warm orange glow of a corner brasserie spilling onto the street, two tiny silhouettes walking together carrying shopping bags. Flemish red-brick townhouses with white sash windows on both sides, slightly off-axis perspective so the street recedes diagonally. Sky is the deep blue-grey of post-rain northern France with a strip of warm pink at the horizon. No tourists. No cars in foreground. Soft, romantic without being kitsch.
```

Aspect: **21:9 cinematic banner** or **3:2 wide**

---

## 4 — Voices section (3 portrait/vignette images)

Three testimonial cards. Each could carry a small portrait OR an object vignette
that grounds the quote. I'd lean **vignettes** — they're more brand-honest than
posed faces, and they protect against AI-face artifacts.

Where it lives: `src/components/marketing/sections/Voices.tsx`

### 4.1 — Marie L. / Vieux-Lille (sold a Peugeot bicycle)

```
A vintage Peugeot bicycle leaning against a Flemish red-brick wall, late afternoon light catching the chrome. Slightly out of focus in the background: the corner of a wooden bistro chair on a sidewalk, two women's legs (cropped at the calf) sharing a coffee. The bicycle is the subject, the two women are unmistakable but not the focus. Quiet, warm, accidental.
```

Aspect: **1:1**

### 4.2 — Camille B. / Wazemmes (rented a drill)

```
Close-up still life of a Bosch electric drill sitting on a stone doorstep next to a single terracotta pot with a small geranium, a pair of garden gloves, and a folded note. Slightly damp pavement. Northern France soft overcast light. Composition reads as a small domestic exchange just completed. No people in frame.
```

Aspect: **1:1**

### 4.3 — Léa M. / Vauban (baby clothes lot)

```
A wicker basket of softly folded baby clothes (6-9 month, cream and pale blue, IKEA blanket beneath) sitting on the worn wooden floor of a Lille apartment hallway. Sun puddle from a tall window cutting across one corner. A child's small leather shoe at the edge of frame. Domestic, warm, lived-in. No people.
```

Aspect: **1:1**

---

## 5 — Final CTA section (optional ambience)

The current `FinalCTA` uses an ink-black panel with terracotta + sage radial
gradients. Photography is optional here — but if you want one full-bleed image
behind the panel as a faded backdrop, this works:

Where it lives: `src/components/marketing/sections/CTA.tsx`

```
Wide overhead drone shot of Lille intra-muros at dusk, the Citadelle visible to one side, the centre's brick rooftops shimmering in the wet. Dusk-blue sky with a lingering warm horizon. No people visible from this height — just the geometry of the city. To be used at 30% opacity behind the ink-black CTA panel.
```

Aspect: **16:9 ultra-wide**

---

## 6 — About page (founder portrait)

Where it lives: `src/app/(marketing)/about/page.tsx` — the new "Le fondateur"
section.

```
An honest portrait of a 49-year-old Lillois bar owner, Fethi: olive-toned skin, salt-and-pepper close-cropped hair, slight beard, wearing a denim shirt with sleeves rolled up. Standing behind the wooden zinc-topped bar of a small neighborhood Lille bar — terracotta tile floor, vintage Pernod mirror behind him, a few clean glasses upturned on a bar towel, soft pendant lamp light. He is mid-sentence, gesturing slightly with one hand, not posing. Eyes warm but tired in a good way. Late afternoon, before the evening crowd. Real.
```

Aspect: **4:5 portrait**

---

## 7 — Buyers / Sellers / Services / Rentals page heroes (4 images)

Each of these subpages has a hero block that's currently text-only. Adding one
strong photo per page makes the marketing site feel less skeletal.

### 7.1 — Buyers (`/buyers`)

```
A woman in her early 30s walking down Rue de Béthune carrying a vintage typewriter she has just bought from a neighbor. She holds it carefully with both hands, tote bag over one shoulder, slight smile of private satisfaction. Soft autumn rain just stopping, brick and limestone facades behind her, blurred silhouettes of other pedestrians at distance. Documentary, candid, walking-by.
```

Aspect: **3:2 landscape**

### 7.2 — Sellers (`/sellers`)

```
A man in his 50s, casual button-up, sitting at a small Lille apartment kitchen table with three objects laid out neatly: a stack of vintage paperback books, a small ceramic vase, a folded knit jumper. He is photographing the books with his phone, leaning in, careful. Window light from the left. The kitchen is small but warm — copper saucepan hanging, a half-drunk espresso, a notepad with handwritten sentences (illegible). Real, unposed, focused.
```

Aspect: **3:2 landscape**

### 7.3 — Services (`/services`)

```
A young woman in jeans and a wool jumper, kneeling on a Lille apartment floor, helping an older woman attach a bookshelf to the wall with a small drill. They are both focused on the bracket, not the camera. The room is warm, with stacks of books to be shelved on the floor beside them. North-facing window light. The relationship reads as new but trusting — one is hosting, one is helping.
```

Aspect: **3:2 landscape**

### 7.4 — Rentals (`/rentals`)

```
A wide shot of a quiet Lille courtyard with a man returning a folding camping tent (in its bag) to his neighbor. The neighbor is on her doorstep, smiling slightly, accepting the bag. Behind them, a bicycle leans against a wall. Brick walls on three sides. Late afternoon golden hour. The tent bag is the visual anchor connecting them.
```

Aspect: **3:2 landscape**

---

## 8 — Press / Blog / Careers page accents (atmospheric)

These pages don't strictly need photography but a single editorial image lifts
each one out of "just a list of links."

### 8.1 — Press (`/press`)

```
An overhead flat-lay of a wooden desk: two French newspaper clippings (text deliberately illegible, just newsprint texture and a black-and-white half-tone photograph of brick facades), a notepad with handwritten notes, a cup of black coffee, a vintage brass desk lamp casting warm light from the corner. Editorial, calm, archive-feeling.
```

Aspect: **3:2 landscape**

### 8.2 — Blog (`/blog`)

```
A Lille corner café in early autumn — through the steamed front window, you can see one person reading a newspaper at a small marble table, a coffee cup in front of them. The window itself has condensation, slightly obscuring the scene. The metal café chair just outside is wet from rain. Brick facade. Warm, slightly melancholy, neighborhood-feeling.
```

Aspect: **16:9 wide**

### 8.3 — Careers (`/careers`)

```
A small Lille office space inside a converted brick building — large industrial-sash windows, exposed wooden beams, two simple desks with laptops and coffee cups, a few books, a houseplant in a terracotta pot. No people in shot. Late morning light. The space says "small team, careful work" without any startup-cliché beanbags or neon.
```

Aspect: **3:2 landscape**

---

## 9 — How to use these in code

For each image you generate, save under:

```
public/images/<section>-<slot>.jpg          // primary
public/images/<section>-<slot>@2x.jpg       // 2x retina
```

Suggested filenames:

```
public/images/pillar-acheter.jpg
public/images/pillar-vendre.jpg
public/images/pillar-services.jpg
public/images/how-photographier.jpg
public/images/how-discuter.jpg
public/images/how-rencontrer.jpg
public/images/neighborhoods-vieux-lille.jpg
public/images/voice-marie.jpg
public/images/voice-camille.jpg
public/images/voice-lea.jpg
public/images/about-fethi.jpg
public/images/buyers-hero.jpg
public/images/sellers-hero.jpg
public/images/services-hero.jpg
public/images/rentals-hero.jpg
public/images/cta-backdrop.jpg     // optional, 30% opacity
public/images/press-hero.jpg
public/images/blog-hero.jpg
public/images/careers-hero.jpg
```

In Next.js, use `next/image`:

```tsx
import Image from "next/image";

<Image
  src="/images/pillar-acheter.jpg"
  alt="Une voisine reçoit un vélo de ville Peugeot dans le Vieux-Lille"
  width={600}
  height={750}
  className="rounded-lg object-cover"
/>
```

Always pass a real, descriptive French `alt` — accessibility + SEO. Don't use
empty alt strings.

## 10 — Generation tips

- **Midjourney v6 / v6.1**: append `--ar 4:5 --style raw --stylize 250` for the
  portrait images. Use `--ar 3:2 --style raw --stylize 200` for landscape. Keep
  `--stylize` low (150-300) — high stylize is what makes images look like AI
  glamour shots.
- **Flux 1.1 Pro**: similar — explicit "documentary photography, 35mm film,
  natural overcast light" prompt. Run with guidance ~3.5.
- **DALL-E 3**: be more conservative with style words. "Documentary photography,
  candid, warm Lille apartment" tends to work; avoid "cinematic" which DALL-E
  amps into something dramatic.
- **Sora-image / GPT-image**: prompts can be longer and more narrative. Tell the
  story of the moment, not just the visual.

## 11 — What to avoid

If a generated image trips any of these, regenerate or skip:

- People smiling broadly at the camera
- Mediterranean / Provence palette (orange, sun, lavender)
- Paris landmarks (Eiffel, Sacré-Cœur, Haussmann)
- Anglo-American architecture (red double-decker buses, NYC fire escapes)
- Visible tech logos, app screens with readable English text
- Latte art / hipster café aesthetic
- Hand artifacts (extra fingers, fused fingers)
- Children's faces (we don't want to risk uncanny — frame from behind or side)
- Flat-vector / "Corporate Memphis" illustration style
- Text/typography baked into the image

## 12 — When in doubt — the test

Ask yourself before keeping an image: *"Could this have been taken on an
overcast Tuesday in Wazemmes?"* If yes, use it. If it could also be Brooklyn,
Lyon, or Lisbon, regenerate.

# Demo Video — Record & Script Guide (~5 min)

**Deadline:** Wed 21 Oct. **Output:** one uploaded video link → embedded on `/report`.

---

## Part 1 — How to record your screen (macOS)

### Option A — Shift+Cmd+5 (simplest, recommended)
1. **Before recording:**
   - Turn on **Do Not Disturb** (click top-right → Focus → Do Not Disturb) so no notifications pop mid-take
   - Close unrelated tabs/apps; keep only: your two browser tabs (localhost + `/report`)
   - Open this script **outside the recorded area** (second window, split-screen, phone, or printed)
2. Press **Shift + Cmd + 5**
3. Choose **Record Entire Screen** (or *Record Selected Portion* if you want the script visible outside the selection)
4. Click **Options → Microphone → MacBook Microphone** (or your headset) ← *easy to miss, without this there's no voice!*
5. **Test first:** record 10 seconds, play it back from the Desktop, check your voice is audible
6. Click **Record** → the stop button sits in the top menu bar when you're done
7. File saves to **Desktop** as `Screen Recording …mov`
8. Playback once → if a take is bad, just re-record (takes are free)

### Option B — Teams (professor accepts it)
1. Start a meeting (even alone) → toolbar **⋯ → Start recording** (cloud recording + auto-transcript)
2. Share screen → follow the script → Stop recording → the link appears in the meeting chat/Stream
3. Copy that share link — it's your submission

---

## Part 2 — Pre-flight (once, before recording)

```bash
cd "…/AI Course Recommendation"
PORT=8095 python3 app.py        # leave this terminal open
```
Open `http://localhost:8095` — confirm pages load.
**Practice run:** Single Run → `gpt-4.1-mini` → Run → wait ~15–30s → confirm choice + interview appear.
(If it errors, run once more — transient API errors happen; avoid deepseek/gemini-flash for the live demo.)

**After recording:** `git checkout -- results/results.csv` → dataset frozen at 1,041 rows. Never push demo rows.

---

## Part 3 — The script (timed)

Open tabs: **localhost:8095** (for segment 2), **/report**, **/pages/**.
Natural voice — this is a teleprompter, not a text to read word-for-word.

### 0:00–0:30 — The problem (30 sec)
*[SCREEN: top of /report — title + stats banner]*
> "AI agents increasingly choose things *for* people — courses, products, flights.
> So when an agent looks at five offers, what actually makes it pick one over another?
> Marketing spend? Reviews? Credentials? I ran a controlled experiment to find out."

### 0:30–1:30 — How the experiment works (1 min)
*[SCREEN: localhost /run-test → click a LIVE single run with gpt-4.1-mini → narrate while it runs]*
> "Seven LLMs from seven providers — OpenAI, Google, xAI, DeepSeek, Xiaomi —
> each saw all five course pages as raw HTML, order shuffled every single trial,
> so position can't bias the result.
> They must recommend exactly one course and justify it — then, in the same conversation,
> I interview each model: how influential was price, reviews, credentials, badges, 1-to-5.
> Right now you're watching it live: two API calls — first it picks, then it explains.
> Thirty repetitions per model: **1,041 complete trials**, every token and cent logged."

### 1:30–2:30 — The five offers & why they're hard (1 min)
*[SCREEN: /pages/ gallery → hover cards → open Preview on Artistry, then Palette]*
> "Each page has **one strength and one honest tradeoff**.
> Artistry — elite credentials (Yale, MoMA), but $299, the priciest.
> Palette — $149, cheapest with strong reviews, but no credentialed instructor.
> Canvas — the most-reviewed (260), but the lowest rating, community-taught.
> Brushstroke — the only certificate. Creative — the gentlest pitch, 6-payment plan.
> No page wins on everything — which one wins depends on what the model's heuristic weights.
> That's what makes the choice genuinely hard, and the experiment measurable."

### 2:30–3:45 — Results (75 sec)
*[SCREEN: /report → win-share bars → wins-per-model table → figures]*
> "Aggregate: **Artistry 56%, Palette 40%**, the rest almost nothing.
> My first run had a ceiling effect — one page won 96% — so this is already a big fix:
> no page crosses the 60% dominance line.
> But the real result is **here — wins per model**. Three models are credentials-first
> and hand Artistry 83–94% of their picks. Three are price-first and give Palette ~70%.
> Each model is near-deterministic — it doesn't hesitate — but models disagree with *each other*.
> **The aggregate balance comes entirely from that disagreement.**
> And the exit interviews are honest: Artistry-choosers rate credentials 4.99 of 5;
> Palette-choosers rate price 5 of 5. Stated reasons match revealed choices — so asking
> an LLM *why* is a reliable window into how it decides."

### 3:45–4:30 — Surprises & what's next (45 sec)
*[SCREEN: "Surprises & what's next" section]*
> "Three surprises. One: no model was ever undecided — all variance is between models,
> not within them. Two: review volume — 260 reviews, the biggest social signal — never won
> a single trial for six of the seven models. And three: gpt-4.1-mini, one of the smallest,
> was the only model that genuinely used all five options.
> Next: Run 3 — I'm raising Canvas's rating floor from 4.3 to 4.6 stars and re-running all
> models as a separate condition, to test causally whether rating strength is what unlocks
> review-volume wins."

### 4:30–5:00 — Limits & close (30 sec)
*[SCREEN: "Limits" + "Deliverables" sections]*
> "Limits: about 48 dollars of API spend across both runs; seven low-tier models, one per
> provider — this characterizes that tier, not frontier models; and the pages are fictional,
> so real brands might behave differently. Everything is here — dataset, features table,
> cost log, write-up — linked on this page. Thanks."

---

## After recording
1. Play it back once (voice clear? no notification banners?)
2. Upload → OneDrive/Stream/YouTube-unlisted → copy share link
3. **Send me the link** → embedded into `/report`'s video slot → push → done
4. `git checkout -- results/results.csv` (drop any demo run rows)

## For the written hand-in — "what changed since run 1" (ready to paste)

> Since the first run, two things changed. First, run 1's pages stacked every advantage on a
> single course, so one page won 96.6% of 1,192 trials — a ceiling effect that made the data
> unusable. I redesigned all five pages so each carries exactly one strength and one honest
> tradeoff (price, a 4.3–4.8★ rating ladder, review volume compressed to 180–260, credentials,
> a single certificate, payment plans). Second, after two aborted run-2 attempts in which
> Canvas won 98–100% purely on review volume, I demoted Canvas to "most reviewed but lowest
> rated, community-taught" and re-ran. Run 2 then collected 1,041 trials across all 7 models
> for $34.16: the ceiling is broken (top page 56.1%, below the pre-registered 60% dominance
> line), and the data now shows the study's real finding — aggregate balance comes from models
> disagreeing with each other (credentials-first models pick Artistry, price-first models pick
> Palette), while review-volume and beginner-pitch signals never win for any model tested.

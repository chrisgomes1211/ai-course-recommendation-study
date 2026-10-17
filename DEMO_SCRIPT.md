# Demo Video — Script & Shot List (~5 min)

Recording setup: any screen recorder (Teams "Record", macOS Shift+Cmd+5, Loom).
Spine of the recording = your live site: **https://ai-course-recommendation-study.onrender.com/report**
Have it open in a browser tab, plus one course page in another tab before you start.
Talk naturally — this is a teleprompter, not a text to read word-for-word.

---

## 0:00–0:30 — The problem (30 sec)

> "AI agents increasingly choose things *for* people — courses, products, flights.
> So when an agent looks at five offers, what actually makes it pick one over another?
> Marketing spend? Reviews? Credentials? I ran a controlled experiment to find out."

**Screen:** report page top (title + banner stats). Hold there.

## 0:30–1:30 — How the experiment works (1 min)

**Screen:** scroll to "The experiment in 60 seconds" on /report → then switch to a live
course page tab and scroll it briefly while talking.

> "Seven low-tier LLMs from seven providers — OpenAI, Google, xAI, DeepSeek, Xiaomi —
> each saw all five course pages as raw HTML, with the order shuffled every single trial,
> so position on the page can't bias the result.
> They had to recommend exactly one course and justify it — then, in the same conversation,
> I interviewed each model: how influential was price, reviews, credentials, badges, on a 1-to-5 scale.
> Thirty repetitions per model per condition: 1,041 complete trials, every token and cent logged."

## 1:30–2:30 — The five offers & why they're hard (1 min)

**Screen:** /report → "The five offers" table → click through 2 pages live (Artistry + Palette).

> "Each page has one strength and one honest tradeoff.
> Artistry: elite credentials — Yale, MoMA — but $299, the most expensive.
> Palette: $149, the cheapest, strong reviews, but no credentialed instructor.
> Canvas: the most-reviewed — 260 reviews — but the lowest rating and community-taught.
> Brushstroke: the only certificate. Creative: the gentlest beginner pitch, 6-payment plan.
> No page wins on everything — which one wins depends on what the model's heuristic weights.
> That's what makes the choice genuinely hard, and the experiment measurable."

## 2:30–3:45 — Results (75 sec)

**Screen:** /report → scroll the results bars → the per-model table → figure images.

> "Aggregate: Artistry 56 percent, Palette 40, and the rest almost nothing.
> My first run had a ceiling effect — one page won 96 percent — so this is already a huge fix:
> no page crosses the 60 percent dominance line.
> But the interesting result is *here* — wins per model.
> Three models are credentials-first and hand Artistry 83 to 94 percent of their picks.
> Three are price-first and give Palette about 70 percent.
> Each model is near-deterministic — it doesn't hesitate — but models disagree with *each other*.
> The aggregate balance comes entirely from that disagreement.
> And the exit interviews are honest: models that chose Artistry rate credentials 4.99 out of 5;
> models that chose Palette rate price 5 out of 5. Stated reasons match revealed choices —
> which means asking an LLM *why* is a reliable window into how it decides."

## 3:45–4:30 — Surprises & what's next (45 sec)

**Screen:** "Surprises & what's next" section.

> "Three surprises. One: no model was ever undecided — all variance is between models,
> not within them. Two: review volume — 260 reviews, the biggest social signal on the page —
> never won a single trial for six of the seven models. And three: gpt-4.1-mini, one of the
> smallest, was the only model that genuinely used all five options.
> Next: Run 3 — I'm raising Canvas's rating floor from 4.3 to 4.6 stars and re-running all
> models as a separate condition, to test causally whether rating strength is what unlocks
> review-volume wins."

## 4:30–5:00 — Limits & close (30 sec)

**Screen:** "Limits" + "Deliverables" sections.

> "Limits: about 48 dollars of API spend across both runs; seven low-tier models, one per
> provider — this characterizes that tier, not frontier models; and the pages are fictional,
> so real brands might behave differently. Everything is here — dataset, features table,
> cost log, write-up — linked on this page. Thanks."

---

## After recording

1. Upload to wherever your course expects (OneDrive/Stream/YouTube-unlisted) → get the share link.
2. Tell me the link → I embed it in the `/video-slot` div on `/report` → push → Render updates →
   the video lives *on your page*, as the professor asked.
3. **Send by Wed 21 Oct:** the `/report` link (contains video + CSV + features table + cost log).

## The "one paragraph on what changed since run 1" (for the written hand-in)

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

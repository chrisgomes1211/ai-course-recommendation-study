# Full draft — Part 2: remaining sections

*Sections 1–3 and 7–9 of* **What Drives an LLM's Choice? A Controlled Offer-Choice Experiment**.
*Section 4 (Method) and Sections 5–6 (Results and Discussion) were submitted separately; this part completes the draft.*

---

# 1. Abstract

Large language models are increasingly asked to choose on people's behalf — which course to take, which product to buy — yet what actually drives those choices is poorly understood. This study asks whether the conversion levers that move human buyers (review volume, star ratings, instructor credentials, price framing, social proof) move low-tier LLMs the same way, and whether models' stated reasons match their choices. Seven low-tier models from five providers were shown five controlled oil-painting course pages as raw HTML in a single prompt, order shuffled per trial, and asked to pick exactly one course for a typical learner, followed by an 11-item post-choice survey in the same conversation. Run 2 delivered 1,041 completed trials (597 on the final frozen pages) at temperature 0.1; a follow-up (Run 3, 206 trials) changed exactly one feature — the weakest page's star rating, 4.3★ → 4.6★. No page reached the pre-registered 60% dominance threshold: the aggregate balance arises from models disagreeing (three credentials-first, three price-first, one heterogeneous) rather than from within-model uncertainty. Stated drivers align with choices, reported as post-choice consistency rather than cause. In Run 3, for the five models present in both runs, Canvas rose from 3 of 597 (0.5%) to 45 of 146 (30.8%) — support for H1: rating was the binding constraint for the middle of the field, while review volume alone never won a trial. The two models that ran Run 2 only on the earlier page version are reported separately (Canvas 10 of 60). A declared page-version change, drop counts with denominators, and a $54.57 cost ledger accompany the results.

*(≈265 words)*

---

# 2. Introduction & research question

## 2.1 Why study how LLMs choose

Language models no longer only answer questions; they increasingly act on recommendations. An assistant asked "which course should I take?" or a shopping agent comparing five listings is making a *choice*, and that choice functions as a recommendation with real consequences. If an LLM consistently prefers one option, users and downstream systems inherit that preference. Understanding what drives such choices — and whether a model's explanation of its choice is trustworthy — is therefore a practical question, not only an academic one.

## 2.2 The human levers this study puts to the test

Human buyers are known to lean on a small set of cues: inferring quality from price (Rao and Monroe, 1989), following the crowd through review counts and enrolment numbers (Cialdini, 2001), deferring to authority in instructor credentials, and responding to anchoring and installment framing (Tversky and Kahneman, 1974; Simonson and Tversky, 1992). Course landing pages are built almost entirely from these levers. If LLM recommenders are trained on the same marketing corpus and the same human preference data, it is reasonable to expect the same levers to move them — and equally reasonable to expect that a model processing raw HTML may weigh them differently than a human skimming a page.

## 2.3 Why behaviour first, explanations second

A natural shortcut would be to simply ask models why they chose what they chose. There is good reason not to trust that shortcut: language models do not reliably report the factors that actually drove their outputs (Turpin et al., 2023), and an explanation produced after a decision may rationalise it rather than reveal it. This study therefore treats *choice* as the primary data and the model's own account as a secondary, post-decision document — analysed for consistency with behaviour, never as evidence of cause.

## 2.4 What is already known, and the gap

LLMs' choice behaviour has begun to attract direct study. Wu et al. (2025) show that models' choices are shaped by both intrinsic attention bias and extrinsic social influence, with patterns echoing the Matthew effect and conformity. Sfeir et al. (2026) find LLMs capable of producing behaviourally sound choice specifications when prompted structurally, while weaker models struggle. Methodologically, choices are known to be sensitive to how the same options are presented and ordered (Lu et al., 2022), which is why order is shuffled and logged here.

What is missing is a **feature-controlled offer-choice experiment**: stimuli whose every competitive variable is declared in advance, a population of inexpensive models that will actually be deployed at scale, and a follow-up that manipulates a single feature rather than the whole page. This study supplies all three.

## 2.5 Research question and expectations

> **RQ:** How do low-tier LLMs distribute choices across controlled offers, and do their choices track their stated reasons?

Two competing expectations frame the follow-up: **H1** — if star rating was the binding constraint in Run 2, lifting the weakest page's rating off the floor will move its share materially above its same-pages baseline; **H2** — if the *bundle* of features on that page (most reviews arriving with the lowest rating, no credentials) is what held it down, its share will stay low.

## 2.6 Contributions

1. A five-way controlled offer-choice design with every feature declared in a machine-readable manifest, run across seven low-tier models at near-deterministic temperature.
2. Stable per-model *heuristic signatures* (credentials-first, price-first, heterogeneous) that account for the aggregate balance.
3. A single-variable follow-up (rating 4.3★ → 4.6★) whose like-for-like result — Canvas 3 of 597 → 45 of 146 for the five models in both runs — supports H1 without overclaiming.
4. A full replication package: raw CSVs, stimuli, prompts, failure log, cost ledger and live report page.

**Roadmap.** Section 3 situates the study; Section 4 is the Method; Section 5 presents results; Section 6 discusses them; Section 7 states threats; Section 8 concludes; appendices carry the supporting data.

---

# 3. Background / related work

## 3.1 Heuristics and cues in human choice

Decades of behavioural research show that human choice runs on heuristics rather than full evaluation (Tversky and Kahneman, 1974; Kahneman, 2011). Three families of cues matter for this design. First, **price as a quality signal**: buyers infer quality from price when other information is scarce, and manipulations of price framing shift perceived quality independently of the product itself (Rao and Monroe, 1989). Second, **social proof**: review counts, enrolment totals and "students viewing now" bands act as crowd cues that substitute for direct evidence (Cialdini, 2001). Third, **context and contrast**: a set of offers is not judged in isolation — tradeoff contrast and extremity aversion make the *composition* of the choice set part of the judgment (Simonson and Tversky, 1992), which is exactly why all five pages are shown together in every trial here. Authority cues (instructor credentials) and anchoring (struck-through original prices) complete the conversion toolkit that landing pages deploy, and that this study varies per page by design.

## 3.2 LLMs as choosers

The nearest work to this study is Wu et al. (2025), who probe LLM choice behaviour on a virtual platform and find choices influenced by both attention bias and social influence, with human-like Matthew-effect and conformity patterns. Sfeir et al. (2026) approach from econometrics, testing whether LLMs can assist discrete choice modelling; they find capable models produce behaviourally sound specifications under structured prompting, while open-weight models often do not — a reminder that *which* model tier is studied changes the answer, which motivates this study's exclusive focus on the low tier. Adjacent evidence comes from transport research, where LLMs are used to predict mode choice (Transportation Research Record, 2025).

Two methodological findings from this literature bear directly on design. Presentation matters: the same options in a different order or format can change model outputs (Lu et al., 2022), so page order is randomised and logged on every trial (`page_order`). And population matters: models within a family disagree, so results are reported per model and pooled only with counts attached.

## 3.3 Explanation versus behaviour

Turpin et al. (2023) demonstrate that chain-of-thought explanations can systematically misdescribe the factors that drove a model's answer — the explanation is generated, not read out of the decision. This is the evidential status of any LLM self-report, including the exit survey used here. The literature therefore supports a strict reading adopted throughout this report: post-choice ratings are analysed as **consistency between stated and revealed preference** (Section 5.4) and never as evidence that a rated factor *caused* the choice. Where this report says a factor was "the binding constraint", the claim rests on the *behavioural* comparison in Section 5.5 — the same models, the same pages, one feature changed — not on what the models said.

## 3.4 Where this study fits

Compared with Wu et al. (2025), this study holds the stimulus constant at the feature level and manipulates a single feature in follow-up; compared with Sfeir et al. (2026), it measures choices rather than model specifications; compared with the prompt-sensitivity literature, it treats order as a logged nuisance variable rather than the phenomenon. Its distinctive combination is: a declared feature matrix, seven low-tier models, near-deterministic sampling, a pre-stated single-variable test, and a replication package with per-row costs.

---

# 7. Threats to validity & limitations

**Internal validity.**

- **Page-version change (declared).** Run 2 spans two page versions (v1: 444 trials, 16 Oct; v2: 597 trials, 17 Oct). Mitigation: the change is declared in full (§4.2), proven to be visual-layer only from the trial records (winner attributes byte-identical; v1 reasoning quotes the same values), sensitivity-analysed via the DeepSeek before/after (§5.3), and pages frozen thereafter; all between-run comparisons use only the v2/v3 pages.
- **Run 3 baseline confound for two models.** mimo-v2.6-flash and gemini-3.1-flash-lite ran Run 2 only on v1, so they have no same-pages baseline; because v1 → v2 changed only presentation, their confound is the visual redesign plus the rating change. Mitigation: they are excluded from the headline and reported separately (Canvas 10 of 60) with the confound stated (§5.5).
- **Post-choice survey design.** The exit survey follows the choice in the same conversation and may rationalise it. Mitigation: association/consistency language only; no causal claims from survey data (§5.4).

**Statistical conclusion validity.**

- **Run 3 power.** ≈30 trials per model (26 for deepseek). Mitigation: counts reported beside every percentage; results worded as *support for H1*, never confirmation; per-model cells described as tendencies, not precise effects.
- **Dropped trials.** 9 of 1,050 (Run 2: 7 deepseek-flash, 2 gemini-3.8-flash) and 4 of 210 (Run 3: all deepseek empty-response flakes) to transient API errors. Mitigation: reported as counts out of the planned total, never imputed; denominators are completed trials; sensitivity bound shows conclusions unchanged even if all seven dropped deepseek trials had gone to Palette (17.5% → 21.3%).
- **Exploratory design iterations.** Run 1 and attempts 2a/2b were aborted design stages (ceiling and knockout effects). Mitigation: all aborted data archived separately, excluded from analysis, and itemised in the cost ledger.

**External validity.**

- **Model tier.** Seven low-tier models at temperature 0.1 — findings characterise this tier and this sampling regime, not frontier models, and between-model inference is the unit of generalisation.
- **Domain and stimuli.** Fictional oil-painting courses with synthetic reviews; one category, one price band. Real brands, real reviews and other categories may behave differently.
- **Bundle confounding within pages.** One page = one bundle of features; Run 3 separates rating alone, but credentials and certificate were not manipulated, so claims about *why* Canvas still trails Artistry remain associational.

**Reliability.** Provider-side transient failures and one credit exhaustion (§4.5) were handled by automatic retries with attempts logged per row; every trial is reproducible from the CSV row, the frozen pages and the recorded prompts. Cost is bounded by design ($54.57 of a $100 cap), which caps sample size — the budget, not the design, limits trials per model.

---

# 8. Conclusion

The study asked whether the conversion levers that drive human buyers drive LLM buyers, and whether models' stated reasons track their choices. The answer has three parts.

First, **no single lever dominated**. Across 1,041 trials no page reached the 60% dominance threshold, and the aggregate balance was produced not by models weighing options evenly but by models disagreeing: three credentials-first models anchored on Artistry's Yale/MoMA profile, three price-first models anchored on Palette's $149, and one heterogeneous model used all five pages. Near-deterministic sampling makes this a stable portrait of this model tier rather than noise.

Second, **stated reasons aligned with choices** — Artistry choosers rated credentials highest, Palette choosers rated price highest, and the levers models never picked (badges, anchoring, installments) were also the levers they rated as least influential. Because the survey came after the choice, this is reported as consistency, not cause.

Third, **rating was the binding constraint for the middle of the field** — support for H1. Lifting one page's star rating from 4.3★ to 4.6★, with every other value byte-identical, moved it from 3 of 597 (0.5%) to 45 of 146 (30.8%) among the five models present in both runs, while the two extreme-signature models did not move at all. Review volume alone never won a trial; volume *plus* a non-lowest rating is worth second place — masking, not powerlessness. Artistry still leads (43.7% pooled), so the result is a reordering of the middle, not a takeover.

**Implications.** For anyone optimising pages for LLM-mediated discovery: review volume without a competitive rating does not surface, and credentials remain the anchor for the credentials-first segment of models. For the evaluation of LLM recommenders: choice behaviour is a property of a *population* of models with stable heuristic signatures, and self-reports should be checked against behaviour rather than trusted.

**Future work.** A human baseline arm to compare heuristic signatures directly; frontier models to test whether the signatures generalise upward; more trials per model to tighten the Run 3 estimates; a separating test for the Creative bundle (gentle pitch + installments); and replication in a second product category.

All stimuli, prompts, trial-level data with costs, the failure log and the report page are published with this draft, so every number above can be checked against its denominator.

---

# 9. Appendices

## Appendix A — Feature manifest

The complete controlled-feature matrix (`pages/features.yaml`, 11 features × 5 pages with declared tradeoffs) is reproduced in the replication package and summarised in Table 4.1 of the Method. Every value quoted in this report traces to that manifest; the manifest itself is byte-identical across Run-2 versions (§4.2) and diff-verified for Run 3 (`pages_run3/`).

## Appendix B — Model × page win counts

**B.1 — Run 2 (all 1,041 completed trials):**

| Model | Artistry | Palette | Brushstroke | Creative | Canvas | N |
|---|---|---|---|---|---|---|
| deepseek-flash | 118 | 25 | 0 | 0 | 0 | 143 |
| gemini-3.1-flash-lite | 27 | 104 | 19 | 0 | 0 | 150 |
| gemini-3.8-flash | 139 | 9 | 0 | 0 | 0 | 148 |
| gpt-4.1-mini | 81 | 61 | 4 | 1 | 3 | 150 |
| gpt-6-luna | 65 | 85 | 0 | 0 | 0 | 150 |
| grok-3-mini | 28 | 108 | 1 | 13 | 0 | 150 |
| mimo-v2.6-flash | 126 | 24 | 0 | 0 | 0 | 150 |
| **Total** | **584** | **416** | **24** | **14** | **3** | **1,041** |

**B.2 — Run 3 (206 completed trials, `page_version=v3`):**

| Model | Artistry | Palette | Brushstroke | Creative | Canvas | N |
|---|---|---|---|---|---|---|
| deepseek-flash | 14 | 1 | 0 | 0 | 11 | 26 |
| gemini-3.1-flash-lite | 2 | 24 | 4 | 0 | 0 | 30 |
| gemini-3.8-flash | 30 | 0 | 0 | 0 | 0 | 30 |
| gpt-4.1-mini | 15 | 9 | 0 | 0 | 6 | 30 |
| gpt-6-luna | 7 | 6 | 0 | 0 | 17 | 30 |
| grok-3-mini | 5 | 12 | 0 | 2 | 11 | 30 |
| mimo-v2.6-flash | 17 | 3 | 0 | 0 | 10 | 30 |
| **Total** | **90** | **55** | **4** | **2** | **55** | **206** |

*Headline subset (five models in both runs): Canvas 45 of 146 in Run 3; the two v1-only models add 10 of 60.*

## Appendix C — Failure, retry and drop log

| Source | Symptom | Handling | Outcome |
|---|---|---|---|
| grok-3-mini (xAI) | Credits exhausted (150 failed attempts) | Top-up + resume | All recovered |
| deepseek-flash | Empty/invalid responses ("No JSON with 'choice' key"), ~110 in Run 2 | Retry in-flight; dedicated resume pass | 54 of 79 recovered in Run 2; 4 dropped in Run 3 |
| gpt-6-luna | 1 credit-exhaustion event | Resume | Recovered |
| mimo-v2.6-flash | Rate-limit / blank responses | Automatic retries | Recovered |
| gemini-3.8-flash | 2 × "Deadline Exceeded" | Automatic retries | 2 trials dropped in Run 2 |
| — | Retry policy | ≤3 choice attempts, ≤10 interview attempts | 87 choice phases + 24 surveys recovered only after retries (Run 2) |
| **Totals** | | | **Run 2: 9 of 1,050 dropped (1,041 analysed); Run 3: 4 of 210 dropped (206 analysed); never imputed** |

## Appendix D — Cost ledger and provider statements

| Run | Spend | Note |
|---|---|---|
| Run 1 (archived) | $13.59 | Ceiling-effect run; unusable |
| Run 2 (incl. aborted 2a $2.27, 2b $1.24) | $34.16 | ~$0.033 per completed row |
| Run 3 | $6.82 | 206 completed trials |
| **Total** | **$54.57** | **$100 cap (54.6% used)** |

Provider billing dashboards (screenshots dated 20 Oct 2026, `static/billing/*.png`): Google Gemini API €17.32; xAI $17.03 usage; OpenAI $13.53 invoiced; DeepSeek $2.12 to date. Statement windows are wider than the runs and include free credit grants, so they are receipts rather than a re-computation — the **$54.57 ledger total is the figure of record** (it supersedes the $50–60 estimate quoted verbally in the demo video).

## Appendix E — Data dictionary

`results/results.csv` (Run 2, 1,041 rows) and `results/results_run3.csv` (Run 3, 206 rows; adds `page_version`), one row per completed trial:

- **Identifiers:** `timestamp`, `run_id`, `provider`, `model`, `tier`
- **Schedule keys:** `condition_page` (scheduling/resume key — all five pages shown every trial), `run_number`
- **Outcome:** `which_page_won`, `page_order` (shuffled order as sent)
- **Post-choice survey:** `q1_price` … `q10_payment_plan` (1–5), `q11_open` (free text), `choice_reasoning`
- **Costs and performance:** `choice_input_tokens`, `choice_output_tokens`, `choice_cost_usd`, `interview_*` equivalents, `total_row_cost_usd`, `latency_choice_s`, `latency_interview_s`
- **Reliability:** `choice_attempts`, `interview_attempts`
- **Winner attributes (from the manifest):** `win_name`, `win_price_display`, `win_price_value`, `win_reviews_level`, `win_reviews_count`, `win_reviews_rating`, `win_credentials_present`, `win_credentials_detail`, `win_description_detail`, `win_structure_level`

Full documentation: `results/README.md`.

## Appendix F — Links

- **Live report page:** https://ai-course-recommendation-study.onrender.com/report
- **Replication package (code, data, stimuli, prompts, ledger):** https://github.com/chrisgomes1211/ai-course-recommendation-study
- **Demo video:** *(link to be confirmed in the final submission)*

---

# References

- Cialdini, R.B. (2001) 'Harnessing the Science of Persuasion', *Harvard Business Review*, 79(9), pp. 72–81.
- Kahneman, D. (2011) *Thinking, Fast and Slow*. New York: Farrar, Straus and Giroux.
- Lu, Y., Bartolo, M., Moore, A., Riedel, S. and Stenetorp, P. (2022) 'Fantastically Ordered Prompts and Where to Find Them: Overcoming Few-Shot Prompt Order Sensitivity', *Proceedings of the 60th Annual Meeting of the Association for Computational Linguistics*.†
- Rao, A.R. and Monroe, K.B. (1989) 'The Effect of Price, Brand Name, and Store Name on Buyers' Perceptions of Product Quality: An Integrative Review', *Journal of Marketing Research*, 26(3), pp. 351–357.
- Simonson, I. and Tversky, A. (1992) 'Choice in Context: Tradeoff Contrast and Extremity Aversion', *Journal of Marketing Research*, 29(3), pp. 281–295.
- Sfeir, G., Nova, G., Hess, S. and van Cranenburgh, S. (2026) 'Can large language models assist choice modelling? Insights into prompting strategies and current models' capabilities', *Journal of Choice Modelling*, 60, 100623.
- Tversky, A. and Kahneman, D. (1974) 'Judgment under Uncertainty: Heuristics and Biases', *Science*, 185(4157), pp. 1124–1131.
- Turpin, M., Michael, J., Perez, E. and Bowman, S.R. (2023) 'Language Models Don't Always Say What They Think: Unexplained Biases in Chain-of-Thought Prompts', *Advances in Neural Information Processing Systems*, 36.
- Wu, W., Zhao, Q., Chen, H., Zhou, L., Lian, D. and Xie, H. (2025) 'Exploring the Choice Behavior of Large Language Models', *Findings of the Association for Computational Linguistics: ACL 2025*, pp. 5194–5214. Vienna: Association for Computational Linguistics. doi: 10.18653/v1/2025.findings-acl.270.

† Page numbers to be confirmed against the published proceedings before final submission.

*Wu et al. (2025) and Sfeir et al. (2026) were verified against the ACL Anthology and the Journal of Choice Modelling respectively.*

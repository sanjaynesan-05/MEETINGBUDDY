# Response to Reviewers

**Paper:** *Local AI Meeting Intelligence Using Parallel LLM Extraction and Hybrid Retrieval*
**Revised source:** `IEEE_Paper_final.tex` (compiles with the `architecture.png`, `fig2–fig5.png` in this folder)

## Overall stance

We thank the reviewers for the constructive readings. The revision addresses every
actionable request in the six reviews without altering any measured result.
New content is limited to (a) positioning, (b) analysis of already-reported
numbers, and (c) one new honest comparison table built from the numbers
already in the paper. We have deliberately not claimed reruns, larger
datasets, or human-validated grounding; those items are stated as limitations
and future work, exactly as the reviews recommend.

## Point-by-point changes

**1. Novelty positioning vs. existing commercial/open-source assistants
(Reviews 1, 4, 6).**
- Introduction, para. 3 now names the commercial systems (Microsoft 365 Copilot
  meeting features, Zoom AI Companion, Otter.ai), states the gap we target is
  *deployment location, not feature coverage*, and explicitly disclaims
  quality parity (we did not run those products).
- Related Work gains a "Commercial meeting assistants" paragraph.
- Contributions list (4) is now "an end-to-end, failure-inclusive
  evaluation," which matches what the paper actually does.

**2. Larger / more diverse evaluation dataset (all reviews).**
- We kept the three-meeting corpus and made its limits explicit and central
  instead: the abstract, Sec. IV, and Limitations all state two-meeting
  extraction scoring, undocumented annotation, and unrecorded speaker/domain/
  acoustics fields.
- The Limitations section now lists "a 10–15 meeting corpus across meeting
  types, lengths, and acoustic conditions (AMI as a public option)" as a
  concrete next step, and the Conclusion frames the numbers as preliminary
  per-meeting, not corpus-level, results.
- The risk-category instability is now quantified: with 4 reference risks,
  each hit moves F1 by 0.25 (Sec. V-A).

**3. Baseline comparisons for retrieval quality (Reviews 3, 4, 6).**
- New Table 6 compares all three ranking paths (vector-only, RRF hybrid,
  keyword) on the same 35 labeled queries at k = 1/3/5/10.
- It reports the vector-only baseline (Recall@5 0.4286, nDCG@5 0.2527), the
  *measured* hybrid behavior (degenerate single-candidate rankings, 0.0857
  flat across all k), and marks the keyword path "not meaningful" because
  MongoDB ranks meetings while labels are chunks.
- The flawed MRR/precision log fields are withheld with the arithmetic shown
  (three rank-1 hits + twelve top-5 hits ⇒ MRR ≥ 0.154, not the logged
  0.0857). This answers "does hybrid beat the others?" with "currently it
  returns one candidate; here is the defect and the fix plan."

**4. Grounding threshold clarification + failure modes + semantic upgrade
(Reviews 1, 3, 4, 5).**
- Sec. III-D now states the 20% threshold was a design choice, not a
  calibration, and that the 10–50% sweep flags the identical 3/51 items
  (the three flagged items have zero overlap), so the sweep *cannot* choose
  a threshold on this data.
- Two bounding failure modes are named: supported paraphrases get flagged
  (false positive); lexically plausible hallucinations pass (false negative).
- Future work adds a local NLI check and two-annotator judgments with
  Cohen's κ, keeping both compatible with the local-only constraint.

**5. Parallel-execution contention / resource allocation (Reviews 1, 4, 5).**
- New "Concurrency and contention" paragraph in Sec. V-C ties the failures to
  three recorded facts: OLLAMA_MAX_LOADED_MODELS=1 with a partially-offloaded
  4.7 GB model (3,431 MiB used, 0.4–1.6 GB free RAM); failed stages including
  risk extraction (8.5 s sequentially) prove 300 s of *queueing*, not slow
  generation; action items 270.8 s parallel vs 142.6 s sequential shows slot
  contention under NUM_PARALLEL=4.
- Engineering implications stated: sequential is the reliable mode on this
  hardware (9/9 in all three runs); parallel pays only with capped
  concurrency + raised timeout (900 s patch); ≥8 GB VRAM or a 3B-class model
  shrinks both modes; single-prompt baseline as the low-cost alternative.

**6. Explicit privacy–latency trade-off quantification (Reviews 1, 5).**
- New Sec. V-F: the trade-off is stated as a number pair — ~456 s batch
  extraction and ~12 s interactive answers (99.4% generation, ~2.7 s
  embedding, amplified by model eviction) in exchange for no off-machine
  data flow — with named levers (resident models, embedding cache, 3B answer
  model, precomputation) flagged as not-yet-measured.

**7. Risk-extraction failure investigation (Reviews 2, 5).**
- Sec. V-A now analyzes it: the three false positives are fabricated risks
  with no transcript support (the same error class the grounding audit
  flags); part of the weakness is prompt-caused since risks are rarely
  explicit; the planned verbatim-evidence-quote prompt revision is listed in
  Limitations/Future Work.

**8. Placeholder figures + formatting artifacts (Reviews 2, 4, 5).**
- All figure placeholders are removed; Figs. 1–5 use the real assets in this
  folder, and the UI figure now combines all four screenshots as (a)–(d).
- One dangling cross-reference (`fig5_meeting_detail` → UI figure) is fixed.
- Prose proofread for merged words; no placeholder sentences remain.
- Abstract states the retrieval situation factually instead of "open"
  hedging, and the Conclusion closes on the four open claims.

**9. Scalability / latency optimization discussion (Review 6).**
- Covered by items 5 and 6 above; the future-work list adds Qdrant HNSW
  inspection and cold/warm runs.

## Items the authors must complete before submission

These cannot be done from the manuscript alone:

- [ ] **Verify network isolation** (or keep the "local, unverified" wording;
      the title already avoids "privacy-preserving").
- [ ] **Rerun the patched 900 s client** for the paired timing so RQ1 has a
      completed parallel time instead of a timeout ceiling.
- [ ] **Repair the fusion path** so the hybrid ranking returns full chunk
      lists, then rerun Table 6 with a chunk-level keyword baseline and
      documented labels.
- [ ] **Optional but recommended:** extend the corpus to 10–15 meetings and
      run the verbatim-evidence risk prompt before the deadline; if time is
      short, submit as-is — the paper's claims already hold without these.

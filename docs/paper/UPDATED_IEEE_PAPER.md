# [ADDED] Privacy-Preserving AI Meeting Intelligence Using Parallel LLM Extraction and Hybrid Retrieval

**[ADDED — REVIEW MARKUP]** Text marked `[ADDED]` is new or revised. `[CHECK]` identifies an inconsistency requiring verification. `[TODO: ...]` identifies missing data. Existing reported measurements are retained as recorded; no retrieval-quality scores are claimed.

## Abstract

[ADDED] Meeting transcripts contain decisions, assignments, risks, and unresolved questions, yet extracting these items can expose sensitive organizational data to external services and can produce unsupported statements. This paper presents a local meeting-intelligence prototype that combines speech transcription, parallel structured extraction with Qwen2.5-7B, transcript-overlap checks, keyword search, dense retrieval, and reciprocal-rank fusion (RRF). The evaluation reports two distinct experiments. On one 24,029-character transcript, a single sequential-versus-parallel timing run measured 490,289 ms and 306,385 ms, respectively, a reported latency reduction of 37.51%; four parallel extraction stages failed, limiting interpretation of the comparison. On two manually annotated meeting transcripts, the extraction benchmark reports macro F1 of 0.6534 across decisions, action items, risks, and unanswered questions. A separate lexical-overlap audit reports 48 of 51 extracted items above a 20% threshold; this is a heuristic support signal, not a human-validated hallucination-accuracy measure. Retrieval relevance was not measured because the project has no labeled query set and Qdrant was unavailable during the recorded audit. Results therefore support a preliminary systems prototype, not a validated accuracy or retrieval-quality claim. [END ADDED]

## Index Terms

[ADDED] meeting intelligence, privacy-preserving NLP, large language models, information extraction, hybrid retrieval, transcript grounding, local inference.

## I. Introduction

[ADDED] Meeting assistants can turn transcripts into searchable summaries and structured records, but meeting content may contain confidential plans, personnel information, and security discussions. This work studies a locally processed prototype intended to keep model inference and retrieval within a user-controlled environment. Its pipeline transcribes meeting audio, invokes task-specific extraction stages, checks extracted text against the transcript using lexical overlap, stores transcript chunks and embeddings, and combines keyword and vector rankings with reciprocal-rank fusion (RRF) [1].

[ADDED] The prototype is evaluated for extraction quality, one-run extraction latency, and lexical transcript overlap. Retrieval latency was observed in a system benchmark, but retrieval relevance was not evaluated: no labeled query judgments were available and the recorded benchmark used a MongoDB fallback. Accordingly, this paper makes no claim that hybrid retrieval improves retrieval quality. The reported latency reduction is 37.51% for one run; the parallel run had four failed stages, so it does not establish an end-to-end accuracy-preserving speedup. Extraction evaluation reports macro F1 0.6534 on two meetings, and the separate overlap audit reports 48/51 items passing a lexical threshold. These are preliminary results with different evaluation protocols.

[ADDED] The research gap is addressed through the following systems contributions:

1. [ADDED] A locally deployable meeting-analysis pipeline integrating transcription, parallel task-specific LLM extraction, and searchable transcript storage.
2. [ADDED] A reproducible preliminary extraction evaluation over two manually annotated meetings, with the observed category metrics and scope stated explicitly.
3. [ADDED] A transcript-overlap audit and latency comparison that expose limitations, including heuristic grounding, a single timing run, and failed parallel stages.
4. [ADDED] An implementation of keyword/vector result fusion using RRF; its relevance effectiveness remains to be measured.

[ADDED] Commercial meeting assistants and local/open-source alternatives occupy different deployment and feature trade-offs. A sourced comparison of local processing, structured extraction, grounding, and hybrid retrieval has not been assembled here; therefore, no named product comparison or superiority claim is made. [TODO: cite and complete a sourced qualitative comparison if required.]

## II. Related Work

### A. Meeting Summarization

[ADDED] MeetingBank provides a benchmark for meeting summarization [2]. It is cited here as a summarization benchmark; it is not evidence for action-item-driven summarization. QMSum provides query-based meeting summarization data [3].

### B. Neural Retrieval

[ADDED] Dense Passage Retrieval (DPR) is a neural dense-retrieval approach [4]. It provides context for the vector-search component but does not establish the effectiveness of this prototype's retrieval implementation.

### C. Hybrid and Keyword Retrieval

[ADDED] Reciprocal-rank fusion combines ranked lists using reciprocal rank contributions [1]. The project uses an RRF constant of 60. BM25 is a standard lexical retrieval method [5]; the prototype's MongoDB keyword path is not asserted to be a BM25 implementation. Retrieval quality must be measured against relevance judgments before comparing these approaches.

### D. Hallucination and Grounding

[ADDED] Surveys of hallucination in natural language generation describe the difficulty of assessing factual consistency and grounding [6]. Lexical overlap is a low-cost heuristic and does not establish semantic support. SelfCheckGPT is a related black-box hallucination-detection approach [7]; it is not used by this prototype.

## III. System Overview

[ADDED] The prototype runs speech recognition and LLM inference locally. A modular processor dispatches nine extraction stages concurrently, validates/normalizes structured responses, and stores the resulting analysis. Search combines a keyword service with vector search and RRF when the vector service is available. The keyword-only fallback can operate without Qdrant; recorded RAG timings used that fallback. This architecture describes system capability, not a verified privacy guarantee against all software, telemetry, or operating-system behavior.

## IV. Methodology

### A. Models and Runtime

[ADDED] Extraction uses Qwen2.5-7B through Ollama [8]. The embedding configuration names Nomic Embed [9]. Sentence-BERT [10] is not necessary to describe the current implementation and is omitted from the reference list. The recorded experimental configuration specifies temperature 0, an 8,192-token context, a 24,000-character processing limit, a 12th-generation Intel Core i5-12450H CPU, an RTX 3050 Laptop GPU with 4 GB reported memory, 16 GB RAM, Windows 11, and Node.js 22.14.0. The embedding model is `nomic-embed-text` (768-dimensional vectors in the diagnostic report).

[ADDED] The available report does not record `OLLAMA_NUM_PARALLEL`, `OLLAMA_MAX_LOADED_MODELS`, exact GPU/CPU offload allocation, the meeting identifier/title corresponding to the timing transcript, sequential-run retry count, or repeated timing runs. [TODO: supply these configuration values and identify the measured transcript.] The published timing sample is one run (n=1); future reporting should use at least three runs and report mean ± standard deviation plus retry count per stage.

### B. Dataset and Extraction Evaluation

[ADDED] Existing extraction ground truth comprises two manually annotated English meetings: “Effective Meetings: Simulated Exercise for Chairing & Minute Taking” (6 decisions, 7 action items, 2 risks, 1 unanswered question) and “SICK - Secure and Govern Growth and Data Science Team Meeting” (6 decisions, 10 action items, 2 risks, 3 unanswered questions). Thus the reference totals are 12 decisions, 17 action items, 4 risks, and 4 unanswered questions. The evaluated system predicted 10 decisions, 16 action items, 4 risks, and 4 unanswered questions. Under token-Jaccard matching at threshold 0.5, micro-aggregated by category across meetings, the reported category F1 values are 0.6364, 0.7273, 0.25, and 1.0, respectively; macro F1 is 0.6534. This small two-meeting sample does not support broad generalization.

[ADDED] We define **reference items** as manually annotated gold items, **predicted items** as all system-extracted items before benchmark matching, and **grounding-evaluated items** as stored output items checked against their source transcript by the separate lexical-overlap audit. Table III reports matched extraction counts; Table IV (as described in the supplied review brief) reports all extracted items. [CHECK: Table III's 10 predicted decisions and 16 predicted action items match the benchmark report; verify that Table IV's 12 unanswered questions are from a broader corpus/run, since the extraction benchmark has 4 predicted unanswered questions. Do not combine these counts as one experiment without identifying their corpus and run.]

[ADDED] Table I. Extraction results on the two annotated meetings.

| Category | Reference | Predicted | TP | FP | FN | Precision | Recall | F1 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Decisions | 12 | 10 | 7 | 3 | 5 | 0.7000 | 0.5833 | 0.6364 |
| Action items | 17 | 16 | 12 | 4 | 5 | 0.7500 | 0.7059 | 0.7273 |
| Risks | 4 | 4 | 1 | 3 | 3 | 0.2500 | 0.2500 | 0.2500 |
| Unanswered questions | 4 | 4 | 4 | 0 | 0 | 1.0000 | 1.0000 | 1.0000 |
| Macro average | — | — | — | — | — | 0.6750 | 0.6348 | 0.6534 |

[ADDED] Dataset expansion plan: report 10–15 meetings with duration, word count, speaker count, domain, language, and acoustic condition. Suitable public English-language resources include AMI [11], MeetingBank [2], and QMSum [3]. They do not substitute for reporting the corpus actually evaluated. Add one row per meeting after collection:

| Meeting ID | Duration | Words | Speakers | Domain | Language | Acoustic condition |
|---|---|---|---|---|---|---|
| [TODO: M01] | [TODO] | [TODO] | [TODO] | [TODO] | [TODO] | [TODO] |
| [TODO: M02] | [TODO] | [TODO] | [TODO] | [TODO] | [TODO] | [TODO] |
| [TODO: M03–M15] | [TODO] | [TODO] | [TODO] | [TODO] | [TODO] | [TODO] |

[ADDED] A Tamil audio sample appears in the grounding audit, where the output contains one action item and eight unanswered questions; this does not isolate whether Qwen2.5-7B extraction itself worked reliably because transcription and extraction errors are confounded. [TODO: evaluate Tamil transcripts against human annotations and report all metrics separately by language; do not pool with English results.]

### C. Baselines

[ADDED] Compare the modular extraction system against (1) a single-prompt full-summary baseline using the same Qwen2.5-7B, with identical transcript input and evaluation labels, and (2) optionally a larger locally executable model under a documented configuration. Report category precision, recall, F1, latency, failures, and resource use; results are pending.

| System | Macro F1 | Latency | Failure rate |
|---|---:|---:|---:|
| Modular Qwen2.5-7B | 0.6534 (reported; n=2 meetings) | [TODO] | [TODO] |
| Single-prompt Qwen2.5-7B | [TODO] | [TODO] | [TODO] |
| Optional larger local model | [TODO] | [TODO] | [TODO] |

[ADDED] Commercial cloud tools are outside the privacy scope of this local-processing evaluation and may be compared only qualitatively after sources are supplied. Feature comparison: local processing [TODO: cite], structured extraction [TODO: cite], transcript grounding [TODO: cite], hybrid retrieval [TODO: cite].

### D. Retrieval Quality

[ADDED] Retrieval effectiveness has not been measured. The existing retrieval-label file contains zero labeled queries, and the recorded benchmark states that Qdrant was not running; the RAG timing results used MongoDB fallback. The proposed protocol is to create 30–50 realistic queries, identify all relevant chunk IDs for each query by human judgment, and run the same queries against keyword-only MongoDB ranking, vector-only Qdrant ranking, and RRF hybrid ranking with k=60. Report mean reciprocal rank (MRR), normalized discounted cumulative gain at 5 (NDCG@5), and Recall@5, averaged across queries. Use identical corpus snapshots and filtering rules for all three conditions.

[ADDED] Table II. Retrieval effectiveness (pending relevance judgments).

| Method | MRR | NDCG@5 | Recall@5 |
|---|---:|---:|---:|
| Keyword-only (MongoDB) | [TODO] | [TODO] | [TODO] |
| Vector-only (Qdrant) | [TODO] | [TODO] | [TODO] |
| Hybrid RRF (k=60) | [TODO] | [TODO] | [TODO] |

[ADDED] Discussion template if hybrid wins: “Hybrid RRF achieved [TODO] MRR, [TODO] NDCG@5, and [TODO] Recall@5, compared with [TODO] for keyword-only and [TODO] for vector-only. This result supports improved ranking on this labeled query set; generalization is limited by [TODO: corpus/query scope].” If hybrid does not win: “Hybrid RRF did not outperform [best baseline] on [metrics]. This indicates that rank fusion did not improve retrieval for this corpus/query set; possible causes include [TODO: inspect rank overlap, indexing, and query distribution].” Until the experiment is run, RQ2 is a future-work question and no retrieval-quality result is claimed.

### E. Transcript Grounding Audit and Validation Plan

[ADDED] The implementation computes the fraction of extracted words longer than three characters that occur in the transcript and uses a 20% threshold. The supplied grounding benchmark counts 51 output items, 48 passing and 3 failing (94.12% pass; equivalently 5.88% flagged). However, implementation inspection shows that decisions and action items are retained after logging, questions are retained, while risks are conditionally filtered when the check fails. The audit therefore reflects stored outputs across categories and does not demonstrate a uniform runtime keep/flag policy. It is not a validated hallucination measure.

[ADDED] Table III. Sensitivity analysis and human validation (pending).

| Overlap threshold | Items flagged | Flagged rate |
|---:|---:|---:|
| 10% | [TODO] | [TODO] |
| 20% | 3/51 (observed audit; verify exact re-computation) | 5.88% (observed audit) |
| 30% | [TODO] | [TODO] |
| 40% | [TODO] | [TODO] |
| 50% | [TODO] | [TODO] |

[ADDED] Human-judgment design: sample N accepted items and N flagged items, with N=[TODO: choose and report; recommended at least 50 per group if available]. Two annotators independently label each item as supported or unsupported using the full source transcript and a written guideline. Report inter-annotator Cohen’s κ, the flag’s precision (flagged items that annotators judge unsupported), and recall (unsupported items flagged), with adjudication procedure and confidence intervals [TODO]. The principal false-positive mode is a valid paraphrase flagged because it uses different words; a false-negative mode is lexically similar wording that is nevertheless unsupported or reverses meaning. Future work will evaluate lightweight natural-language-inference models as a semantic support check, calibrated against human labels.

### F. Latency Measurement and Concurrency

[ADDED] Table IV. Sequential and parallel extraction timing (one run).

| Mode | Wall-clock latency (ms) | Stages | Completion status |
|---|---:|---:|---|
| Sequential | 490,289 | 9 | All stages reported successful |
| Parallel | 306,385 | 9 | 5 successful; 4 failed with `fetch failed` |
| Reported reduction | 37.51% | — | Single synthetic benchmark run |

[ADDED] The sequential stage inference times sum to 490,265 ms, whereas wall-clock latency is 490,289 ms, a 24 ms difference. [CHECK: retain the reported wall-clock total and verify timer boundaries/overhead in the source logs.] The parallel result's arithmetic reduction is consistent with the two wall-clock values, but four stages (agenda, action items, questions, classifier) failed. Thus, the result is a latency observation, not a completed equivalent-work comparison.

[ADDED] RQ1 validity is limited by a single run, incomplete environment details, unknown retry behavior for the sequential comparator, and failed parallel calls. The timing report describes one transcript identified as the largest database transcript but does not include its title; [TODO: identify the meeting and confirm both modes used the same transcript and stage outputs]. [TODO: provide `OLLAMA_NUM_PARALLEL`, `OLLAMA_MAX_LOADED_MODELS`, offload details, retry counts, and concurrency queue/worker settings.] Report mean ± standard deviation over at least three paired runs, and log per-stage retries, status, and output completeness.

[ADDED] Four parallel stages clustered at approximately 306 s and ended with `fetch failed`. This pattern is likely caused by a shared timeout or retry ceiling, but that explanation is a hypothesis that must be checked against Ollama/client timeout and retry logs. Report retry caps and backoff, queue size/worker limit, batch sizing, and per-stage attempt counts [TODO].

### G. Risk Extraction

[ADDED] Risk extraction is weak in the two-meeting benchmark (F1=0.25; one true positive, three false positives, and three false negatives). A revised method should define risks as transcript-supported conditions that may negatively affect objectives, include few-shot examples of implied risks, and apply a rule-based post-filter that rejects vague labels and unsupported generic strings. The current prompt already defines risk categories and exclusions, but the benchmark suggests further improvement is needed; no improvement is claimed until rerun.

[ADDED] Table V. Risk extraction before/after prompt revision.

| Prompt | Precision | Recall | F1 | Dataset / n |
|---|---:|---:|---:|---|
| Current prompt | 0.25 | 0.25 | 0.25 | Two meetings |
| Revised prompt + post-filter | [TODO] | [TODO] | [TODO] | [TODO] |

[ADDED] Proposed revised prompt:

```text
You extract risks from meeting transcripts. A risk is a transcript-supported condition, uncertainty, dependency, blocker, or unresolved concern that could negatively affect a project, decision, schedule, resource, compliance, security, or other stated objective.

Include explicit risks and clearly implied risks only when the transcript states both the underlying condition and a plausible negative consequence. Do not infer a risk merely because an issue, question, suggestion, or task was mentioned. Do not output generic placeholders such as "Risk 1".

Examples:
- Transcript: "The vendor has not confirmed delivery, and without the equipment we cannot start testing next week."
  Risk: "Unconfirmed vendor delivery may delay the planned start of testing."
- Transcript: "The team is considering a new name."
  Risk: (omit; no negative consequence is stated)
- Transcript: "We have no backup reviewer for the release, so approval may miss Friday's deadline."
  Risk: "Lack of a backup reviewer may delay release approval beyond Friday."

For every risk, include a short evidence quote from the transcript. If no supported risk exists, return an empty array. Return only valid JSON:
{"risks":[{"risk":"...","evidence":"..."}]}

Transcript:
{{TRANSCRIPT}}
```

[ADDED] Any post-filter should verify nonempty risk/evidence fields, require evidence text to be present in the source or a documented normalized match, and reject generic placeholder strings. This rule-based filter is not a semantic truth guarantee.

## V. Results

[ADDED] The extraction benchmark reports macro F1=0.6534 over four categories and two meetings. Performance varies substantially: unanswered-question F1 is 1.0 while risk F1 is 0.25. The separate lexical audit reports 48/51 items above the 20% overlap threshold. Because this threshold is lexical and the runtime applies it differently by item type, it should not be interpreted as a 94.12% factual accuracy rate.

[ADDED] The timing comparison reports a 37.51% reduction in one run, from 490,289 ms sequentially to 306,385 ms in parallel. Four parallel stages failed. The result therefore does not show that parallelism preserves extraction completeness or quality.

[ADDED] The project reports no retrieval relevance metrics. Existing query labels are empty and recorded RAG runs use MongoDB fallback, so no MRR, NDCG@5, or Recall@5 values are available.

## VI. Discussion

### A. Prototype Interface

[ADDED] Fig. 2 shows the meeting-analysis interface after a transcript has been processed, including the generated meeting overview and structured analysis sections. [CHECK: confirm the actual screenshot content and replace this description if Fig. 2 shows a different screen.]

**Fig. 2.** [ADDED] Meeting analysis dashboard displaying the processed meeting overview and extracted information panels. [CHECK: verify against source image.]

**Fig. 3.** [ADDED] Meeting upload interface showing the audio or transcript submission controls. [CHECK: verify against source image.]

**Fig. 4.** [ADDED] Search results view displaying matching meeting records and snippets for a user query. [CHECK: verify against source image.]

**Fig. 5.** [ADDED] Meeting detail view presenting transcript-linked structured extraction results. [CHECK: verify against source image.]

[ADDED] The supplied LaTeX source and accompanying figure assets include real screenshots for Figs. 2–5. Their captions were revised to describe the visible dashboard, question-answering, analytics/search, and extracted-detail views. The explicit Fig. 2 placeholder sentence is removed.

### B. Latency, Privacy, and Retrieval

[ADDED] Recorded vector-search timing around 3.1 s is unusually high for a local retrieval stage and warrants profiling. Separate query-embedding time from Qdrant network/search time, inspect Qdrant HNSW parameters and collection/index state, and compare cold-start with warm runs. The stored RAG benchmark itself used MongoDB fallback, so its approximately 3.1 s retrieval times must not be described as Qdrant vector-search latency. Quantized model variants may reduce inference time but can affect extraction quality and require a controlled comparison. Cache repeated query embeddings and stable retrieval results where privacy and freshness requirements permit. Smaller embedding models may reduce encoding latency and memory use, but require relevance evaluation before adoption. [ADDED] This system prioritizes local processing and user-controlled data handling; that privacy choice can trade off against latency when local hardware is constrained.

### C. Limitations

[ADDED] The extraction evaluation has two meetings and is not broad enough to establish generalization. The latency experiment is one synthetic run with four failed parallel stages. The lexical grounding threshold is unvalidated against human judgments and behaves differently across extraction categories in the runtime. Retrieval quality is unmeasured because no labeled queries were supplied and Qdrant was unavailable in the recorded evaluation. The corpus lacks a sufficiently documented 10–15 meeting inventory, and Tamil performance is not isolated from transcription quality. The single-prompt and larger-local-model baselines remain unrun. The supplied LaTeX source and figure assets are now available; final compilation and visual review are still required.

## VII. Conclusion

[ADDED] This paper describes a local meeting-intelligence prototype combining modular LLM extraction, transcript-overlap checks, and keyword/vector retrieval with RRF. On two annotated meetings, the extraction benchmark reports macro F1=0.6534; a separate lexical audit reports 48/51 items passing its 20% overlap threshold. A single sequential/parallel timing run reports 37.51% lower wall-clock latency, but four parallel stages failed, so the result is preliminary and does not establish equivalent successful processing. Retrieval relevance remains unmeasured; RQ2 is future work until 30–50 queries are labeled and keyword-only, vector-only, and hybrid rankings are evaluated using MRR, NDCG@5, and Recall@5. Future work includes repeated paired timing runs, expanded multilingual evaluation, human validation of grounding, risk-prompt baselines, and measured retrieval comparisons.

## References

[ADDED] The ordering below follows first appearance in this revised text. Verify bibliographic metadata against the original `.bib` file before submission; none was present in the supplied workspace.

[1] G. V. Cormack, C. L. A. Clarke, and S. Buettcher, “Reciprocal rank fusion outperforms Condorcet and individual rank learning methods,” in *Proc. 32nd Int. ACM SIGIR Conf. Research and Development in Information Retrieval*, 2009, pp. 758–759. [TODO: verify metadata.]

[2] S. Hu et al., “ MeetingBank: A benchmark dataset for meeting summarization,” in *Proc. 61st Annual Meeting of the Association for Computational Linguistics*, 2023. [TODO: verify full author list and pages.]

[3] “QMSum: A new benchmark for query-based multi-domain meeting summarization,” in *Proc. NAACL-HLT*, 2021. [TODO: verify authors and full bibliographic details.]

[4] V. Karpukhin et al., “Dense Passage Retrieval for Open-Domain Question Answering,” in *Proc. EMNLP*, 2020. [TODO: verify pages/DOI.]

[5] S. Robertson and H. Zaragoza, “The Probabilistic Relevance Framework: BM25 and Beyond,” *Foundations and Trends in Information Retrieval*, vol. 3, no. 4, pp. 333–389, 2009. [TODO: verify DOI.]

[6] Z. Ji et al., “Survey of Hallucination in Natural Language Generation,” *ACM Computing Surveys*, 2023. [TODO: verify volume, issue, pages, DOI.]

[7] P. Manakul, A. Liusie, and M. J. F. Gales, “SelfCheckGPT: Zero-Resource Black-Box Hallucination Detection for Generative Large Language Models,” in *Proc. EMNLP*, 2023. [TODO: verify pages/DOI.]

[8] A. Yang et al., “Qwen2.5 Technical Report,” arXiv:2412.15115, 2024. [TODO: verify version and author list.]

[9] Nomic AI, “Nomic Embed: Training a Reproducible Long Context Text Embedder,” arXiv:2402.01613, 2024. [TODO: verify exact title/authorship/version.]

[10] N. Reimers and I. Gurevych, “Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks,” in *Proc. EMNLP-IJCNLP*, 2019. [REMOVED: not relevant to the documented Nomic Embed implementation; omit from final bibliography unless used elsewhere.]

[11] J. Carletta et al., “The AMI Meeting Corpus: A Pre-announcement,” in *Proc. Workshop on Machine Learning for Multimodal Interaction*, 2005. [TODO: verify pages/metadata.]

## Data I Must Still Collect

[ADDED]

- [ ] Retrieval: label 30–50 queries with relevant chunk IDs; run keyword-only MongoDB, vector-only Qdrant, and RRF (k=60) on the same corpus; fill Table II MRR, NDCG@5, Recall@5 and choose the corresponding discussion template.
- [ ] Dataset: inventory 10–15 meetings with the seven fields in Section IV-B; annotate extraction references consistently. Record language per meeting and report Tamil separately.
- [ ] Tamil: human-annotate transcript and extracted categories; identify whether errors originate in transcription or Qwen2.5-7B extraction; report per-language metrics.
- [ ] Grounding: recompute flagged rates at 10%, 20%, 30%, 40%, and 50%; select N accepted and N flagged items [recommended N≥50 per group where corpus size permits], obtain two independent labels, report flag precision/recall and Cohen’s κ.
- [ ] Baselines: run same-model single-prompt baseline and optionally a larger local model against the same labeled meetings; fill Table baseline scores, latency, and failure rate.
- [ ] Risk: rerun the revised prompt and post-filter on the same annotated data; fill before/after precision, recall, F1 and dataset size.
- [ ] RQ1: run at least three paired sequential/parallel timings on the same transcript; report mean ± standard deviation, stage retries, failures, `OLLAMA_NUM_PARALLEL`, `OLLAMA_MAX_LOADED_MODELS`, context length, GPU/CPU offload, queue/worker limit, backoff, and batch size.
- [ ] Resolve [CHECK]: reconcile Table IV's 12 unanswered questions against the two-meeting benchmark's 4 predicted and 4 reference unanswered questions; identify distinct corpus/run if applicable.
- [ ] Resolve [CHECK]: confirm Fig. 2–5 screenshot content and final captions; provide original figure files and exact descriptions.
- [ ] Verify all reference metadata against the original bibliography. Decide whether Sentence-BERT [10] appears anywhere relevant; otherwise remove it and renumber references.

## Change Log

| Problem | Where fixed | Status |
|---|---|---|
| Abstract and index terms missing | Abstract; Index Terms | Done (reported metrics only) |
| Retrieval-quality overclaim | Introduction, IV-D, V, VI-C, VII | Done; experiment still needed |
| Confusing extraction counts | IV-B definitions and [CHECK] note | Needs my data / run identity |
| Grounding metric overstated | IV-E, V, VI-C | Done; human validation needed |
| Latency count and failures | IV-F | Done; timing validity needs data |
| RQ2 evaluation protocol and code | IV-D; script below | Needs my data |
| Dataset expansion and Tamil statement | IV-B | Needs my data |
| Baselines | IV-C | Needs my data |
| Risk prompt and evaluation slot | IV-G | Needs my data |
| Concurrency explanation | IV-F | Hypothesis marked for log verification |
| Vector latency/optimization discussion | VI-B | Done; profiling needed |
| Novelty/contributions | Introduction | Done; product comparison sources pending |
| Fig. 2–5 descriptions and captions | VI-A | Updated from supplied screenshot assets; verify in compiled PDF |
| Citation order and bibliography | References | Partial; metadata must be checked |
| Six reviewer response letter | Not possible from supplied files | Needs Reviews 1–6 text |

## Point-by-Point Response to Reviewers 1–6

[ADDED] We thank the reviewers for their careful assessment. In this revision, all claims are limited to measurements available in the project. Where requested experiments require new labels or repeated runs, the revised manuscript states the protocol and marks the results as pending rather than implying that the experiment has already been completed.

### Reviewer 1

**Comment: The work is a systems-engineering contribution, not a fundamental algorithmic advance; clarify novelty and compare with existing assistants.**  
**Response:** We agree. The Introduction now frames the contribution as a systems/engineering integration: local modular extraction, lexical auditing, and an RRF retrieval implementation. We removed claims of algorithmic novelty and added a cautious comparison paragraph. We have not named commercial or open-source products because no verifiable comparison sources were supplied; those cells remain marked `[TODO: cite]`.

**Comment: The evaluation has only three recordings (~47 minutes); expand to 10–15 diverse meetings.**  
**Response:** We agree that the current sample limits generalization. The extraction ground-truth benchmark available in the repository covers two annotated meetings; a separate grounding audit includes three stored meeting outputs, including a Tamil sample. The manuscript now distinguishes these populations instead of treating them as a single evaluation set. We added a 10–15 meeting inventory template for duration, words, speakers, domain, language, and acoustic condition. New meeting annotations and results remain to be collected.

**Comment: Compare keyword-only, vector-only, and hybrid retrieval using labeled relevance.**  
**Response:** We agree. The repository’s retrieval benchmark reports `NOT_MEASURED`: its relevance-label file has zero labeled queries, and the recorded RAG timing report used MongoDB fallback. Accordingly, the paper now makes no retrieval-quality claim, treats RQ2 as future work, and adds a 30–50 query protocol, MRR/NDCG@5/Recall@5 table, and evaluation script. These results must be collected before claiming hybrid retrieval improves relevance.

**Comment: Better position novelty relative to commercial/open-source assistants.**  
**Response:** We revised the contribution list and added a qualitative comparison framework covering local processing, structured extraction, grounding, and hybrid retrieval. Product-level comparisons remain pending sourced evidence.

**Comment: Remove placeholders, proofread, and discuss privacy/latency.**  
**Response:** The specified template funding sentence and Section VI-A placeholder sentence are removed. We added distinct captions based on the supplied screenshot assets and a privacy/latency discussion. The compiled revised PDF should still be checked for layout and image legibility.

### Reviewer 2

**Comment: The system integration is practical but incremental; clarify contribution.**  
**Response:** We agree and now state directly that the work is an applied systems contribution. We describe the established components as components and make no claim of a new model or retrieval algorithm.

**Comment: Dataset size is small and risk F1=0.250 warrants investigation.**  
**Response:** We agree. The paper reports the category-specific result without generalizing beyond the two annotated meetings. We added a revised risk-prompt proposal with explicit risk criteria, few-shot examples, evidence fields, and a rule-based post-filter, plus a before/after results table left as `[TODO]`. No improvement is claimed until the baseline and revised prompt are evaluated on the same labels.

**Comment: Lexical overlap cannot validate semantic support; add human evaluation and discuss NLI.**  
**Response:** We agree. The revised manuscript calls the 20% test a lexical heuristic, not a hallucination detector or accuracy metric. It adds threshold-sweep values, a two-annotator supported/unsupported study design, Cohen’s kappa, flag precision/recall, paraphrase false-positive and lexical-overlap false-negative modes, and lightweight NLI as future work. These validation measurements remain pending.

**Comment: Figs. 2–5 are placeholders or low resolution; replace them with screenshots.**  
**Response:** The review describes Figs. 2–5 as placeholders or low resolution. The supplied paper PDF visibly contains real application screenshots, and the editable project folder includes the corresponding image assets. We retained these screenshots, removed the explicit Fig. 2 placeholder sentence, and wrote distinct captions matching the displayed dashboard, Q&A, analytics/search, and extraction-detail views. Resolution and placement should be confirmed in the newly compiled PDF.

**Comment: Expand corpus, add baselines, and fix formatting.**  
**Response:** We added the corpus inventory plan and baseline design (same-model single-prompt and optional larger local model). Results are marked pending. We removed the specified placeholder and corrected the MeetingBank/action-item association. The editable LaTeX source is now available and has been revised; final compilation and IEEE layout inspection remain necessary.

### Reviewer 3

**Comment: Compare retrieval quality against keyword-only and vector-only methods.**  
**Response:** We agree that timing alone cannot establish retrieval relevance. The available benchmark file has no labeled queries and the RAG benchmark ran through MongoDB fallback, so retrieval quality is not reported. We added the three-condition comparison protocol (keyword-only, vector-only, RRF with k=60), the requested metrics, a blank results table, discussion templates for both possible outcomes, and a Python evaluator. The experiment remains outstanding.

**Comment: 48/51 lexical-overlap passes do not establish accuracy; compare to human judgments.**  
**Response:** We agree. We retain 48/51 only as the reported result of a 20% lexical-overlap audit and explicitly prohibit interpreting it as accuracy. The paper adds a human-judgment design with accepted and flagged samples, two annotators, support labels, flag precision/recall, and Cohen’s kappa. The sample size and all human-derived statistics remain `[TODO]`.

**Comment: Three recordings limit consistency/generalization.**  
**Response:** We agree. The paper now distinguishes the two-meeting extraction benchmark from the three-meeting grounding audit and adds the 10–15 meeting expansion plan. We do not present a combined sample size as if all meetings had the same annotations or protocol.

### Reviewer 4

**Comment: The 37.51% latency reduction is promising, but dataset size, baselines, and generalizability need attention.**  
**Response:** We retained the measured percentage but corrected its interpretation. The source timing artifact has n=1, and its parallel run has five successful stages and four `fetch failed` stages. Thus, it supports a single-run wall-clock observation, not a completed equivalent-work speedup or a statistically robust conclusion. We added paired repeated-run recommendations and extraction baseline plans. The corpus remains limited pending collection.

**Comment: Clarify the 20% threshold, adaptive/semantic grounding, and privacy/latency trade-off.**  
**Response:** We now define the overlap computation as the fraction of extracted words longer than three characters found in the transcript, with a 20% pass threshold. The threshold has not been validated as optimal; we added a 10–50% sensitivity sweep and human-label protocol. Lightweight NLI is proposed for future work, subject to local deployment and measured latency. The Discussion now states that local processing can trade latency for data control on constrained hardware.

**Comment: Discuss concurrency control, batch processing, and hardware optimization.**  
**Response:** We added discussion of retry caps/backoff, queue/worker limits, batch sizing, per-stage attempts, and hardware offload as required reporting fields. Four parallel calls cluster near 306 seconds and fail with `fetch failed`; a shared timeout or retry ceiling is presented only as a hypothesis to verify in logs, not as an established cause.

**Comment: Complete abstract, keywords, Fig. 2, and proofreading.**  
**Response:** We added an abstract and index terms, removed the cited placeholder sentence, and updated the Fig. 2 caption from the supplied screenshot. The source is revised; residual typesetting and spacing should be checked in the compiled PDF.

### Reviewer 5

**Comment: Hybrid retrieval was “appropriately evaluated.”**  
**Response:** We respectfully clarify this point based on the experiment artifacts. The repository’s retrieval evaluation is explicitly marked `NOT_MEASURED` because the relevance file contains zero labeled queries. The separate RAG benchmark records `mongodb_fallback`, not a Qdrant vector/hybrid evaluation, and states that answer accuracy is not measured. The system implements an RRF path, but the available evidence does not appropriately evaluate retrieval effectiveness. We have therefore removed any implication that hybrid relevance was established and added the missing comparison protocol.

**Comment: The dataset is too small, especially for risk extraction.**  
**Response:** We agree. The reported risk F1 remains 0.250 on the existing two-meeting extraction benchmark. We added the risk prompt/post-filter proposal and a results slot but do not claim that it improves performance before running the comparison. The 10–15 meeting expansion plan is included.

**Comment: Grounding may flag paraphrases and miss unsupported statements with lexical overlap; consider NLI.**  
**Response:** We agree and added both failure modes, a human validation protocol, threshold sweep, and lightweight NLI future-work statement. We also clarify that the audit flags do not uniformly control runtime outputs: the implementation retains many flagged categories, while risk validation filters failing items. Therefore 48/51 describes the saved-output audit and is not evidence that the validator removes all unsupported material.

**Comment: Parallel stages around 306 s suggest contention or retry overhead.**  
**Response:** The timing artifact confirms four stages at approximately 306.4 s with `fetch failed`. Contention or a shared timeout/retry ceiling are plausible hypotheses, but logs/configuration are needed to determine the cause. We mark this explicitly as a hypothesis and list the needed retry, queue, and worker settings.

**Comment: Figures 2–5 are placeholders; fix formatting and improve risk extraction.**  
**Response:** We removed the specified Section VI-A placeholder sentence and provided distinct captions based on the supplied figure assets. The current paper PDF shows real screenshots, so the review's description of all figures as placeholders does not match the provided draft. We added the proposed risk prompt, evidence requirement, post-filter, and unfilled before/after table. The editable LaTeX source has now been revised.

### Reviewer 6

**Comment: Expand evaluation to AMI, QMSum, MeetingBank, or a diverse in-house corpus.**  
**Response:** We agree that broader coverage is needed. The revised dataset plan includes 10–15 meetings and the requested metadata fields. AMI, QMSum, and MeetingBank are suggested as candidate English-language sources; no results from those corpora are claimed. The current Tamil sample is treated separately, and the paper requires language-specific evaluation before making multilingual claims.

**Comment: Add extraction and retrieval baselines, including commercial/local alternatives and MRR/NDCG.**  
**Response:** We added an extraction baseline design using a single-prompt full-summary setup with the same Qwen2.5-7B, plus an optional larger local model. We added the keyword-only/vector-only/RRF retrieval protocol with MRR, NDCG@5, and Recall@5. Commercial cloud tools are outside the privacy scope and are limited to a future qualitative feature comparison unless sources and a fair evaluation setup are supplied. All baseline values remain pending.

**Comment: Strengthen grounding validation and discuss false positives/negatives.**  
**Response:** We added the threshold sweep and independent two-annotator design, including supported/unsupported labels, flag precision/recall, Cohen’s kappa, and both lexical failure modes. We state that a lightweight local NLI model could be evaluated as future work; no semantic-grounding performance is claimed.

**Comment: Fix placeholders, tables/figures, spacing, and IEEE references.**  
**Response:** The specified textual placeholder is removed, the abstract/index terms are present, and the revised reference list is ordered by first appearance. We used the supplied `.tex` source and figure assets. The source is prepared for compilation; final IEEE layout, bibliography formatting, and image legibility need visual confirmation in the compiled PDF.

**Comment: Discuss vector retrieval (~3.1 s), RAG generation (~13.6 s), and optimization.**  
**Response:** We added profiling recommendations for separating query embedding and search time, checking HNSW/index settings, measuring cold versus warm behavior, testing quantization, caching, smaller embedding models, and asynchronous pre-computation. We also correct the measurement label: the available RAG timing report has approximately 3.1 s retrieval and 13.6 s end-to-end latency, but identifies the source as MongoDB fallback. It is therefore not valid to describe those recorded timings as measured Qdrant vector-search latency. Any optimization must be evaluated while preserving local processing and measuring retrieval quality.

## Retrieval Evaluation Script

[ADDED] Save as `server/benchmarks/evaluate_retrieval.py`. Input JSON format is documented in the script; each query supplies `relevant_chunk_ids` and ranked ID lists named `keyword`, `vector`, and `hybrid`.

```python
#!/usr/bin/env python3
"""Compute macro MRR, NDCG@5, and Recall@5 from labeled retrieval runs.

Input JSON:
{
  "queries": [{
    "id": "q1",
    "relevant_chunk_ids": ["c1", "c3"],
    "ranked": {
      "keyword": ["c2", "c1"],
      "vector": ["c1", "c3"],
      "hybrid": ["c3", "c1"]
    }
  }]
}

Each query must have at least one relevant chunk. Ranking IDs must be chunk IDs
and each method must be present. No external dependencies are required.
"""
import argparse
import json
import math
from pathlib import Path

METHODS = ("keyword", "vector", "hybrid")
K = 5


def metrics(ranked, relevant):
    ranked = list(ranked)
    relevant = set(relevant)
    if not relevant:
        raise ValueError("Each query needs at least one relevant_chunk_id")
    reciprocal_rank = next(
        (1.0 / rank for rank, chunk_id in enumerate(ranked, 1)
         if chunk_id in relevant), 0.0
    )
    dcg = sum(
        (1.0 if chunk_id in relevant else 0.0) / math.log2(i + 2)
        for i, chunk_id in enumerate(ranked[:K])
    )
    ideal_hits = min(len(relevant), K)
    idcg = sum(1.0 / math.log2(i + 2) for i in range(ideal_hits))
    recall = len(set(ranked[:K]) & relevant) / len(relevant)
    return {"mrr": reciprocal_rank, "ndcg_at_5": dcg / idcg,
            "recall_at_5": recall}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path, help="Labeled queries and ranked lists JSON")
    args = parser.parse_args()
    data = json.loads(args.input.read_text(encoding="utf-8"))
    queries = data.get("queries", [])
    if not queries:
        raise SystemExit("Input contains no labeled queries")

    per_method = {method: [] for method in METHODS}
    for query in queries:
        relevant = query.get("relevant_chunk_ids", [])
        ranked_lists = query.get("ranked", {})
        for method in METHODS:
            if method not in ranked_lists:
                raise SystemExit(f"Query {query.get('id')} missing ranked.{method}")
            per_method[method].append(metrics(ranked_lists[method], relevant))

    output = {
        "query_count": len(queries),
        "averaging": "macro mean over queries",
        "metrics": {
            method: {
                name: round(sum(row[name] for row in rows) / len(rows), 6)
                for name in ("mrr", "ndcg_at_5", "recall_at_5")
            }
            for method, rows in per_method.items()
        },
    }
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
```

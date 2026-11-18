# Revised IEEE paper source

`IEEE_Paper_final.tex` is the reviewer-response revision: it incorporates all
actionable changes from the six reviews (see `response_to_reviewers.md`) and is
ready to submit once the author checklist below is ticked. All five figures
(Fig. 1 pipeline diagram; Figs. 2–5 UI screenshots) are referenced from
`..\figs\` (i.e. `docs/figs`) via the `../figs/` paths in the
source, so compile from this folder.
`IEEE_Paper_Sanjay_Nesan_J_updated.tex` is kept for reference as the previous
iteration.

## Compile

Compile twice with a LaTeX distribution that includes IEEEtran:

```powershell
pdflatex IEEE_Paper_final.tex
pdflatex IEEE_Paper_final.tex
```

Review the generated PDF for two-column figure/table placement and reference
numbering.

## Before submission (author checklist)

- [ ] Rerun the patched 900 s client so RQ1 has a completed parallel time.
- [ ] Repair the RRF fusion path (single-candidate defect) and rerun the
      retrieval table with a chunk-level keyword baseline.
- [ ] Optional: extend the corpus to 10–15 meetings; run the verbatim-evidence
      risk prompt.
- [ ] Decide whether to add a network-isolation test, otherwise keep the
      "local, unverified" wording (title already avoids "privacy-preserving").


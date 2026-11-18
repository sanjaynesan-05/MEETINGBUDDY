#!/usr/bin/env python3
"""Compute macro MRR, NDCG@5, and Recall@5 for three ranked retrieval runs.

Input JSON example:
{
  "queries": [{
    "id": "q1",
    "relevant_chunk_ids": ["chunk-a", "chunk-c"],
    "ranked": {
      "keyword": ["chunk-b", "chunk-a"],
      "vector": ["chunk-a", "chunk-c"],
      "hybrid": ["chunk-c", "chunk-a"]
    }
  }]
}

Each query must contain one or more relevant chunk IDs and all three ranked
lists. Each ranked list is ordered best to worst and contains chunk IDs.
The evaluator uses binary relevance and macro-averages metrics over queries.
"""

import argparse
import json
import math
from pathlib import Path

METHODS = ("keyword", "vector", "hybrid")
K = 5


def score_query(ranked_ids, relevant_ids):
    ranked_ids = list(ranked_ids)
    relevant_ids = set(relevant_ids)
    if not relevant_ids:
        raise ValueError("Each query needs at least one relevant_chunk_id")

    reciprocal_rank = next(
        (1.0 / rank for rank, chunk_id in enumerate(ranked_ids, start=1)
         if chunk_id in relevant_ids),
        0.0,
    )
    dcg = sum(
        (1.0 if chunk_id in relevant_ids else 0.0) / math.log2(position + 2)
        for position, chunk_id in enumerate(ranked_ids[:K])
    )
    ideal_hits = min(len(relevant_ids), K)
    idcg = sum(1.0 / math.log2(position + 2) for position in range(ideal_hits))
    recall_at_5 = len(set(ranked_ids[:K]) & relevant_ids) / len(relevant_ids)

    return {
        "mrr": reciprocal_rank,
        "ndcg_at_5": dcg / idcg if idcg else 0.0,
        "recall_at_5": recall_at_5,
    }


def evaluate(data):
    queries = data.get("queries", [])
    if not queries:
        raise ValueError("Input contains no labeled queries")

    per_method = {method: [] for method in METHODS}
    for query in queries:
        ranked = query.get("ranked", {})
        relevant = query.get("relevant_chunk_ids", [])
        for method in METHODS:
            if method not in ranked:
                raise ValueError(
                    f"Query {query.get('id', '<unknown>')} is missing ranked.{method}"
                )
            per_method[method].append(score_query(ranked[method], relevant))

    metric_names = ("mrr", "ndcg_at_5", "recall_at_5")
    return {
        "query_count": len(queries),
        "averaging": "macro mean over queries",
        "metrics": {
            method: {
                metric: round(
                    sum(row[metric] for row in rows) / len(rows), 6
                )
                for metric in metric_names
            }
            for method, rows in per_method.items()
        },
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="Labeled queries and rankings JSON")
    args = parser.parse_args()
    try:
        data = json.loads(args.input.read_text(encoding="utf-8"))
        result = evaluate(data)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        parser.error(str(exc))
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()

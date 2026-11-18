const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';
const rrf = require('../../services/search/rrf.service');
const { applyTaskPrefix } = require('../../services/embeddings/embedding.provider');
const ragChat = require('../../services/ai/ragChat.service');

describe('reciprocal rank fusion', () => {
  const kw = [
    { meetingId: 'm1', chunkId: 'c1', text: 'alpha' },
    { meetingId: 'm1', chunkId: 'c2', text: 'beta' },
  ];
  const vec = [
    { meetingId: 'm1', chunkId: 'c2', text: 'beta' },
    { meetingId: 'm1', chunkId: 'c3', text: 'gamma' },
  ];

  it('keeps several chunks from the same meeting (fuses by chunk, not meeting)', () => {
    const fused = rrf._reciprocalRankFusion(kw, vec);
    assert.deepEqual(fused.map((r) => r.chunkId).sort(), ['c1', 'c2', 'c3']);
  });

  it('ranks a chunk found by both legs first and marks it Hybrid', () => {
    const fused = rrf._reciprocalRankFusion(kw, vec);
    assert.equal(fused[0].chunkId, 'c2');
    assert.equal(fused[0].matchType, 'Hybrid');
    assert.deepEqual(fused[0].sources.sort(), [0, 1]);
  });
});

describe('Nomic task prefixes', () => {
  it('prefixes documents and queries differently for nomic models', () => {
    assert.equal(applyTaskPrefix('hello', 'document', 'nomic-embed-text'), 'search_document: hello');
    assert.equal(applyTaskPrefix('hello', 'query', 'nomic-embed-text'), 'search_query: hello');
  });

  it('leaves other models untouched', () => {
    assert.equal(applyTaskPrefix('hello', 'query', 'bge-m3'), 'hello');
  });
});

describe('chat answer post-processing', () => {
  const chunks = [{ sourceLabel: '[S1]', meetingId: 'm1', meetingTitle: 'Weekly sync', snippet: 'text' }];

  it('extracts cited source labels', () => {
    const { citedLabels } = ragChat._parseResponse('Priya owns it [S1]. Also [S1].');
    assert.deepEqual(citedLabels, ['[S1]']);
  });

  it('does not attach a source to a "not found" answer', () => {
    const answer = "I couldn't find that information in the meeting transcripts.";
    assert.equal(ragChat._injectFallbackCitations(answer, [], chunks), answer);
  });

  it('attaches the top source by title when the model cited nothing', () => {
    const out = ragChat._injectFallbackCitations('Priya owns it.', [], chunks);
    assert.match(out, /Source: \[S1\] Weekly sync/);
  });
});

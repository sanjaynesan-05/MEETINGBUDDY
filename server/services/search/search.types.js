const MATCH_TYPES = {
  DECISION: 'Decision',
  ACTION_ITEM: 'Action Item',
  SUMMARY: 'Summary',
  KEYWORD: 'Keyword',
  PEOPLE: 'People',
  TECHNOLOGY: 'Technology',
  AGENDA: 'Agenda',
  DISCUSSION: 'Discussion',
  TRANSCRIPT: 'Transcript',
  RISK: 'Risk',
  QUESTION: 'Question',
  METADATA: 'Metadata'
};

// Configuration driving the dynamic scoring and `$addFields` generation
const SEARCH_FIELDS = [
  { field: 'aiAnalysis.decisions', weight: 10, type: MATCH_TYPES.DECISION },
  { field: 'aiAnalysis.actionItems.task', weight: 9, type: MATCH_TYPES.ACTION_ITEM },
  { field: 'aiAnalysis.actionItems.description', weight: 9, type: MATCH_TYPES.ACTION_ITEM },
  { field: 'aiAnalysis.summaryPoints', weight: 8, type: MATCH_TYPES.SUMMARY },
  { field: 'aiAnalysis.summary', weight: 8, type: MATCH_TYPES.SUMMARY },
  { field: 'aiAnalysis.keywords', weight: 8, type: MATCH_TYPES.KEYWORD },
  { field: 'aiAnalysis.people', weight: 7, type: MATCH_TYPES.PEOPLE },
  { field: 'aiAnalysis.technologies', weight: 7, type: MATCH_TYPES.TECHNOLOGY },
  { field: 'aiAnalysis.organizations', weight: 7, type: MATCH_TYPES.METADATA },
  { field: 'aiAnalysis.agenda', weight: 6, type: MATCH_TYPES.AGENDA },
  { field: 'aiAnalysis.discussionPoints', weight: 5, type: MATCH_TYPES.DISCUSSION },
  { field: 'aiAnalysis.risks', weight: 5, type: MATCH_TYPES.RISK },
  { field: 'aiAnalysis.questions.answered', weight: 4, type: MATCH_TYPES.QUESTION },
  { field: 'aiAnalysis.questions.unanswered', weight: 4, type: MATCH_TYPES.QUESTION },
  { field: 'transcript', weight: 3, type: MATCH_TYPES.TRANSCRIPT },
  { field: 'title', weight: 5, type: MATCH_TYPES.METADATA },
  { field: 'description', weight: 3, type: MATCH_TYPES.METADATA },
  { field: 'aiAnalysis.meetingType', weight: 3, type: MATCH_TYPES.METADATA },
];

module.exports = {
  MATCH_TYPES,
  SEARCH_FIELDS
};

const mongoose = require('mongoose');
const { SEARCH_FIELDS } = require('./search.types');
const { DEFAULT_REGEX_OPTIONS, MAX_SNIPPET_LENGTH } = require('./search.constants');

/**
 * Escapes characters in a string to be safely used in a regex
 */
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Builds the MongoDB Regex query pattern safely
 */
function buildRegexQuery(query) {
  return new RegExp(escapeRegex(query), DEFAULT_REGEX_OPTIONS);
}

/**
 * Constructs the $match stage for the aggregation pipeline
 */
function buildMatchStage(userId, query, filters = {}) {
  const match = {
    uploadedBy: new mongoose.Types.ObjectId(userId)
  };

  const { from, to, meetingType } = filters;

  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setUTCHours(23, 59, 59, 999);
      match.createdAt.$lte = toDate;
    }
  }

  if (meetingType) {
    match['aiAnalysis.meetingType'] = meetingType;
  }

  if (query) {
    const regexQuery = buildRegexQuery(query);
    const orConditions = SEARCH_FIELDS.map(f => {
      const condition = {};
      condition[f.field] = regexQuery;
      return condition;
    });
    match.$or = orConditions;
  }

  return match;
}

/**
 * Helper to recursively search an object for strings matching the query
 */
function findMatchInObject(obj, regex) {
  if (typeof obj === 'string') {
    return regex.test(obj) ? obj : null;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const match = findMatchInObject(item, regex);
      if (match) return match;
    }
  } else if (obj !== null && typeof obj === 'object') {
    for (const key in obj) {
      const match = findMatchInObject(obj[key], regex);
      if (match) return match;
    }
  }
  return null;
}

/**
 * Helper to get a nested property from an object (e.g., 'aiAnalysis.decisions')
 */
function getNestedProperty(obj, path) {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

/**
 * Extracts matched fields and matchType from the raw meeting document
 */
function extractMatchedFields(meeting, query) {
  const regex = buildRegexQuery(query);
  const matchedFields = [];
  let bestMatchType = null;
  let bestSnippetField = null;
  let bestSnippetText = null;

  for (const config of SEARCH_FIELDS) {
    const fieldValue = getNestedProperty(meeting, config.field);
    if (fieldValue) {
      const matchedString = findMatchInObject(fieldValue, regex);
      if (matchedString) {
        matchedFields.push(config.field);
        
        // Capture the first (highest weight, since SEARCH_FIELDS should be sorted by weight) as the best
        if (!bestMatchType) {
          bestMatchType = config.type;
          bestSnippetField = config.field.split('.').pop();
          bestSnippetText = matchedString;
        }
      }
    }
  }

  return {
    matchedFields,
    matchType: bestMatchType || 'Metadata',
    snippetField: bestSnippetField || 'Metadata',
    rawSnippetText: bestSnippetText || ''
  };
}

/**
 * Generates a context-aware snippet from the matched text
 */
function generateSnippet(fullText, query) {
  if (!fullText) return '';
  
  const regex = buildRegexQuery(query);
  const match = regex.exec(fullText);
  
  if (!match) return fullText.substring(0, MAX_SNIPPET_LENGTH) + '...';
  
  const matchIndex = match.index;
  const halfLength = Math.floor(MAX_SNIPPET_LENGTH / 2);
  
  let start = Math.max(0, matchIndex - halfLength);
  let end = Math.min(fullText.length, matchIndex + query.length + halfLength);
  
  // Adjust to not split words if possible
  if (start > 0) {
    const nextSpace = fullText.indexOf(' ', start);
    if (nextSpace !== -1 && nextSpace < matchIndex) {
      start = nextSpace + 1;
    }
  }
  
  if (end < fullText.length) {
    const prevSpace = fullText.lastIndexOf(' ', end);
    if (prevSpace !== -1 && prevSpace > matchIndex + query.length) {
      end = prevSpace;
    }
  }
  
  let snippet = fullText.substring(start, end).trim();
  if (start > 0) snippet = '...' + snippet;
  if (end < fullText.length) snippet = snippet + '...';
  
  return snippet;
}

module.exports = {
  buildRegexQuery,
  buildMatchStage,
  extractMatchedFields,
  generateSnippet
};

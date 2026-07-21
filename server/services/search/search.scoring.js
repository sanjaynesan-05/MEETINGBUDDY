const { SEARCH_FIELDS } = require('./search.types');
const { buildRegexQuery } = require('./search.helpers');

/**
 * Dynamically builds the scoring $addFields stage based on SEARCH_FIELDS config
 */
function buildScoringStage(query) {
  if (!query) return null;

  const regexQueryString = query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'); // simple escape for mongo regex operator
  
  const keywordScoreBranches = SEARCH_FIELDS.map(config => {
    return {
      $cond: [
        { 
          $regexMatch: { 
            input: { $ifNull: [{ $toString: `$${config.field}` }, ""] }, 
            regex: regexQueryString, 
            options: "i" 
          } 
        },
        config.weight,
        0
      ]
    };
  });

  // Note: For array fields (like decisions, keywords), MongoDB $regexMatch on an array of strings 
  // requires a bit of care, but $regexMatch with `$toString` is a quick hack to search across serialized nested structures or arrays.
  // Actually, to do it perfectly in MongoDB on arrays, we'd need `$reduce` or `$anyElementTrue`, 
  // but since we are trying to keep it efficient and not rewrite schema, serializing to string is a robust fallback.
  // A better approach for arrays is just converting the array to a single string:
  const robustKeywordScoreBranches = SEARCH_FIELDS.map(config => {
    return {
      $cond: [
        { 
          $regexMatch: { 
            // Convert arrays to string to regex match properly in aggregation framework
            input: { 
              $reduce: {
                input: {
                  $cond: {
                    if: { $isArray: `$${config.field}` },
                    then: `$${config.field}`,
                    else: [ `$${config.field}` ] // wrap single field in array
                  }
                },
                initialValue: "",
                in: { $concat: ["$$value", " ", { $toString: "$$this" }] }
              }
            },
            regex: regexQueryString, 
            options: "i" 
          } 
        },
        config.weight,
        0
      ]
    };
  });

  return {
    $addFields: {
      keywordScore: { $add: robustKeywordScoreBranches },
      semanticScore: 0, // Placeholder for future RAG / embeddings
      finalScore: { 
        $add: [
          { $add: robustKeywordScoreBranches }, 
          0 // + semanticScore when implemented
        ] 
      }
    }
  };
}

module.exports = {
  buildScoringStage
};

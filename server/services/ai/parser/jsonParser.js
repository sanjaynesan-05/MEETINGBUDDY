class JsonParser {

    parse(response) {
        if (!response || typeof response !== 'string') {
            throw new Error("JSON_PARSE_ERROR: AI returned an empty or invalid response.");
        }

        let cleaned = response.trim();
        
        // Remove Markdown code fences
        cleaned = cleaned.replace(/^```(json)?\s*/i, "");
        cleaned = cleaned.replace(/\s*```$/i, "");
        cleaned = cleaned.trim();
        
        try {
            return JSON.parse(cleaned);
        } catch (initialError) {
            console.warn("Initial JSON parse failed, attempting repair...");
            
            try {
                // Attempt 1: Extract payload between { } or [ ]
                const firstBrace = cleaned.indexOf('{');
                const lastBrace = cleaned.lastIndexOf('}');
                const firstBracket = cleaned.indexOf('[');
                const lastBracket = cleaned.lastIndexOf(']');
                
                let extracted = cleaned;
                if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
                    extracted = cleaned.substring(firstBrace, lastBrace + 1);
                } else if (firstBracket !== -1 && lastBracket !== -1) {
                    extracted = cleaned.substring(firstBracket, lastBracket + 1);
                }
                
                // Attempt 2: Clean trailing commas
                extracted = extracted.replace(/,\s*([\]}])/g, '$1');
                
                return JSON.parse(extracted);
            } catch (repairError) {
                console.error("JSON Parser Error Details:", initialError);
                throw new Error(`JSON_PARSE_ERROR: JSON Parsing failed after repair: ${initialError.message}. Response snippet: ${response.substring(0, 100)}`);
            }
        }
    }

}

module.exports = new JsonParser();
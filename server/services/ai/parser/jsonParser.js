class JsonParser {

    parse(response) {

        try {

            if (!response || typeof response !== 'string') {
                throw new Error("AI returned an empty or invalid response.");
            }

            let cleaned = response.trim();

            // Remove Markdown code fences if present
            cleaned = cleaned.replace(/^```(json)?\s*/i, "");
            cleaned = cleaned.replace(/\s*```$/i, "");
            cleaned = cleaned.trim();

            // Handle trailing commas before closing brackets/braces
            cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');

            // Handle some common invalid escaped characters (like literal unescaped tabs or newlines outside of valid JSON strings)
            // We will let JSON.parse attempt it, and catch parsing errors to return meaningful details.
            
            return JSON.parse(cleaned);

        } catch (error) {

            console.error("JSON Parser Error Details:", error);
            
            // Return meaningful error
            throw new Error(`JSON Parsing failed: ${error.message}. Response snippet: ${response ? response.substring(0, 100) : "empty"}`);

        }

    }

}

module.exports = new JsonParser();
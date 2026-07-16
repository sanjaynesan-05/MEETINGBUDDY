class JsonParser {

    parse(response) {

        try {

            if (!response) {
                throw new Error("AI returned an empty response.");
            }

            let cleaned = response.trim();

            // Remove Markdown code fences if present
            cleaned = cleaned.replace(/^```json/i, "");
            cleaned = cleaned.replace(/^```/i, "");
            cleaned = cleaned.replace(/```$/i, "");

            return JSON.parse(cleaned);

        } catch (error) {

            console.error("JSON Parser Error");
            console.error(error.message);

            throw new Error("Invalid JSON returned by AI.");

        }

    }

}

module.exports = new JsonParser();
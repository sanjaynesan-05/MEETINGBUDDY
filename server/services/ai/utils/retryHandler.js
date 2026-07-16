class RetryHandler {
    /**
     * Executes a function with exponential backoff retry logic.
     * @param {Function} operation - An async function to execute.
     * @param {number} maxAttempts - Maximum number of attempts (default 3).
     * @param {number} baseDelay - Base delay in milliseconds (default 1000).
     */
    async withRetry(operation, maxAttempts = 3, baseDelay = 1000) {
        let attempt = 1;
        while (attempt <= maxAttempts) {
            try {
                return await operation();
            } catch (error) {
                console.warn(`Attempt ${attempt} failed: ${error.message}`);
                
                if (attempt === maxAttempts) {
                    console.error(`All ${maxAttempts} attempts failed.`);
                    throw error;
                }
                
                const delayMs = baseDelay * Math.pow(2, attempt - 1);
                console.log(`Waiting ${delayMs}ms before retrying...`);
                await this._sleep(delayMs);
                
                attempt++;
            }
        }
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new RetryHandler();

const parseResponse = (rawResponse) => {
  console.log('Parsing response...');
  
  if (!rawResponse || typeof rawResponse.response === 'undefined') {
    throw new Error('Empty or invalid response from LLM');
  }
  
  const answer = rawResponse.response.trim();
  
  if (answer.length === 0) {
    throw new Error('LLM generated an empty response');
  }
  
  return { answer };
};

module.exports = { parseResponse };

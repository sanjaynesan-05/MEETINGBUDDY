const { validateGenerationRequest } = require('../utils/generationValidator');
const { generateResponse } = require('../services/generationService');
const config = require('../config/generationConfig');

const generateAIResponse = async (req, res) => {
  try {
    const { promptPackage } = req.body;
    
    validateGenerationRequest(promptPackage);
    
    const result = await generateResponse(promptPackage);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error generating AI response:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error during generation'
    });
  }
};

const getHealth = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      model: config.OLLAMA_MODEL,
      runtime: 'ollama',
      status: 'healthy'
    });
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
};

module.exports = { generateAIResponse, getHealth };

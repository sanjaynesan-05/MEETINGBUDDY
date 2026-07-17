const { buildPromptPackage } = require('../services/promptBuilderService');

const previewPrompt = async (req, res) => {
  try {
    const { question, context, template } = req.body;
    
    if (!question || !context) {
      return res.status(400).json({
        success: false,
        error: 'Missing question or context'
      });
    }
    
    const promptPackage = buildPromptPackage(question, context, template);
    
    return res.status(200).json(promptPackage);
  } catch (error) {
    console.error('Prompt controller error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error building prompt'
    });
  }
};

const getHealth = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      builderReady: true,
      template: 'chat',
      status: 'healthy'
    });
  } catch (error) {
    console.error('Status controller error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to check prompt builder health'
    });
  }
};

module.exports = { previewPrompt, getHealth };

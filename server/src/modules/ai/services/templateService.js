const getTemplate = (templateName) => {
  console.log('Loading template...');
  const supportedTemplates = ['chat', 'summary', 'action_items', 'decisions', 'risks', 'questions'];
  
  if (!supportedTemplates.includes(templateName)) {
    throw new Error(`Template ${templateName} not found.`);
  }
  
  if (templateName !== 'chat') {
    throw new Error(`Not Implemented: Template '${templateName}' is currently unsupported.`);
  }
  
  return templateName;
};

module.exports = { getTemplate };

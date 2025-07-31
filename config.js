// Configuration for AI-Powered Circuit Builder
const CONFIG = {
    // Replace with your OpenAI API key
    OPENAI_API_KEY: '',
    
    // AI model settings
    AI_MODEL: 'gpt-4o',
    AI_TEMPERATURE: 0.7,
    AI_MAX_TOKENS: 750
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} 
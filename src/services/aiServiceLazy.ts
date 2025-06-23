let aiServicePromise: Promise<any> | null = null;

export const getAIService = async () => {
  if (!aiServicePromise) {
    aiServicePromise = import('./aiService').then(module => module.aiService);
  }
  return aiServicePromise;
};

export const transcribeAudio = async (audioBlob: Blob) => {
  const aiService = await getAIService();
  return aiService.transcribeAudio(audioBlob);
};

export const generateResponse = async (prompt: string) => {
  const aiService = await getAIService();
  return aiService.generateResponse(prompt);
};
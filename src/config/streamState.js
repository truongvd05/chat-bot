const streamingConversations = new Map();

export const setStreaming = (conversationId) =>
    streamingConversations.set(conversationId, true);
export const clearStreaming = (conversationId) =>
    streamingConversations.delete(conversationId);
export const isStreaming = (conversationId) =>
    streamingConversations.get(conversationId) === true;

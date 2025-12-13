import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ConversationMessage {
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  id: string;
  attachments?: any[];
  hasAudio?: boolean;
  imageUrl?: string;
  videoUrl?: string;
  downloadUrl?: string;
  fileData?: any;
}

interface ConversationMemory {
  id: string;
  userId: string;
  summary: string;
  keyTopics: string[];
  preferences: Record<string, any>;
  lastUpdated: Date;
}

const MEMORY_STORAGE_KEY = 'nurath-conversation-memory';
const CONTEXT_STORAGE_KEY = 'nurath-context-summary';

export const useConversationMemory = (userId?: string) => {
  const [memory, setMemory] = useState<ConversationMemory | null>(null);
  const [contextSummary, setContextSummary] = useState<string>('');
  const [keyTopics, setKeyTopics] = useState<string[]>([]);

  // Load memory from localStorage on mount
  useEffect(() => {
    try {
      const savedMemory = localStorage.getItem(MEMORY_STORAGE_KEY);
      const savedContext = localStorage.getItem(CONTEXT_STORAGE_KEY);
      
      if (savedMemory) {
        const parsed = JSON.parse(savedMemory);
        setMemory({
          ...parsed,
          lastUpdated: new Date(parsed.lastUpdated)
        });
      }
      
      if (savedContext) {
        const parsed = JSON.parse(savedContext);
        setContextSummary(parsed.summary || '');
        setKeyTopics(parsed.topics || []);
      }
    } catch (e) {
      console.error('Failed to load conversation memory:', e);
    }
  }, []);

  // Extract key topics from conversation
  const extractTopics = useCallback((messages: ConversationMessage[]): string[] => {
    const allText = messages.map(m => m.content).join(' ').toLowerCase();
    const topics: string[] = [];
    
    // Common topic keywords
    const topicPatterns = [
      { pattern: /programming|coding|code|developer|software/gi, topic: 'Programming' },
      { pattern: /python|javascript|typescript|react|node/gi, topic: 'Web Development' },
      { pattern: /ai|artificial intelligence|machine learning|ml/gi, topic: 'AI/ML' },
      { pattern: /swahili|kiswahili|tanzania|kenya/gi, topic: 'Swahili Language' },
      { pattern: /learn|study|tutorial|course|education/gi, topic: 'Learning' },
      { pattern: /image|photo|picture|visual/gi, topic: 'Image Analysis' },
      { pattern: /voice|audio|speech|sound/gi, topic: 'Voice/Audio' },
      { pattern: /video|camera|record/gi, topic: 'Video' },
      { pattern: /file|document|pdf|upload/gi, topic: 'Documents' },
      { pattern: /help|question|how to|explain/gi, topic: 'Q&A' },
    ];
    
    topicPatterns.forEach(({ pattern, topic }) => {
      if (pattern.test(allText) && !topics.includes(topic)) {
        topics.push(topic);
      }
    });
    
    return topics.slice(0, 5); // Keep top 5 topics
  }, []);

  // Generate context summary from recent messages
  const generateSummary = useCallback((messages: ConversationMessage[]): string => {
    if (messages.length === 0) return '';
    
    const recentMessages = messages.slice(-10);
    const userMessages = recentMessages.filter(m => m.type === 'user');
    
    if (userMessages.length === 0) return '';
    
    // Create a brief summary of what was discussed
    const mainTopics = userMessages
      .map(m => m.content.slice(0, 100))
      .slice(-3)
      .join('. ');
    
    return `Recent conversation topics: ${mainTopics}`;
  }, []);

  // Update memory with new conversation data
  const updateMemory = useCallback((messages: ConversationMessage[]) => {
    const topics = extractTopics(messages);
    const summary = generateSummary(messages);
    
    const newMemory: ConversationMemory = {
      id: memory?.id || crypto.randomUUID(),
      userId: userId || 'anonymous',
      summary,
      keyTopics: topics,
      preferences: memory?.preferences || {},
      lastUpdated: new Date()
    };
    
    setMemory(newMemory);
    setContextSummary(summary);
    setKeyTopics(topics);
    
    // Persist to localStorage
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(newMemory));
    localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify({
      summary,
      topics
    }));
    
    return newMemory;
  }, [memory, userId, extractTopics, generateSummary]);

  // Get context for AI prompt
  const getContextForAI = useCallback((): string => {
    if (!contextSummary && keyTopics.length === 0) {
      return '';
    }
    
    let context = '';
    
    if (keyTopics.length > 0) {
      context += `User interests: ${keyTopics.join(', ')}. `;
    }
    
    if (contextSummary) {
      context += contextSummary;
    }
    
    return context;
  }, [contextSummary, keyTopics]);

  // Clear memory
  const clearMemory = useCallback(() => {
    setMemory(null);
    setContextSummary('');
    setKeyTopics([]);
    localStorage.removeItem(MEMORY_STORAGE_KEY);
    localStorage.removeItem(CONTEXT_STORAGE_KEY);
  }, []);

  // Update user preferences
  const updatePreference = useCallback((key: string, value: any) => {
    if (memory) {
      const updated = {
        ...memory,
        preferences: {
          ...memory.preferences,
          [key]: value
        },
        lastUpdated: new Date()
      };
      setMemory(updated);
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(updated));
    }
  }, [memory]);

  return {
    memory,
    contextSummary,
    keyTopics,
    updateMemory,
    getContextForAI,
    clearMemory,
    updatePreference
  };
};

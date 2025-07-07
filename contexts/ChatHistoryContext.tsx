import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { ChatMessage, ChatRole } from '../types';
import type { Content } from '@google/genai';

interface ChatHistoryContextType {
  messages: ChatMessage[];
  history: Content[];
  addMessage: (role: ChatRole, text: string) => ChatMessage;
  updateLastMessage: (chunk: string) => void;
  setStreamLoading: (isLoading: boolean) => void;
  clearHistory: () => void;
  isLoading: boolean;
}

const ChatHistoryContext = createContext<ChatHistoryContextType | undefined>(undefined);

const CHAT_HISTORY_KEY = 'memoriaChatHistory';

export const ChatHistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(CHAT_HISTORY_KEY);
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(parsed);
      }
    } catch (error) {
      console.error("Failed to load chat history from localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error("Failed to save chat history to localStorage", error);
    }
  }, [messages]);

  const addMessage = useCallback((role: ChatRole, text: string): ChatMessage => {
    const newMessage: ChatMessage = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      role,
      text,
      timestamp: new Date(),
      isStreaming: role === ChatRole.MODEL,
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);
  
  const updateLastMessage = useCallback((chunk: string) => {
    setMessages(prev => {
        if (prev.length === 0 || prev[prev.length - 1].role !== ChatRole.MODEL) {
            return prev;
        }
        const newMessages = [...prev];
        const lastMessage = { ...newMessages[newMessages.length - 1] };
        lastMessage.text += chunk;
        newMessages[newMessages.length - 1] = lastMessage;
        return newMessages;
    });
  }, []);

  const setStreamLoading = useCallback((isLoading: boolean) => {
    setMessages(prev => {
        if (prev.length === 0 || prev[prev.length - 1].role !== ChatRole.MODEL) {
            return prev;
        }
        const newMessages = [...prev];
        const lastMessage = { ...newMessages[newMessages.length - 1] };
        lastMessage.isStreaming = isLoading;
        newMessages[newMessages.length - 1] = lastMessage;
        return newMessages;
    })
  }, []);


  const clearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(CHAT_HISTORY_KEY);
  }, []);

  const history: Content[] = messages.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }],
  }));

  return (
    <ChatHistoryContext.Provider value={{ 
        messages,
        history, 
        addMessage,
        updateLastMessage,
        setStreamLoading,
        clearHistory,
        isLoading 
    }}>
      {children}
    </ChatHistoryContext.Provider>
  );
};

export const useChatHistory = (): ChatHistoryContextType => {
  const context = useContext(ChatHistoryContext);
  if (context === undefined) {
    throw new Error('useChatHistory must be used within a ChatHistoryProvider');
  }
  return context;
};

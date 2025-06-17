import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { ESP32_WEB_SERVER_URL_DEFAULT, ESP32_URL_STORAGE_KEY } from '../constants';

interface Esp32ConfigContextType {
  esp32Url: string;
  updateEsp32Url: (newUrl: string) => void;
  isLoading: boolean;
  isDefaultUrl: boolean;
}

const Esp32ConfigContext = createContext<Esp32ConfigContextType | undefined>(undefined);

export const Esp32ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [esp32Url, setEsp32Url] = useState<string>(ESP32_WEB_SERVER_URL_DEFAULT);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUrl = localStorage.getItem(ESP32_URL_STORAGE_KEY);
      if (savedUrl) {
        setEsp32Url(savedUrl);
      } else {
        // If nothing in localStorage, keep the default placeholder.
        // The user will be prompted to change it.
        setEsp32Url(ESP32_WEB_SERVER_URL_DEFAULT);
      }
    } catch (error) {
      console.error("Failed to load ESP32 URL from localStorage", error);
      setEsp32Url(ESP32_WEB_SERVER_URL_DEFAULT); // Fallback to default on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateEsp32Url = useCallback((newUrl: string) => {
    const trimmedUrl = newUrl.trim();
    setEsp32Url(trimmedUrl);
    try {
      if (trimmedUrl) {
        localStorage.setItem(ESP32_URL_STORAGE_KEY, trimmedUrl);
      } else {
        // If user clears the URL, we might want to revert to placeholder or handle empty state.
        // For now, allow saving an empty string, which Esp32WebPage should handle.
        localStorage.setItem(ESP32_URL_STORAGE_KEY, ''); 
      }
    } catch (error) {
      console.error("Failed to save ESP32 URL to localStorage", error);
    }
  }, []);

  const isDefaultUrl = esp32Url === ESP32_WEB_SERVER_URL_DEFAULT || esp32Url === "";

  return (
    <Esp32ConfigContext.Provider value={{ esp32Url, updateEsp32Url, isLoading, isDefaultUrl }}>
      {children}
    </Esp32ConfigContext.Provider>
  );
};

export const useEsp32Config = (): Esp32ConfigContextType => {
  const context = useContext(Esp32ConfigContext);
  if (context === undefined) {
    throw new Error('useEsp32Config must be used within an Esp32ConfigProvider');
  }
  return context;
};
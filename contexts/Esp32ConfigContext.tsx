import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { ESP32_WEB_SERVER_URL_DEFAULT, ESP32_URL_STORAGE_KEY, FLASK_SERVER_URL_DEFAULT, FLASK_URL_STORAGE_KEY } from '../constants';

interface Esp32ConfigContextType {
  esp32Url: string;
  flaskUrl: string;
  updateEsp32Url: (newUrl: string) => void;
  updateFlaskUrl: (newUrl: string) => void;
  isLoading: boolean;
  isDefaultEsp32Url: boolean;
  isDefaultFlaskUrl: boolean;
}

const Esp32ConfigContext = createContext<Esp32ConfigContextType | undefined>(undefined);

export const Esp32ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [esp32Url, setEsp32Url] = useState<string>(ESP32_WEB_SERVER_URL_DEFAULT);
  const [flaskUrl, setFlaskUrl] = useState<string>(FLASK_SERVER_URL_DEFAULT);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedEsp32Url = localStorage.getItem(ESP32_URL_STORAGE_KEY);
      const savedFlaskUrl = localStorage.getItem(FLASK_URL_STORAGE_KEY);
      setEsp32Url(savedEsp32Url || ESP32_WEB_SERVER_URL_DEFAULT);
      setFlaskUrl(savedFlaskUrl || FLASK_SERVER_URL_DEFAULT);
    } catch (error) {
      setEsp32Url(ESP32_WEB_SERVER_URL_DEFAULT);
      setFlaskUrl(FLASK_SERVER_URL_DEFAULT);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateEsp32Url = useCallback((newUrl: string) => {
    const trimmedUrl = newUrl.trim();
    setEsp32Url(trimmedUrl);
    try {
      localStorage.setItem(ESP32_URL_STORAGE_KEY, trimmedUrl);
    } catch (error) {}
  }, []);

  const updateFlaskUrl = useCallback((newUrl: string) => {
    const trimmedUrl = newUrl.trim();
    setFlaskUrl(trimmedUrl);
    try {
      localStorage.setItem(FLASK_URL_STORAGE_KEY, trimmedUrl);
    } catch (error) {}
  }, []);

  const isDefaultEsp32Url = esp32Url === ESP32_WEB_SERVER_URL_DEFAULT || esp32Url === "";
  const isDefaultFlaskUrl = flaskUrl === FLASK_SERVER_URL_DEFAULT || flaskUrl === "";

  return (
    <Esp32ConfigContext.Provider value={{ esp32Url, flaskUrl, updateEsp32Url, updateFlaskUrl, isLoading, isDefaultEsp32Url, isDefaultFlaskUrl }}>
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
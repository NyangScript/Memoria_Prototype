import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { CameraSource, DEFAULT_CAMERA_SOURCE, CAMERA_SOURCE_KEY } from '../constants';

interface CameraSettingsContextType {
  cameraSource: CameraSource;
  updateCameraSource: (source: CameraSource) => void;
  isLoading: boolean;
}

const CameraSettingsContext = createContext<CameraSettingsContextType | undefined>(undefined);

export const CameraSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cameraSource, setCameraSource] = useState<CameraSource>(DEFAULT_CAMERA_SOURCE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedSource = localStorage.getItem(CAMERA_SOURCE_KEY);
      if (savedSource && (savedSource === 'device' || savedSource === 'esp32')) {
        setCameraSource(savedSource as CameraSource);
      } else {
        setCameraSource(DEFAULT_CAMERA_SOURCE);
        localStorage.setItem(CAMERA_SOURCE_KEY, DEFAULT_CAMERA_SOURCE);
      }
    } catch (error) {
      console.error("Failed to load camera source from localStorage", error);
      setCameraSource(DEFAULT_CAMERA_SOURCE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateCameraSource = useCallback((source: CameraSource) => {
    setCameraSource(source);
    try {
      localStorage.setItem(CAMERA_SOURCE_KEY, source);
    } catch (error) {
      console.error("Failed to save camera source to localStorage", error);
    }
  }, []);

  return (
    <CameraSettingsContext.Provider value={{ cameraSource, updateCameraSource, isLoading }}>
      {children}
    </CameraSettingsContext.Provider>
  );
};

export const useCameraSettings = (): CameraSettingsContextType => {
  const context = useContext(CameraSettingsContext);
  if (context === undefined) {
    throw new Error('useCameraSettings must be used within a CameraSettingsProvider');
  }
  return context;
};
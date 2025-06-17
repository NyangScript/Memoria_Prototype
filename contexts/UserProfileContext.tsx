
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import { DEFAULT_PATIENT_NAME } from '../constants';

interface UserProfileContextType {
  profile: UserProfile;
  updateProfile: (newProfile: Partial<UserProfile>) => void;
  isLoading: boolean;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'memoriaUserProfile';

export const UserProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>({ name: DEFAULT_PATIENT_NAME, image: undefined });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      } else {
        setProfile({ name: DEFAULT_PATIENT_NAME, image: undefined });
      }
    } catch (error) {
      console.error("Failed to load user profile from localStorage", error);
      setProfile({ name: DEFAULT_PATIENT_NAME, image: undefined });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback((newProfileData: Partial<UserProfile>) => {
    setProfile(prevProfile => {
      const updatedProfile = { ...prevProfile, ...newProfileData };
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProfile));
      } catch (error) {
        console.error("Failed to save user profile to localStorage", error);
      }
      return updatedProfile;
    });
  }, []);

  return (
    <UserProfileContext.Provider value={{ profile, updateProfile, isLoading }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = (): UserProfileContextType => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};

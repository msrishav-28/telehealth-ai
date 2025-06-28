import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Persona } from '@prisma/client';

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sound: boolean;
  emergencyAlerts: boolean;
  conversationReminders: boolean;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  screenReader: boolean;
  keyboardNavigation: boolean;
}

export interface UserPreferences {
  // Appearance
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  
  // Accessibility
  accessibility: AccessibilitySettings;
  
  // Chat preferences
  preferredPersona?: Persona;
  autoSave: boolean;
  showTimestamps: boolean;
  enableVoiceInput: boolean;
  enableSoundEffects: boolean;
  messageGrouping: boolean;
  
  // Notifications
  notifications: NotificationSettings;
  
  // Privacy
  saveHistory: boolean;
  shareAnalytics: boolean;
  
  // Language and locale
  language: string;
  timezone: string;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
}

interface UserPreferencesState {
  preferences: UserPreferences;
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  updateAccessibility: (settings: Partial<AccessibilitySettings>) => void;
  updateNotifications: (settings: Partial<NotificationSettings>) => void;
  resetToDefaults: () => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  accentColor: '#3b82f6',
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    fontSize: 'medium',
    screenReader: false,
    keyboardNavigation: false,
  },
  autoSave: true,
  showTimestamps: true,
  enableVoiceInput: true,
  enableSoundEffects: true,
  messageGrouping: true,
  notifications: {
    email: false,
    push: false,
    sound: true,
    emergencyAlerts: true,
    conversationReminders: false,
  },
  saveHistory: true,
  shareAnalytics: true,
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
};

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set, get) => ({
      preferences: defaultPreferences,

      setPreferences: (newPreferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...newPreferences },
        })),

      updateAccessibility: (settings) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            accessibility: { ...state.preferences.accessibility, ...settings },
          },
        })),

      updateNotifications: (settings) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            notifications: { ...state.preferences.notifications, ...settings },
          },
        })),

      resetToDefaults: () => set({ preferences: defaultPreferences }),
    }),
    {
      name: 'user-preferences',
    }
  )
);

// Selectors
export const useTheme = () =>
  useUserPreferencesStore((state) => state.preferences.theme);

export const useAccessibilitySettings = () =>
  useUserPreferencesStore((state) => state.preferences.accessibility);

export const useNotificationSettings = () =>
  useUserPreferencesStore((state) => state.preferences.notifications);
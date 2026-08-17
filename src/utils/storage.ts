import { Category, UserPreferences } from '../types';

const STORAGE_KEY = 'khabar_al_lahza_user_prefs_v1';

export const DEFAULT_PREFERENCES: UserPreferences = {
  name: '',
  categories: ['politics', 'conflicts', 'economy', 'technology', 'sports', 'health', 'misc'],
  notificationFrequency: 'smart',
  digestTime: '08:00',
  onboardingCompleted: false,
  fontSize: 'md',
  savedArticleIds: [],
  themeMode: 'light',
  notificationsEnabled: false
};

export function loadUserPreferences(): UserPreferences {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(saved);
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch (e) {
    return DEFAULT_PREFERENCES;
  }
}

export function saveUserPreferences(prefs: Partial<UserPreferences>): UserPreferences {
  try {
    const current = loadUserPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return { ...DEFAULT_PREFERENCES, ...prefs };
  }
}

export function toggleSavedArticle(articleId: string): string[] {
  const current = loadUserPreferences();
  let updatedIds: string[];
  if (current.savedArticleIds.includes(articleId)) {
    updatedIds = current.savedArticleIds.filter(id => id !== articleId);
  } else {
    updatedIds = [...current.savedArticleIds, articleId];
  }
  saveUserPreferences({ savedArticleIds: updatedIds });
  return updatedIds;
}

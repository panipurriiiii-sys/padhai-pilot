import { create } from 'zustand';

export type MainTabKey = 'dashboard' | 'attendance' | 'results' | 'profile';

interface NavigationState {
  currentTab: MainTabKey;
  setTab: (tab: MainTabKey) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentTab: 'dashboard',
  setTab: (tab: MainTabKey) => set({ currentTab: tab }),
}));


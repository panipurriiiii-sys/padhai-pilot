import { useEffect } from 'react';
import { BackHandler } from 'react-native';

/**
 * Android back button inside a sub-view: returns to the menu instead of leaving the tab. Registered only while a
 * sub-view is open, so it sits above the root handler (which returns to the home tab).
 */
export function useBackToMenu(isSubView: boolean, toMenu: () => void): void {
  useEffect(() => {
    if (!isSubView) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      toMenu();
      return true;
    });
    return () => sub.remove();
  }, [isSubView, toMenu]);
}

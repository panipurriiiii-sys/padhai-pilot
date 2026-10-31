import { Alert, Linking } from 'react-native';

/** Opens document/attachment links, https only (never file:, intent: or javascript: URLs). */
export async function openUrl(url?: string | null): Promise<void> {
  if (!url || !/^https:\/\//i.test(url)) {
    Alert.alert('Unavailable', 'This file cannot be opened.');
    return;
  }
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Unable to open', 'No app on this device can open this file.');
  }
}

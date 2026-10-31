/**
 * Push-notification (FCM) scaffolding.
 *
 * Works once the owner supplies `android/app/google-services.json` (never committed; see .gitignore) and installs
 * `@react-native-firebase/app` + `@react-native-firebase/messaging`. Until then every call is a safe no-op so the
 * app never crashes because Firebase is absent.
 */
declare const require: ((moduleName: string) => any) | undefined;

export interface PushHandle {
  available: boolean;
  getToken: () => Promise<string | null>;
  onMessage: (handler: (link: string | null) => void) => () => void;
}

const unavailable: PushHandle = {
  available: false,
  getToken: async () => null,
  onMessage: () => () => {},
};

export function loadPush(): PushHandle {
  if (typeof require !== 'function') return unavailable;
  try {
    const mod = require('@react-native-firebase/messaging');
    const messaging = mod?.default ?? mod;
    if (typeof messaging !== 'function') return unavailable;
    return {
      available: true,
      getToken: async () => {
        try {
          await messaging().requestPermission();
          return (await messaging().getToken()) ?? null;
        } catch {
          return null;
        }
      },
      onMessage: (handler) => {
        const unsubForeground = messaging().onMessage((m: any) => handler(m?.data?.link ?? null));
        const unsubOpened = messaging().onNotificationOpenedApp((m: any) => handler(m?.data?.link ?? null));
        return () => {
          unsubForeground();
          unsubOpened();
        };
      },
    };
  } catch {
    return unavailable;
  }
}

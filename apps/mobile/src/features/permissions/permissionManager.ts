import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid, Platform } from 'react-native';
import notifee from '@notifee/react-native';

const PERMISSION_FLOW_COMPLETED_KEY = 'PADHAI_PERMISSION_FLOW_COMPLETED_V1';

export type PermissionKey = 'notifications' | 'camera' | 'storage';

export interface RolePermissionConfig {
  key: PermissionKey;
  title: string;
  subtitle: string;
  description: string;
  benefit: string;
  icon: 'bell' | 'camera' | 'file-text' | 'shield';
  mandatory: boolean;
}

export const TEACHER_PERMISSIONS: RolePermissionConfig[] = [
  {
    key: 'notifications',
    title: 'Instant Class & Doubt Alerts',
    subtitle: 'Stay on top of schedule and questions',
    description: 'Receive real-time push alerts when students submit homework doubts, when attendance needs recording, or when timetable changes occur.',
    benefit: 'Never miss student queries or upcoming batch timings.',
    icon: 'bell',
    mandatory: false,
  },
  {
    key: 'camera',
    title: 'Camera Access for Homework & Timetables',
    subtitle: 'Capture and share physical documents',
    description: 'Allows you to snap photos of physical whiteboard notes, question papers, handwritten attendance sheets, and timetable charts.',
    benefit: 'Upload lesson diagrams and handwritten solutions in 5 seconds.',
    icon: 'camera',
    mandatory: false,
  },
  {
    key: 'storage',
    title: 'Document & PDF Storage',
    subtitle: 'Save salary slips, assignments & reports',
    description: 'Enables downloading and caching student report cards, institute study materials, and your monthly salary slips to device storage.',
    benefit: 'Access official PDFs offline anytime without re-downloading.',
    icon: 'file-text',
    mandatory: false,
  },
];

export const STUDENT_PERMISSIONS: RolePermissionConfig[] = [
  {
    key: 'notifications',
    title: 'Lecture & Homework Reminders',
    subtitle: 'Never miss deadlines or live lectures',
    description: 'Get notified when new test results are published, homework is assigned, lecture notes are posted to your Vault, or fees are due.',
    benefit: 'Stay ahead of upcoming exam dates and submission cutoffs.',
    icon: 'bell',
    mandatory: false,
  },
  {
    key: 'camera',
    title: 'Camera for Homework Submission',
    subtitle: 'Photograph and upload handwritten assignments',
    description: 'Allows you to take clear pictures of your notebook solutions and student doubt sheets to submit directly to your teachers.',
    benefit: 'Submit homework directly from your desk in 2 clicks.',
    icon: 'camera',
    mandatory: false,
  },
  {
    key: 'storage',
    title: 'Offline Study Vault & Report Cards',
    subtitle: 'Keep your notes and test scores ready',
    description: 'Permits saving syllabus PDFs, chapter notes, teacher lecture recordings, and report cards to your phone storage.',
    benefit: 'Revise lecture notes and chapter sheets even when offline.',
    icon: 'file-text',
    mandatory: false,
  },
];

class PermissionManager {
  async hasCompletedOnboarding(userId: string): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(`${PERMISSION_FLOW_COMPLETED_KEY}_${userId}`);
      return val === 'true';
    } catch {
      return false;
    }
  }

  async markOnboardingCompleted(userId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(`${PERMISSION_FLOW_COMPLETED_KEY}_${userId}`, 'true');
    } catch {
      // Non-fatal
    }
  }

  async resetOnboarding(userId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${PERMISSION_FLOW_COMPLETED_KEY}_${userId}`);
    } catch {
      // Non-fatal
    }
  }

  async requestPermission(key: PermissionKey): Promise<boolean> {
    try {
      if (key === 'notifications') {
        const settings = await notifee.requestPermission();
        return settings.authorizationStatus >= 1;
      }

      if (Platform.OS === 'android') {
        if (key === 'camera') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: 'Camera Permission',
              message: 'PadhaiPilot needs camera access so you can photograph handwritten homework and lecture notes.',
              buttonPositive: 'Allow',
              buttonNegative: 'Not Now',
            },
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }

        if (key === 'storage') {
          if (Platform.Version >= 33) {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
              {
                title: 'Photo & Document Access',
                message: 'PadhaiPilot needs access to save and view study materials and report cards.',
                buttonPositive: 'Allow',
                buttonNegative: 'Not Now',
              },
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
          } else {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
              {
                title: 'Storage Access',
                message: 'PadhaiPilot needs storage access to save notes and PDF documents.',
                buttonPositive: 'Allow',
                buttonNegative: 'Not Now',
              },
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
          }
        }
      }

      return true;
    } catch {
      return false;
    }
  }
}

export const permissionManager = new PermissionManager();

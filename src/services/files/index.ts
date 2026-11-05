import { Platform } from 'react-native';

import { androidLibrarySource } from './androidLibrarySource';
import { e2eLibrarySource } from './e2eLibrarySource';
import { iosLibrarySource } from './iosLibrarySource';
import type { LibrarySource } from './LibrarySource';

export function isE2eBuild(): boolean {
  return process.env.EXPO_PUBLIC_E2E === '1';
}

export function getLibrarySource(): LibrarySource {
  if (isE2eBuild()) return e2eLibrarySource;
  return Platform.OS === 'ios' ? iosLibrarySource : androidLibrarySource;
}

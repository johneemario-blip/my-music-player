export interface Track {
  id: string;
  uri: string;
  name: string;
  durationMs: number | null;
}

export type AudioPlatform = 'ios' | 'android';

const commonExtensions = ['mp3', 'wav', 'm4a', 'aac', 'flac'] as const;
const androidOnlyExtensions = ['ogg'] as const;

function extensionOf(fileName: string): string | null {
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex <= 0 || dotIndex === fileName.length - 1) return null;
  return fileName.slice(dotIndex + 1).toLowerCase();
}

export function isSupportedAudioFile(fileName: string, platform: AudioPlatform): boolean {
  if (fileName.startsWith('.')) return false;
  const extension = extensionOf(fileName);
  if (extension === null) return false;
  if ((commonExtensions as readonly string[]).includes(extension)) return true;
  return platform === 'android' && (androidOnlyExtensions as readonly string[]).includes(extension);
}

export function trackNameFromFileName(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
}

const nameCollator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

export function sortTracks(tracks: readonly Track[]): Track[] {
  return [...tracks].sort((left, right) => nameCollator.compare(left.name, right.name));
}

export function formatDuration(durationMs: number | null | undefined): string {
  if (durationMs === null || durationMs === undefined || !Number.isFinite(durationMs)) {
    return '0:00';
  }
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

import appJson from '../app.json';

const { expo } = appJson;

type PluginEntry = string | [string, Record<string, unknown>];

function pluginOptions(name: string): Record<string, unknown> | undefined {
  const entry = (expo.plugins as PluginEntry[]).find((plugin) =>
    Array.isArray(plugin) ? plugin[0] === name : plugin === name,
  );
  return Array.isArray(entry) ? entry[1] : undefined;
}

describe('app identity (app.json)', () => {
  it('is called My Music Player with stable package identifiers', () => {
    expect(expo.name).toBe('My Music Player');
    expect(expo.ios.bundleIdentifier).toBe('com.mymusicplayer.app');
    expect(expo.android.package).toBe('com.mymusicplayer.app');
  });

  it('is portrait-only on phones and follows the system light/dark theme', () => {
    expect(expo.orientation).toBe('portrait');
    expect(expo.ios.supportsTablet).toBe(false);
    expect(expo.userInterfaceStyle).toBe('automatic');
  });

  it('has its own icon and a splash screen for both themes', () => {
    expect(expo.icon).toBe('./assets/icon.png');
    expect(pluginOptions('expo-splash-screen')).toMatchObject({
      image: './assets/splash-icon.png',
      dark: { backgroundColor: '#000000' },
    });
  });

  it('exposes the library folder in the iOS Files app', () => {
    expect(expo.ios.infoPlist).toMatchObject({
      UIFileSharingEnabled: true,
      LSSupportsOpeningDocumentsInPlace: true,
    });
  });

  it('never asks for the microphone and keeps background playback', () => {
    expect(pluginOptions('expo-audio')).toEqual({
      microphonePermission: false,
      recordAudioAndroid: false,
      enableBackgroundPlayback: true,
    });
  });

  it('keeps the minimum OS versions from the key decisions', () => {
    expect(pluginOptions('expo-build-properties')).toEqual({
      android: { minSdkVersion: 29 },
      ios: { deploymentTarget: '16.4' },
    });
  });
});

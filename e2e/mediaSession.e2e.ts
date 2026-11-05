import { by, device, element, expect, waitFor } from 'detox';

import { strings } from '../src/lib/strings';
import { testIds } from '../src/lib/testIds';

// Every loaded track activates the lock-screen media session (task 4.1); this walks the whole
// phase 3 flow with that session active to catch regressions it could cause.
describe('Media session regression', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  it('list → play → pause → next → stop works with the media session active', async () => {
    await element(by.id(testIds.chooseFolder)).tap();
    await waitFor(element(by.id(testIds.folderOption('Fixtures'))))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id(testIds.folderOption('Fixtures'))).tap();
    await waitFor(element(by.id(testIds.trackRow(0))))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.id(testIds.trackRow(0))).tap();
    await waitFor(element(by.id(testIds.playerPlayPause)))
      .toHaveLabel(strings.player.pause)
      .withTimeout(3000);
    await expect(element(by.id(testIds.playerTitle))).toHaveText('alpha-tone');

    await element(by.id(testIds.playerPlayPause)).tap();
    await expect(element(by.id(testIds.playerPlayPause))).toHaveLabel(strings.player.play);

    await element(by.id(testIds.playerNext)).tap();
    await expect(element(by.id(testIds.playerTitle))).toHaveText('beta-tone');
    await waitFor(element(by.id(testIds.playerPlayPause)))
      .toHaveLabel(strings.player.pause)
      .withTimeout(3000);

    await element(by.id(testIds.playerStop)).tap();
    await waitFor(element(by.id(testIds.playerPosition)))
      .toHaveText('0:00')
      .withTimeout(3000);
    await expect(element(by.id(testIds.playerPlayPause))).toHaveLabel(strings.player.play);
    await expect(element(by.id(testIds.playerTitle))).toHaveText('beta-tone');
  });
});

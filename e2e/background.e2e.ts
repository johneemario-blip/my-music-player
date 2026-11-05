import { expect as jestExpect } from '@jest/globals';
import { by, device, element, expect, waitFor } from 'detox';

import { strings } from '../src/lib/strings';
import { testIds } from '../src/lib/testIds';

const backgroundMs = 3000;

function toSeconds(mmss: string): number {
  const [minutes = '0', seconds = '0'] = mmss.split(':');
  return Number(minutes) * 60 + Number(seconds);
}

async function positionSeconds(): Promise<number> {
  const attributes = await element(by.id(testIds.playerPosition)).getAttributes();
  return toSeconds('text' in attributes ? (attributes.text ?? '0:00') : '0:00');
}

// Waiting is the scenario here: the app sits in the background, so there is no UI to wait on.
function stayInBackground(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Background playback', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
    await element(by.id(testIds.chooseFolder)).tap();
    await waitFor(element(by.id(testIds.folderOption('Long'))))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id(testIds.folderOption('Long'))).tap();
    await waitFor(element(by.id(testIds.trackRow(0))))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('keeps playing while the app is in the background', async () => {
    await element(by.id(testIds.trackRow(0))).tap();
    await waitFor(element(by.id(testIds.playerPosition)))
      .toHaveText('0:01')
      .withTimeout(5000);
    const before = await positionSeconds();

    await device.sendToHome();
    await stayInBackground(backgroundMs);
    await device.launchApp({ newInstance: false });

    await expect(element(by.id(testIds.playerPlayPause))).toHaveLabel(strings.player.pause);
    const after = await positionSeconds();
    jestExpect(after - before).toBeGreaterThanOrEqual(backgroundMs / 1000);
    await expect(element(by.id(testIds.playerTitle))).toHaveText('long-tone');
  });
});

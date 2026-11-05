import { expect as jestExpect } from '@jest/globals';
import { by, device, element, expect, waitFor } from 'detox';

import { strings } from '../src/lib/strings';
import { testIds } from '../src/lib/testIds';

// Fixture queue, sorted: alpha-tone (3.5 s), beta-tone (2 s), gamma-tone (3.5 s).
const playPause = () => element(by.id(testIds.playerPlayPause));
const title = () => element(by.id(testIds.playerTitle));
const position = () => element(by.id(testIds.playerPosition));

async function textOf(id: string): Promise<string> {
  const attributes = await element(by.id(id)).getAttributes();
  return 'text' in attributes ? (attributes.text ?? '') : '';
}

/** Asserts that the element keeps its text for the given time (e.g. position while paused). */
async function expectTextToStay(id: string, text: string, forMs: number) {
  const changed = await waitFor(element(by.id(id)))
    .not.toHaveText(text)
    .withTimeout(forMs)
    .then(
      () => true,
      () => false,
    );
  if (changed) throw new Error(`${id} changed from ${text} to ${await textOf(id)}`);
}

/**
 * Touches the slider like a user would. `adjustSliderToPosition` sets the value programmatically
 * and on Android skips the sliding start/complete events the app seeks on. Android reports the
 * frame in px but takes tap points in dp, so it gets a short gesture with a normalized start.
 */
async function touchSliderAt(fraction: number) {
  const slider = element(by.id(testIds.playerSlider));
  if (device.getPlatform() === 'android') {
    await slider.swipe('right', 'slow', 0.02, fraction, 0.5);
    return;
  }
  const attributes = await slider.getAttributes();
  const frame = 'frame' in attributes ? attributes.frame : { width: 300, height: 40 };
  await slider.tap({ x: Math.round(frame.width * fraction), y: Math.round(frame.height / 2) });
}

async function openFixtures() {
  await device.launchApp({ newInstance: true, delete: true });
  await element(by.id(testIds.chooseFolder)).tap();
  await waitFor(element(by.id(testIds.folderOption('Fixtures'))))
    .toBeVisible()
    .withTimeout(5000);
  await element(by.id(testIds.folderOption('Fixtures'))).tap();
  await waitFor(element(by.id(testIds.trackRow(2))))
    .toBeVisible()
    .withTimeout(10000);
}

describe('Player', () => {
  beforeEach(async () => {
    await openFixtures();
  });

  it('plays the tapped track and shows Pause while playing', async () => {
    await element(by.id(testIds.trackRow(0))).tap();

    await expect(title()).toHaveText('alpha-tone');
    await waitFor(playPause()).toHaveLabel(strings.player.pause).withTimeout(3000);
    await waitFor(position()).toHaveText('0:01').withTimeout(4000);
  });

  it('pause keeps the position, stop rewinds to 0:00', async () => {
    await element(by.id(testIds.trackRow(0))).tap();
    await waitFor(position()).toHaveText('0:01').withTimeout(4000);

    await playPause().tap();
    await expect(playPause()).toHaveLabel(strings.player.play);
    const pausedAt = await textOf(testIds.playerPosition);
    jestExpect(pausedAt).not.toBe('0:00');
    await expectTextToStay(testIds.playerPosition, pausedAt, 2000);

    await element(by.id(testIds.playerStop)).tap();
    await waitFor(position()).toHaveText('0:00').withTimeout(3000);
    await expect(playPause()).toHaveLabel(strings.player.play);

    await playPause().tap();
    await waitFor(playPause()).toHaveLabel(strings.player.pause).withTimeout(3000);
    await expect(title()).toHaveText('alpha-tone');
  });

  it('seeks with the slider', async () => {
    await element(by.id(testIds.trackRow(0))).tap();
    await waitFor(playPause()).toHaveLabel(strings.player.pause).withTimeout(3000);
    await playPause().tap();

    await touchSliderAt(0.75);

    await waitFor(position()).toHaveText('0:02').withTimeout(3000);
    await expect(position()).toHaveText('0:02');
  });

  it('next and previous switch tracks', async () => {
    await element(by.id(testIds.trackRow(0))).tap();
    await waitFor(playPause()).toHaveLabel(strings.player.pause).withTimeout(3000);

    await element(by.id(testIds.playerNext)).tap();
    await expect(title()).toHaveText('beta-tone');

    await element(by.id(testIds.playerPrevious)).tap();
    await expect(title()).toHaveText('alpha-tone');
  });

  it('continues with the next track and stops after the last one', async () => {
    await element(by.id(testIds.trackRow(1))).tap();
    await expect(title()).toHaveText('beta-tone');

    await waitFor(title()).toHaveText('gamma-tone').withTimeout(8000);
    await waitFor(playPause()).toHaveLabel(strings.player.play).withTimeout(10000);

    await expect(title()).toHaveText('gamma-tone');
    await expect(position()).toHaveText('0:00');
  });
});

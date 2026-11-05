import { by, device, element, expect, waitFor } from 'detox';

import { testIds } from '../src/lib/testIds';

// e2e builds (EXPO_PUBLIC_E2E=1) expose bundled fixtures as in-app folders 'Fixtures' and 'Empty'.
async function chooseFolder(label: string) {
  await element(by.id(testIds.chooseFolder)).tap();
  await waitFor(element(by.id(testIds.folderOption(label))))
    .toBeVisible()
    .withTimeout(5000);
  await element(by.id(testIds.folderOption(label))).tap();
}

async function expectFixtureList() {
  await waitFor(element(by.id(testIds.trackRow(0))))
    .toBeVisible()
    .withTimeout(10000);
  await waitFor(element(by.label('alpha-tone, 0:03')))
    .toBeVisible()
    .withTimeout(15000);
  await expect(element(by.id(testIds.trackRow(0)))).toHaveLabel('alpha-tone, 0:03');
  await waitFor(element(by.id(testIds.trackRow(1))))
    .toHaveLabel('beta-tone, 0:02')
    .withTimeout(15000);
  await waitFor(element(by.id(testIds.trackRow(2))))
    .toHaveLabel('gamma-tone, 0:03')
    .withTimeout(15000);
}

describe('Library', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  it('starts with no folder selected', async () => {
    await expect(element(by.id(testIds.libraryStatus))).toBeVisible();
    await expect(element(by.id(testIds.chooseFolder))).toBeVisible();
  });

  it('shows the empty state for a folder without audio files', async () => {
    await chooseFolder('Empty');

    await waitFor(element(by.id(testIds.libraryStatus)))
      .toBeVisible()
      .withTimeout(5000);
    await expect(element(by.id(testIds.trackRow(0)))).not.toExist();
  });

  it('lists the folder tracks sorted by name with m:ss durations', async () => {
    await chooseFolder('Fixtures');

    await expectFixtureList();
    await expect(element(by.id(testIds.trackList))).toBeVisible();
  });

  it('restores the list after restarting the app without choosing again', async () => {
    await device.launchApp({ newInstance: true });

    await expectFixtureList();
    await expect(element(by.id(testIds.folderPicker))).not.toExist();
  });
});

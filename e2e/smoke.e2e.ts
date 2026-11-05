import { by, device, element, expect } from 'detox';

import { testIds } from '../src/lib/testIds';

describe('App start', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  it('shows the main screen', async () => {
    await expect(element(by.id(testIds.libraryScreen))).toBeVisible();
  });
});

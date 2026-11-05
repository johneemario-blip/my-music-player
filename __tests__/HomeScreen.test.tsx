import { render, screen } from '@testing-library/react-native';

import HomeScreen from '../app/index';
import { strings } from '@/lib/strings';
import { testIds } from '@/lib/testIds';

describe('HomeScreen', () => {
  it('renders the main screen with the empty-library message', async () => {
    await render(<HomeScreen />);

    expect(screen.getByTestId(testIds.libraryScreen)).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: strings.library.emptyTitle })).toBeOnTheScreen();
  });
});

import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';

import { strings } from '@/lib/strings';
import { testIds } from '@/lib/testIds';
import type { Track } from '@/lib/track';

import { PlayerBar } from './PlayerBar';
import { initialPlayerState, type PlayerState } from './playerReducer';
import type { Player } from './usePlayer';

const song: Track = { id: 'a', uri: 'file:///a.mp3', name: 'Alpha Song', durationMs: 185000 };

function player(state: Partial<PlayerState>, currentTrack: Track | null = song): Player {
  return {
    state: {
      ...initialPlayerState,
      queue: [song],
      currentIndex: currentTrack ? 0 : null,
      ...state,
    },
    currentTrack,
    playTrack: jest.fn(),
    togglePlay: jest.fn(),
    stop: jest.fn(),
    next: jest.fn(),
    previous: jest.fn(),
    seek: jest.fn(),
  };
}

const transportLabels = [
  strings.player.previous,
  strings.player.play,
  strings.player.stop,
  strings.player.next,
];

describe('PlayerBar', () => {
  it('disables all controls when nothing is loaded', async () => {
    await render(<PlayerBar player={player({}, null)} />);

    expect(screen.getByText(strings.player.nothingPlaying)).toBeOnTheScreen();
    transportLabels.forEach((label) =>
      expect(screen.getByRole('button', { name: label })).toBeDisabled(),
    );
    expect(screen.getByTestId(testIds.playerSlider)).toBeDisabled();
  });

  it('shows Pause while playing and Play while paused', async () => {
    const { rerender } = await render(
      <PlayerBar player={player({ playback: 'playing', durationMs: 185000 })} />,
    );
    expect(screen.getByRole('button', { name: strings.player.pause })).toBeEnabled();
    expect(screen.queryByRole('button', { name: strings.player.play })).toBeNull();

    await rerender(<PlayerBar player={player({ playback: 'paused', durationMs: 185000 })} />);

    expect(screen.getByRole('button', { name: strings.player.play })).toBeEnabled();
  });

  it('shows the title, elapsed and total time and puts the slider at the position', async () => {
    await render(
      <PlayerBar player={player({ playback: 'playing', positionMs: 65000, durationMs: 185000 })} />,
    );

    expect(screen.getByTestId(testIds.playerTitle)).toHaveTextContent('Alpha Song');
    expect(screen.getByTestId(testIds.playerPosition)).toHaveTextContent('1:05');
    expect(screen.getByTestId(testIds.playerDuration)).toHaveTextContent('3:05');
    expect(screen.getByTestId(testIds.playerSlider)).toHaveProp('value', 65000);
    expect(screen.getByTestId(testIds.playerSlider)).toHaveProp('maximumValue', 185000);
  });

  it('seeks to the position where the user released the slider', async () => {
    const current = player({ playback: 'playing', positionMs: 1000, durationMs: 185000 });
    await render(<PlayerBar player={current} />);
    const slider = screen.getByTestId(testIds.playerSlider);

    await fireEvent(slider, 'slidingStart', 1000);
    await fireEvent(slider, 'valueChange', 120000);
    expect(screen.getByTestId(testIds.playerPosition)).toHaveTextContent('2:00');
    await fireEvent(slider, 'slidingComplete', 120000);

    expect(current.seek).toHaveBeenCalledWith(120000);
  });

  it('ignores slider value changes that are not a drag', async () => {
    const current = player({ playback: 'playing', positionMs: 1000, durationMs: 185000 });
    await render(<PlayerBar player={current} />);

    await fireEvent(screen.getByTestId(testIds.playerSlider), 'valueChange', 90000);

    expect(screen.getByTestId(testIds.playerPosition)).toHaveTextContent('0:01');
  });

  it('wires the transport buttons to the player', async () => {
    const current = player({ playback: 'playing', durationMs: 185000 });
    await render(<PlayerBar player={current} />);
    const user = userEvent.setup();

    await user.press(screen.getByRole('button', { name: strings.player.pause }));
    await user.press(screen.getByRole('button', { name: strings.player.stop }));
    await user.press(screen.getByRole('button', { name: strings.player.next }));
    await user.press(screen.getByRole('button', { name: strings.player.previous }));

    expect(current.togglePlay).toHaveBeenCalledTimes(1);
    expect(current.stop).toHaveBeenCalledTimes(1);
    expect(current.next).toHaveBeenCalledTimes(1);
    expect(current.previous).toHaveBeenCalledTimes(1);
  });

  it('tells the user when a file could not be played', async () => {
    await render(<PlayerBar player={player({ playback: 'playing', failedTrackName: 'Broken' })} />);

    expect(screen.getByRole('alert')).toHaveTextContent(strings.player.cannotPlay('Broken'));
  });
});

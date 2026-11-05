/** Decides which queue position comes next; swap it to add repeat or shuffle later. */
export interface QueueStrategy {
  next(currentIndex: number, queueLength: number): number | null;
  previous(currentIndex: number, queueLength: number): number | null;
}

export const sequentialQueue: QueueStrategy = {
  next: (currentIndex, queueLength) => (currentIndex + 1 < queueLength ? currentIndex + 1 : null),
  previous: (currentIndex) => (currentIndex > 0 ? currentIndex - 1 : null),
};

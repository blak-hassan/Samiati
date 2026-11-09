import { describe, expect, it } from 'vitest';
import { nextUnreviewedSubmission } from '../src/lib/changa';

describe('reactive review queue advancement', () => {
  const submissions = [{ _id: 'A' }, { _id: 'B' }, { _id: 'C' }];

  it.each(['before', 'after'] as const)(
    'reviews every item when the server removes a vote %s local advancement',
    (timing) => {
      const reviewed = new Set<string>();
      let queue = [...submissions];
      for (const expected of ['A', 'B', 'C']) {
        const current = nextUnreviewedSubmission(queue, reviewed);
        expect(current?._id).toBe(expected);
        if (timing === 'before') queue = queue.filter((item) => item._id !== expected);
        reviewed.add(current!._id);
        // A delayed reactive update must not expose the just-reviewed item again.
        if (timing === 'after') {
          expect(nextUnreviewedSubmission(queue, reviewed)?._id).not.toBe(expected);
          queue = queue.filter((item) => item._id !== expected);
        }
      }
      expect(nextUnreviewedSubmission(queue, reviewed)).toBeUndefined();
    }
  );

  it('shows a new submission after the previous queue was cleared', () => {
    const reviewed = new Set(['A', 'B', 'C']);
    expect(nextUnreviewedSubmission(submissions, reviewed)).toBeUndefined();
    expect(nextUnreviewedSubmission([...submissions, { _id: 'D' }], reviewed)?._id).toBe('D');
  });

  it('waits for the queue without treating loading as a completed item', () => {
    expect(nextUnreviewedSubmission(undefined, new Set())).toBeUndefined();
    expect(nextUnreviewedSubmission(submissions, new Set())?._id).toBe('A');
  });
});

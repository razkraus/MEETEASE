import test from 'node:test';
import assert from 'node:assert';
import { suggestMeetingTimes } from './scheduler.js';

test('suggestMeetingTimes finds free slots', () => {
  const calendars = [
    [{ start: new Date('2024-06-10T10:00:00Z'), end: new Date('2024-06-10T11:00:00Z') }],
    [{ start: new Date('2024-06-10T12:00:00Z'), end: new Date('2024-06-10T13:00:00Z') }]
  ];
  const suggestions = suggestMeetingTimes(calendars, 60, 1, new Date('2024-06-10T09:00:00Z'));
  assert.ok(suggestions.length > 0);
});

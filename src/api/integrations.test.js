import test from 'node:test';
import assert from 'node:assert/strict';
import { AddToGoogleCalendar, AddToOutlookCalendar } from './integrations.js';

test('AddToGoogleCalendar returns Google URL', () => {
  const url = AddToGoogleCalendar({
    title: 'Test',
    start: '2025-01-01T00:00:00Z',
    end: '2025-01-01T01:00:00Z',
  });
  assert.ok(url.includes('calendar.google.com'));
});

test('AddToOutlookCalendar returns Outlook URL', () => {
  const url = AddToOutlookCalendar({
    title: 'Test',
    start: '2025-01-01T00:00:00Z',
    end: '2025-01-01T01:00:00Z',
  });
  assert.ok(url.includes('outlook.live.com'));
});

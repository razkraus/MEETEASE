import { addDays, startOfDay, setHours, setMinutes } from 'date-fns';

export function suggestMeetingTimes(calendars = [], duration = 60, days = 7, start = new Date()) {
  const suggestions = [];
  for (let d = 0; d < days; d++) {
    const dayStart = startOfDay(addDays(start, d));
    for (let h = 9; h <= 17; h++) {
      const slotStart = setMinutes(setHours(dayStart, h), 0);
      const slotEnd = new Date(slotStart.getTime() + duration * 60000);
      const conflict = calendars.some(cal =>
        cal.some(event => !(slotEnd <= event.start || slotStart >= event.end))
      );
      if (!conflict) {
        suggestions.push({ start: slotStart, end: slotEnd, datetime: slotStart.toISOString() });
        if (suggestions.length >= 3) return suggestions;
      }
    }
  }
  return suggestions;
}

import { Button } from '@/components/ui/button';
import { AddToGoogleCalendar, AddToOutlookCalendar } from '@/api/integrations';

export default function CalendarButtons({ event }) {
  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => AddToGoogleCalendar(event)}>
        Add to Google Calendar
      </Button>
      <Button variant="outline" onClick={() => AddToOutlookCalendar(event)}>
        Add to Outlook
      </Button>
    </div>
  );
}

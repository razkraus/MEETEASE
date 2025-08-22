import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, MapPin, Users, Clock, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay, parseISO, addMonths, subMonths } from "date-fns";
import { he } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import DailyScheduleView from "./DailyScheduleView";

const statusLabels = {
  draft: { label: "טיוטה", color: "bg-slate-100 text-slate-700" },
  sent: { label: "נשלח", color: "bg-orange-100 text-orange-700" },
  confirmed: { label: "מאושר", color: "bg-green-100 text-green-700" },
  cancelled: { label: "בוטל", color: "bg-red-100 text-red-700" }
};

export default function MeetingsCalendar({ meetings, isLoading }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDate, setCalendarDate] = useState(new Date());

  const confirmedMeetings = useMemo(() => 
    meetings.filter(m => m.status === 'confirmed' && m.final_date),
    [meetings]
  );

  const meetingDays = useMemo(() => 
    confirmedMeetings.map(m => parseISO(m.final_date)),
    [confirmedMeetings]
  );
  
  const meetingsForSelectedDay = useMemo(() => 
    confirmedMeetings.filter(m => isSameDay(parseISO(m.final_date), selectedDate)),
    [confirmedMeetings, selectedDate]
  );

  const handleDateSelect = (date) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleMonthChange = (direction) => {
    if (direction === 'next') {
      setCalendarDate(addMonths(calendarDate, 1));
    } else {
      setCalendarDate(subMonths(calendarDate, 1));
    }
  };

  return (
    <Card className="meetiz-card">
      <CardHeader>
        <CardTitle className="text-xl font-bold">לוח שנה ופגישות קרובות</CardTitle>
      </CardHeader>
      <CardContent className="grid lg:grid-cols-2 gap-6">
        {/* לוח שנה חודשי */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-800">
              {format(calendarDate, 'MMMM yyyy', { locale: he })}
            </h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleMonthChange('prev')}
                className="h-8 w-8"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleMonthChange('next')}
                className="h-8 w-8"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            month={calendarDate}
            onMonthChange={setCalendarDate}
            className="rounded-md border bg-white"
            locale={he}
            modifiers={{ meetings: meetingDays }}
            modifiersStyles={{ 
              meetings: { 
                color: 'white', 
                backgroundColor: '#2563eb',
                fontWeight: 'bold'
              } 
            }}
          />

          <div className="text-xs text-slate-500 text-center">
            ימים עם ישיבות מסומנים בכחול
          </div>
        </div>

        {/* תצוגת יומן יומי */}
        <DailyScheduleView 
          meetings={confirmedMeetings} 
          selectedDate={selectedDate} 
        />
      </CardContent>
    </Card>
  );
}
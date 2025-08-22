import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Users, Calendar as CalendarIcon } from "lucide-react";
import { format, parseISO, isSameDay } from "date-fns";
import { he } from "date-fns/locale";

export default function DailyScheduleView({ meetings, selectedDate }) {
  // סינון הישיבות לתאריך הנבחר
  const dayMeetings = meetings.filter(meeting => {
    if (!meeting.final_date) return false;
    return isSameDay(parseISO(meeting.final_date), selectedDate);
  }).sort((a, b) => new Date(a.final_date) - new Date(b.final_date));

  const timeSlots = [];
  for (let hour = 8; hour <= 18; hour++) {
    timeSlots.push({
      hour,
      time: `${hour.toString().padStart(2, '0')}:00`,
      meetings: dayMeetings.filter(meeting => {
        const meetingHour = new Date(meeting.final_date).getHours();
        return meetingHour === hour;
      })
    });
  }

  return (
    <Card className="meetiz-card h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="w-4 h-4 text-blue-600" />
          לוח זמנים יומי
        </CardTitle>
        <p className="text-xs text-slate-600">
          {format(selectedDate, "EEEE, d MMMM yyyy", { locale: he })}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-80 overflow-y-auto">
          {timeSlots.map((slot) => (
            <div key={slot.hour} className="border-b border-slate-100 last:border-b-0">
              <div className="flex">
                {/* עמודת השעות */}
                <div className="w-12 py-1.5 px-1 text-center bg-slate-50 border-l border-slate-200 flex items-center justify-center">
                  <span className="text-xs font-medium text-slate-600">
                    {slot.time}
                  </span>
                </div>

                {/* תוכן השעה */}
                <div className="flex-1 min-h-[44px] p-1.5 flex items-center">
                  {slot.meetings.length > 0 ? (
                    <div className="space-y-1 w-full">
                      {slot.meetings.map((meeting) => (
                        <div
                          key={meeting.id}
                          className="bg-gradient-to-l from-blue-50 to-blue-100 border border-blue-200 rounded-md p-1.5 shadow-sm"
                        >
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-semibold text-slate-900 text-xs truncate leading-tight">
                              {meeting.title}
                            </h4>
                            <Badge className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 ml-1">
                              {format(parseISO(meeting.final_date), "HH:mm")}
                            </Badge>
                          </div>

                          <div className="space-y-0.5 text-xs text-slate-600">
                            {meeting.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5" />
                                <span className="truncate text-xs">{meeting.location}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <Users className="w-2.5 h-2.5" />
                                <span className="text-xs">{meeting.participants?.length || 0} משתתפים</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                <span className="text-xs">{meeting.duration_minutes} דק'</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full w-full text-slate-400">
                      <span className="text-xs">פנוי</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {dayMeetings.length === 0 && (
          <div className="text-center py-6 text-slate-500">
            <CalendarIcon className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs">אין ישיבות מתוכננות ליום זה</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
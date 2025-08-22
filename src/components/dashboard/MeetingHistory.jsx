import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock, History, ChevronDown, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const statusLabels = {
  confirmed: { label: "הושלמה", color: "bg-green-100 text-green-700" },
  cancelled: { label: "בוטלה", color: "bg-red-100 text-red-700" }
};

export default function MeetingHistory({ pastMeetings, isLoading }) {
  const [isOpen, setIsOpen] = useState(false);

  const sortedPastMeetings = pastMeetings.sort((a, b) => {
    const dateA = a.final_date ? new Date(a.final_date) : new Date(a.created_date);
    const dateB = b.final_date ? new Date(b.final_date) : new Date(b.created_date);
    return dateB - dateA; // הכי חדשות ראשונות
  });

  if (isLoading) {
    return (
      <Card className="meetiz-card animate-pulse">
        <CardHeader>
          <div className="h-8 bg-slate-200 rounded w-3/4"></div>
        </CardHeader>
      </Card>
    );
  }

  if (pastMeetings.length === 0) {
    return null; // Don't show history if there are no past meetings
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="meetiz-card">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <History className="w-5 h-5 text-purple-600" />
                היסטוריית ישיבות ({pastMeetings.length})
              </CardTitle>
              <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {!isOpen && (
              <p className="text-sm text-slate-500 pt-2 text-right">
                הצג את כל הישיבות שהושלמו או בוטלו
              </p>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-4">
            {sortedPastMeetings.map((meeting) => (
              <div key={meeting.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-slate-900">{meeting.title}</h4>
                      <Badge className={statusLabels[meeting.status]?.color || "bg-slate-100 text-slate-700"}>
                        {statusLabels[meeting.status]?.label || meeting.status}
                      </Badge>
                    </div>
                    
                    {meeting.description && (
                      <p className="text-sm text-slate-600 mb-2">{meeting.description}</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600">
                      {meeting.final_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(meeting.final_date), "d MMMM yyyy 'בשעה' HH:mm", { locale: he })}</span>
                        </div>
                      )}
                      {meeting.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{meeting.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{meeting.duration_minutes} דקות</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{meeting.participants?.length || 0} משתתפים</span>
                      </div>
                    </div>
                  </div>
                  
                  <Link to={`${createPageUrl("MeetingDetails")}?id=${meeting.id}`}>
                    <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
                
                {meeting.status === 'confirmed' && meeting.final_date && (
                  <div className="mt-3 text-xs text-slate-500 bg-slate-50 rounded p-2">
                    ✅ הישיבה בוצעה בהצלחה ב-{format(new Date(meeting.final_date), "d MMMM yyyy", { locale: he })}
                  </div>
                )}
                
                {meeting.status === 'cancelled' && (
                  <div className="mt-3 text-xs text-red-600 bg-red-50 rounded p-2">
                    ❌ הישיבה בוטלה
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
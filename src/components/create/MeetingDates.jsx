
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, X, Calendar as CalendarIcon, Wand2, Loader2, Zap } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Card, CardContent } from '@/components/ui/card';
import WeeklyCalendarView from './WeeklyCalendarView';

export default function MeetingDates({ data, onChange }) {
  const [isFinding, setIsFinding] = useState(false);
  const [suggestedTimes, setSuggestedTimes] = useState([]);
  
  const handleDateTimeSelect = (datetime) => {
    const datetimeISO = datetime.toISOString();
    const isAlreadySelected = data.proposed_dates.some(d => d.datetime === datetimeISO);

    let newProposedDates;
    if (isAlreadySelected) {
      newProposedDates = data.proposed_dates.filter(d => d.datetime !== datetimeISO);
    } else {
      if (data.proposed_dates.length >= 10) { // Increased limit for weekly view
        // Optional: Add a toast notification here
        console.warn("You can select up to 10 proposed dates.");
        return;
      }
      const dateLabel = format(datetime, "EEEE, d MMMM yyyy 'בשעה' HH:mm", { locale: he });
      const newProposedDate = { datetime: datetimeISO, date_label: dateLabel };
      newProposedDates = [...data.proposed_dates, newProposedDate];
    }
    
    onChange({
      ...data,
      proposed_dates: newProposedDates.sort((a,b) => new Date(a.datetime) - new Date(b.datetime))
    });
  };

  const removeDate = (datetimeToRemove) => {
    onChange({
      ...data,
      proposed_dates: data.proposed_dates.filter((d) => d.datetime !== datetimeToRemove)
    });
  };
  
  const handleSuggestionClick = (suggestion) => {
    handleDateTimeSelect(new Date(suggestion.datetime));
  };
  
  const findBestTimes = () => {
    setIsFinding(true);
    setSuggestedTimes([]);
    setTimeout(() => {
      const today = new Date();
      const mockSuggestions = [
        { hours: 10, minutes: 0, days: 1 },
        { hours: 14, minutes: 30, days: 1 },
        { hours: 9, minutes: 0, days: 2 },
        { hours: 16, minutes: 0, days: 3 },
      ].map(s => {
        const dt = new Date(today.getFullYear(), today.getMonth(), today.getDate() + s.days, s.hours, s.minutes);
        return {
          datetime: dt.toISOString(),
          date_label: format(dt, "EEEE, d MMMM yyyy 'בשעה' HH:mm", { locale: he })
        }
      });
      setSuggestedTimes(mockSuggestions);
      setIsFinding(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">בחירת מועדים לישיבה</h2>
        <p className="text-slate-600">בחר את המועדים המתאימים מהלוח השבועי או השתמש בהצעות החכמות.</p>
      </div>
      
      {/* AI Suggestion Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-blue-600"/>
              <h3 className="font-bold text-blue-900">מצא את הזמן המושלם</h3>
            </div>
            <p className="text-sm text-blue-800 mt-1">
              חסוך זמן! המערכת תסרוק את יומני המשתתפים ותציע את המועדים הטובים ביותר.
            </p>
          </div>
          <Button onClick={findBestTimes} disabled={isFinding} className="bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg shadow-sm w-full sm:w-auto">
            {isFinding ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                מחפש זמנים...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 ml-2" />
                הצע לי זמנים
              </>
            )}
          </Button>
        </CardContent>
        {suggestedTimes.length > 0 && (
          <div className="p-4 border-t border-blue-200">
             <h4 className="font-semibold text-slate-800 mb-2 text-sm">מועדים מומלצים:</h4>
             <div className="flex flex-wrap gap-2">
               {suggestedTimes.map(s => (
                <Button 
                  key={s.datetime} 
                  variant={data.proposed_dates.some(d => d.datetime === s.datetime) ? "default" : "outline"} 
                  size="sm"
                  onClick={() => handleSuggestionClick(s)}
                  className={`transition-all rounded-full ${data.proposed_dates.some(d => d.datetime === s.datetime) ? 'bg-blue-600 text-white' : 'bg-white'}`}
                  >
                  {format(new Date(s.datetime), "d/M HH:mm")}
                </Button>
               ))}
             </div>
          </div>
        )}
      </Card>
      
      {/* Weekly Calendar */}
      <div>
        <Label className="text-base font-semibold">הוסף מועדים מהלוח</Label>
        <WeeklyCalendarView 
            selectedDates={data.proposed_dates}
            onDateTimeSelect={handleDateTimeSelect}
            duration={data.duration_minutes}
        />
      </div>

      {/* Selected Dates List */}
      <div className="pt-4 space-y-3">
        <h3 className="font-semibold text-slate-800">מועדים שנבחרו ({data.proposed_dates.length}/10)</h3>
        {data.proposed_dates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.proposed_dates.map((date) => (
              <div key={date.datetime} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-blue-600" />
                  <p className="font-medium text-slate-900 text-sm">{date.date_label}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeDate(date.datetime)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl">
            טרם נבחרו מועדים.
          </div>
        )}
      </div>
    </div>
  );
}

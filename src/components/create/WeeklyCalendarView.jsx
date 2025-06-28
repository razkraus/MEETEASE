import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { format, addDays, startOfWeek, addWeeks, subWeeks, setHours, setMinutes, isToday, isBefore, isEqual, startOfDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Check } from 'lucide-react';

export default function WeeklyCalendarView({ selectedDates, onDateTimeSelect, duration = 60 }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekDays = useMemo(() => {
    // Week starts on Sunday (0) for Hebrew locale
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [currentDate]);

  const timeSlots = useMemo(() => {
    if (!duration || duration <= 0) return [];
    const slots = [];
    let time = setMinutes(setHours(new Date(), 8), 0);
    const endTime = setMinutes(setHours(new Date(), 22), 0);

    while (time < endTime) {
      slots.push(format(time, 'HH:mm'));
      const newTime = new Date(time.getTime() + duration * 60000);
      if (newTime <= time) break; // prevent infinite loop
      time = newTime;
    }
    return slots;
  }, [duration]);

  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  
  const handleSlotClick = (day, time) => {
    const [hours, minutes] = time.split(':');
    let newDate = setHours(startOfDay(day), parseInt(hours));
    newDate = setMinutes(newDate, parseInt(minutes));
    onDateTimeSelect(newDate);
  };
  
  const isSelected = (day, time) => {
    const [hours, minutes] = time.split(':');
    let checkDate = setHours(startOfDay(day), parseInt(hours));
    checkDate = setMinutes(checkDate, parseInt(minutes));
    return selectedDates.some(d => isEqual(new Date(d.datetime), checkDate));
  };
  
  return (
    <div className="border border-slate-200 rounded-xl bg-white p-2 sm:p-4" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={handlePrevWeek}>
          <ChevronRight className="w-5 h-5" />
        </Button>
        <div className="text-base md:text-lg font-bold text-slate-800 text-center" suppressHydrationWarning>
          {currentDate && `${format(weekDays[0], 'd MMM', { locale: he })} - ${format(weekDays[6], 'd MMM yyyy', { locale: he })}`}
        </div>
        <Button variant="ghost" size="icon" onClick={handleNextWeek}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(7, minmax(80px, 1fr)) 4rem', minWidth: '650px' }}>
          
          {/* Day Headers */}
          {weekDays.map((day) => (
            <div key={`header-${day.toISOString()}`} className="text-center p-2 border-b border-slate-200 sticky top-0 bg-white z-10">
              <div className={`text-sm font-semibold ${isToday(day) ? 'text-blue-600' : 'text-slate-700'}`}>{format(day, 'E', { locale: he })}</div>
              <div className={`text-xl font-bold ${isToday(day) ? 'text-blue-600' : 'text-slate-800'}`}>{format(day, 'd')}</div>
            </div>
          ))}
          {/* Top-right empty corner */}
          <div className="sticky right-0 top-0 bg-white z-10 border-b border-slate-200"></div>

          {/* Render all cells as a flat list for the grid */}
          {timeSlots.flatMap((time) => 
            [
              ...weekDays.map((day) => {
                const slotDateTime = setMinutes(setHours(day, parseInt(time.split(':')[0])), parseInt(time.split(':')[1]));
                const disabled = isBefore(slotDateTime, new Date());
                const selected = isSelected(day, time);
                return (
                  <div key={`${day.toISOString()}-${time}`} className="border-t border-slate-100 flex items-center justify-center p-1 min-h-[4rem]">
                    <Button
                      variant={selected ? 'default' : 'ghost'}
                      size="icon"
                      className={`w-10 h-10 rounded-lg transition-all duration-200 ${selected ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'} ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
                      onClick={() => !disabled && handleSlotClick(day, time)}
                      disabled={disabled}
                    >
                      {selected ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    </Button>
                  </div>
                );
              }),
              <div key={`time-${time}`} className="text-xs text-slate-500 text-center p-2 border-t border-slate-100 flex items-center justify-center sticky right-0 bg-white min-h-[4rem]">
                {time}
              </div>
            ]
          )}
        </div>
      </div>
    </div>
  );
}
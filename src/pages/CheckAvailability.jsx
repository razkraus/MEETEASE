
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Meeting, TeamMember } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Check, ChevronsUpDown, Search as SearchIcon, Users as UsersIcon, Clock, Calendar as CalendarIcon, Info, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, add, startOfHour, setHours, setMinutes, startOfDay, isBefore, isSameDay, addDays, subDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { Label } from '@/components/ui/label';

export default function CheckAvailability() {
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [duration, setDuration] = useState(60);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isFinding, setIsFinding] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const handleFindTimes = useCallback(async () => {
    if (selectedMembers.length === 0) {
      setError("אנא בחר לפחות חבר בארגון אחד.");
      return;
    }
    setError('');
    setIsFinding(true);
    setSuggestions([]);

    try {
      const selectedEmails = selectedMembers.map(m => m.email);
      const currentUser = await User.me();

      // Get all confirmed meetings in the organization
      const allMeetings = await Meeting.filter({ organization_id: currentUser.organization_id, status: 'confirmed' });

      // Filter meetings for the selected date only - but only consider meetings where the selected members are participants
      const busySlots = allMeetings
        .filter(m => {
          if (!m.final_date || !m.participants) return false;
          const meetingDate = new Date(m.final_date);
          return isSameDay(meetingDate, selectedDate) &&
                 m.participants.some(p => selectedEmails.includes(p.email));
        })
        .map(m => {
          const start = new Date(m.final_date);
          const end = add(start, { minutes: m.duration_minutes });
          return { start, end };
        });

      const foundSlots = findAvailableSlotsForDate(selectedDate, busySlots, duration);
      setSuggestions(foundSlots);
    } catch (e) {
      console.error("Error finding slots:", e);
      setError("אירעה שגיאה במציאת זמנים פנויים.");
    } finally {
      setIsFinding(false);
    }
  }, [selectedMembers, selectedDate, duration]);

  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        const currentUser = await User.me();
        if (currentUser.organization_id) {
          // Load both registered users and team members
          const [registeredUsers, teamMembersData] = await Promise.all([
            User.filter({ organization_id: currentUser.organization_id }),
            TeamMember.filter({ organization_id: currentUser.organization_id })
          ]);

          // Combine and deduplicate members
          const allMembers = [
            ...registeredUsers.filter(u => u.email !== currentUser.email).map(user => ({
              id: user.id,
              full_name: user.full_name,
              email: user.email,
              type: 'registered'
            })),
            ...teamMembersData.filter(tm => !registeredUsers.some(u => u.email === tm.email)).map(tm => ({
              id: tm.id,
              full_name: tm.full_name,
              email: tm.email,
              type: 'pending'
            }))
          ];

          setTeamMembers(allMembers);
        }
      } catch (e) {
        console.error("Failed to load organization members", e);
      }
    };
    loadTeamMembers();
  }, []);

  // Auto-search when date or members change
  useEffect(() => {
    if (selectedMembers.length > 0) {
      handleFindTimes();
    }
  }, [handleFindTimes, selectedMembers.length]);

  const findAvailableSlotsForDate = (date, busySlots, meetingDuration) => {
    const availableSlots = [];
    const startTime = setHours(startOfDay(date), 8); // Start at 8 AM
    const endTime = setHours(startOfDay(date), 22); // End at 10 PM
    let currentTime = startTime;

    while (isBefore(currentTime, endTime)) {
      const potentialEnd = add(currentTime, { minutes: meetingDuration });
      
      // Skip if potential end time is beyond our search window
      if (potentialEnd > endTime) {
        break;
      }

      const isBusy = busySlots.some(slot =>
        (isBefore(currentTime, slot.end) && isBefore(slot.start, potentialEnd))
      );

      if (!isBusy) {
        availableSlots.push(new Date(currentTime));
      }

      currentTime = add(currentTime, { minutes: 30 }); // Check every 30 minutes
    }
    return availableSlots;
  };

  const handleSelectSlot = (slot) => {
    const meetingData = {
      participants: selectedMembers.map(m => ({ name: m.full_name, email: m.email, type: 'internal' })),
      proposed_dates: [{
        datetime: slot.toISOString(),
        date_label: format(slot, "EEEE, d MMMM yyyy 'בשעה' HH:mm", { locale: he })
      }],
      duration_minutes: duration
    };
    localStorage.setItem('prefilledMeetingData', JSON.stringify(meetingData));
    navigate(`${createPageUrl("CreateMeeting")}?from=availability`);
  };

  const navigateDate = (direction) => {
    if (direction === 'prev') {
      setSelectedDate(subDays(selectedDate, 1));
    } else {
      setSelectedDate(addDays(selectedDate, 1));
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <SearchIcon className="w-8 h-8 text-blue-600" />
            בדיקת זמינות
          </h1>
          <p className="text-slate-600 mt-1">מצא את הזמן המושלם לישיבה עבור חברי הארגון שלך.</p>
        </div>

        <Card className="meetiz-card">
          <CardHeader>
            <CardTitle>חיפוש זמן פנוי</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Navigation */}
            <div className="space-y-2">
              <Label className="font-semibold">1. בחר תאריך לבדיקה</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateDate('prev')}
                  className="rounded-xl"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 justify-start text-right h-12 rounded-xl">
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {format(selectedDate, "EEEE, d MMMM yyyy", { locale: he })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date);
                          setShowCalendar(false);
                        }
                      }}
                      disabled={(date) => isBefore(date, startOfDay(new Date()))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateDate('next')}
                  className="rounded-xl"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Member Selection */}
            <div className="space-y-2">
              <Label className="font-semibold">2. בחר חברי ארגון</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between h-12 rounded-xl">
                    {selectedMembers.length > 0 ? `${selectedMembers.length} חברים נבחרו` : "בחר חבר בארגון אחד או יותר..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="חיפוש חבר בארגון..." />
                    <CommandList>
                      <CommandEmpty>לא נמצאו חברים.</CommandEmpty>
                      <CommandGroup>
                        {teamMembers.map((member) => (
                          <CommandItem
                            key={member.id}
                            onSelect={() => {
                              setSelectedMembers(
                                selectedMembers.some(sm => sm.id === member.id)
                                  ? selectedMembers.filter(sm => sm.id !== member.id)
                                  : [...selectedMembers, member]
                              );
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${selectedMembers.some(sm => sm.id === member.id) ? "opacity-100" : "opacity-0"}`}
                            />
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${member.type === 'registered' ? 'bg-green-500' : 'bg-orange-400'}`}></div>
                              {member.full_name}
                              {member.type === 'pending' && <span className="text-xs text-slate-500">(ממתין להתחברות)</span>}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Duration Selection */}
            <div className="space-y-2">
              <Label className="font-semibold">3. הגדר משך ישיבה</Label>
              <Select value={duration.toString()} onValueChange={(val) => setDuration(parseInt(val))}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 דקות</SelectItem>
                  <SelectItem value="45">45 דקות</SelectItem>
                  <SelectItem value="60">שעה</SelectItem>
                  <SelectItem value="90">שעה וחצי</SelectItem>
                  <SelectItem value="120">שעתיים</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
          </CardContent>
        </Card>

        {/* Results */}
        {selectedMembers.length > 0 && (
          <Card className="meetiz-card mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-green-600" />
                זמנים פנויים ב-{format(selectedDate, "EEEE, d MMMM", { locale: he })}
              </CardTitle>
              <p className="text-sm text-slate-500">
                עבור {selectedMembers.length} חברי ארגון • משך ישיבה: {duration} דקות
              </p>
            </CardHeader>
            <CardContent>
              {isFinding ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
                  <p className="text-slate-600">בודק זמינות...</p>
                </div>
              ) : suggestions.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {suggestions.map((slot, index) => (
                    <Button 
                      key={index} 
                      variant="outline" 
                      className="h-auto p-4 justify-center text-center hover:bg-green-50 hover:border-green-300 rounded-xl" 
                      onClick={() => handleSelectSlot(slot)}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Clock className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-semibold text-lg">{format(slot, "HH:mm")}</p>
                          <p className="text-xs text-slate-600">לחץ ליצירת ישיבה</p>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Info className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    אין זמנים פנויים
                  </h3>
                  <p className="text-slate-600">
                    בתאריך זה, כל החברים שבחרת תפוסים. נסה תאריך אחר.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {selectedMembers.length === 0 && (
           <div className="text-center py-12">
                <Info className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  התחל בחיפוש
                </h3>
                <p className="text-slate-600">
                  בחר תאריך וחברי ארגון כדי לראות את הזמינות שלהם.
                </p>
          </div>
        )}
      </div>
    </div>
  );
}


import { useState, useEffect } from "react";
import { Meeting, Response, User } from "@/api/entities"; // Added User import
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Calendar, Plus, Search, Copy as CopyIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { format, formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";

import MeetingCard from "../components/meetings/MeetingCard";
import MeetingFilters from "../components/meetings/MeetingFilters";

export default function MyMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();

      // Get all meetings for the organization
      const allMeetings = await Meeting.list("-created_date");

      // Filter to show only meetings created by current user OR where user is a participant
      const userMeetings = allMeetings.filter(meeting => {
        // Show if user created the meeting
        if (meeting.created_by === currentUser.email) {
          return true;
        }

        // Show if user is a participant
        if (meeting.participants && Array.isArray(meeting.participants) && meeting.participants.some(p => p.email === currentUser.email)) {
          return true;
        }

        return false;
      });

      setMeetings(userMeetings);

      // Get responses only for meetings the user can see
      let responsesData = [];
      if (userMeetings.length > 0) {
        const meetingIds = userMeetings.map(m => m.id);
        responsesData = await Response.filter({ meeting_id_in: meetingIds }, "-created_date");
      }
      setResponses(responsesData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meeting.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || meeting.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getMeetingsByStatus = (status) => {
    return filteredMeetings.filter(meeting => meeting.status === status);
  };

  const duplicateMeeting = (meeting) => {
    const meetingData = {
      title: `${meeting.title} - עותק`,
      description: meeting.description || '',
      location: meeting.location || '',
      duration_minutes: meeting.duration_minutes,
      participants: meeting.participants || [],
      proposed_dates: [], // Duplicated meeting should start with empty proposed dates
      meeting_type: meeting.meeting_type || 'external'
    };

    localStorage.setItem('duplicatedMeetingData', JSON.stringify(meetingData));
    window.location.href = `${createPageUrl("CreateMeeting")}?duplicate=true`;
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              הישיבות שלי
            </h1>
            <p className="text-slate-600 mt-1">
              נהל וגיב את כל הישיבות שלך
            </p>
          </div>
          <Link to={createPageUrl("CreateMeeting")}>
            <Button className="meetiz-button-primary text-white rounded-xl px-6">
              <Plus className="w-4 h-4 ml-2" />
              ישיבה חדשה
            </Button>
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="meetiz-card rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="חפש ישיבות..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 rounded-xl border-slate-200"
              />
            </div>
            <MeetingFilters
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
            />
          </div>
        </div>

        {/* Meetings Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-white rounded-xl p-1 shadow-sm">
            <TabsTrigger value="all" className="rounded-lg">
              כל הישיבות ({filteredMeetings.length})
            </TabsTrigger>
            <TabsTrigger value="draft" className="rounded-lg">
              טיוטות ({getMeetingsByStatus('draft').length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="rounded-lg">
              נשלחו ({getMeetingsByStatus('sent').length})
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="rounded-lg">
              מאושרות ({getMeetingsByStatus('confirmed').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid gap-4">
              {filteredMeetings.map((meeting) => (
                <div key={meeting.id} className="relative group">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>{format(new Date(meeting.created_date), "d MMMM yyyy", { locale: he })}</span>

                    {/* כפתור שכפול בפינה */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        duplicateMeeting(meeting);
                      }}
                      className="mr-auto opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-700"
                    >
                      <CopyIcon className="w-4 h-4 ml-1" />
                      שכפל
                    </Button>
                  </div>
                  <MeetingCard
                    meeting={meeting}
                    responses={responses.filter(r => r.meeting_id === meeting.id)}
                    onUpdate={loadData}
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="draft">
            <div className="grid gap-4">
              {getMeetingsByStatus('draft').map((meeting) => (
                <div key={meeting.id} className="relative group">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>{format(new Date(meeting.created_date), "d MMMM yyyy", { locale: he })}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        duplicateMeeting(meeting);
                      }}
                      className="mr-auto opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-700"
                    >
                      <CopyIcon className="w-4 h-4 ml-1" />
                      שכפל
                    </Button>
                  </div>
                  <MeetingCard
                    meeting={meeting}
                    responses={responses.filter(r => r.meeting_id === meeting.id)}
                    onUpdate={loadData}
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sent">
            <div className="grid gap-4">
              {getMeetingsByStatus('sent').map((meeting) => (
                <div key={meeting.id} className="relative group">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>{format(new Date(meeting.created_date), "d MMMM yyyy", { locale: he })}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        duplicateMeeting(meeting);
                      }}
                      className="mr-auto opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-700"
                    >
                      <CopyIcon className="w-4 h-4 ml-1" />
                      שכפל
                    </Button>
                  </div>
                  <MeetingCard
                    meeting={meeting}
                    responses={responses.filter(r => r.meeting_id === meeting.id)}
                    onUpdate={loadData}
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="confirmed">
            <div className="grid gap-4">
              {getMeetingsByStatus('confirmed').map((meeting) => (
                <div key={meeting.id} className="relative group">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>{format(new Date(meeting.created_date), "d MMMM yyyy", { locale: he })}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        duplicateMeeting(meeting);
                      }}
                      className="mr-auto opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-700"
                    >
                      <CopyIcon className="w-4 h-4 ml-1" />
                      שכפל
                    </Button>
                  </div>
                  <MeetingCard
                    meeting={meeting}
                    responses={responses.filter(r => r.meeting_id === meeting.id)}
                    onUpdate={loadData}
                  />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {filteredMeetings.length === 0 && !isLoading && (
          <div className="meetiz-card rounded-2xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <Plus className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              אין ישיבות עדיין
            </h3>
            <p className="text-slate-600 mb-6">
              התחל ליצור ישיבות ותוכל לראות אותן כאן
            </p>
            <Link to={createPageUrl("CreateMeeting")}>
              <Button className="meetiz-button-primary text-white rounded-xl">
                צור ישיבה ראשונה
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

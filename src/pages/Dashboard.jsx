import { useState, useEffect } from "react";
import { Meeting, Response, User, Organization } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Crown, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

import MeetingsCalendar from "../components/dashboard/MeetingsCalendar";
import QuickActions from "../components/dashboard/QuickActions";
import MeetingHistory from "../components/dashboard/MeetingHistory";
import CollapsibleStats from "../components/dashboard/CollapsibleStats";

export default function Dashboard() {
  const [meetings, setMeetings] = useState([]);
  const [responses, setResponses] = useState([]);
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      if (currentUser.organization_id) {
        // Fetch organization
        const orgDataArray = await Organization.filter({ id: currentUser.organization_id });
        const orgData = orgDataArray.length > 0 ? orgDataArray[0] : null;
        setOrganization(orgData);

        // Fetch only meetings that the current user created OR is a participant in
        const allMeetings = await Meeting.filter({ organization_id: currentUser.organization_id }, "-created_date");

        // Filter meetings to show only those created by current user OR where user is a participant
        const userMeetings = allMeetings.filter(meeting => {
          // Show if user created the meeting
          if (meeting.created_by === currentUser.email) {
            return true;
          }

          // Show if user is a participant
          if (Array.isArray(meeting.participants) && meeting.participants.some(p => p.email === currentUser.email)) {
            return true;
          }

          return false;
        });

        setMeetings(userMeetings || []);

        // Fetch responses only for meetings the user can see
        let responsesData = [];
        if (userMeetings && userMeetings.length > 0) {
          try {
            const meetingIds = userMeetings.map(m => m.id);
            responsesData = await Response.filter({ meeting_id_in: meetingIds }, "-created_date");
          } catch (responseError) {
            console.error("Error loading responses:", responseError);
            responsesData = [];
          }
        }
        setResponses(responsesData || []);
      } else {
        // If no organization, clear data
        setMeetings([]);
        setResponses([]);
        setOrganization(null);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      // Set default values on error
      setMeetings([]);
      setResponses([]);
      setOrganization(null);
    } finally {
      setIsLoading(false);
    }
  };

  // הפרדת ישיבות לפעילות והיסטוריה לשימוש בקומפוננטות ובסטטיסטיקות
  const currentDate = new Date();
  const activeMeetings = meetings.filter(m => {
    if (m.status === 'confirmed' && m.final_date) {
      return new Date(m.final_date) >= currentDate;
    }
    return m.status !== 'cancelled'; // Other statuses (sent, etc.) are considered active
  });

  const pastMeetings = meetings.filter(m => {
    if (m.status === 'confirmed' && m.final_date) {
      return new Date(m.final_date) < currentDate;
    }
    return m.status === 'cancelled'; // Cancelled meetings are always "past"
  });

  const stats = {
    totalMeetings: meetings.length,
    activeMeetings: activeMeetings.filter(m => m.status === 'sent').length,
    confirmedMeetings: activeMeetings.filter(m => m.status === 'confirmed').length,
    pastMeetings: pastMeetings.length,
    totalResponses: responses.length
  };

  const canCreateMeetings = user?.can_create_meetings || false;
  const isPremium = organization?.subscription_type === 'premium';

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="dashboard-container max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
              שלום {user?.full_name?.split(' ')[0]}! 👋
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-slate-600 text-lg">
                {user?.organization_name || 'ברוכים הבאים למיטיז'}
              </p>
              {isPremium && <Crown className="w-5 h-5 text-yellow-500" />}
            </div>
          </div>
          {canCreateMeetings ? (
            <Link to={createPageUrl("CreateMeeting")}>
              <Button className="meetiz-button-primary text-white px-6 py-3 rounded-xl shadow-lg">
                <Plus className="w-5 h-5 ml-2" />
                ישיבה חדשה
              </Button>
            </Link>
          ) : (
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-2">רק משתמשים מורשים יכולים ליצור ישיבות</p>
              <Button disabled className="opacity-50 cursor-not-allowed">
                <Plus className="w-5 h-5 ml-2" />
                ישיבה חדשה
              </Button>
            </div>
          )}
        </div>

        {!isPremium && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              אתם משתמשים בגרסה החינמית של מיטיז.
              <Link to={createPageUrl("Subscription")} className="underline font-semibold">
                שדרגו לפרימיום
              </Link>
              {" "}כדי ליהנות מכל התכונות.
            </AlertDescription>
          </Alert>
        )}

        <div className="dashboard-grid grid lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <MeetingsCalendar
              meetings={activeMeetings}
              isLoading={isLoading}
            />
          </div>
          <div>
            <QuickActions canCreateMeetings={canCreateMeetings} />
          </div>
        </div>

        <div className="space-y-8">
          <CollapsibleStats stats={stats} />
          <MeetingHistory
            pastMeetings={pastMeetings}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

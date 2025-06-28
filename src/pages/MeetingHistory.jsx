import React, { useState, useEffect } from "react";
import { Meeting, Response, User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, History, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import MeetingCard from "../components/meetings/MeetingCard";

export default function MeetingHistoryPage() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      if (currentUser.organization_id) {
        const [meetingsData, responsesData] = await Promise.all([
          Meeting.filter({ organization_id: currentUser.organization_id }, "-created_date"),
          Response.list("-created_date")
        ]);
        
        // סינון ישיבות שעברו
        const currentDate = new Date();
        const pastMeetings = meetingsData.filter(meeting => {
          if (meeting.status === 'cancelled') return true;
          if (meeting.status === 'confirmed' && meeting.final_date) {
            return new Date(meeting.final_date) < currentDate;
          }
          return false;
        });
        
        setMeetings(pastMeetings);
        setResponses(responsesData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const completedMeetings = meetings.filter(m => 
    m.status === 'confirmed' && m.final_date && new Date(m.final_date) < new Date()
  );
  
  const cancelledMeetings = meetings.filter(m => m.status === 'cancelled');

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="rounded-full"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              היסטוריית ישיבות
            </h1>
            <p className="text-slate-600 mt-1">
              כל הישיבות שהסתיימו או בוטלו
            </p>
          </div>
        </div>

        <Tabs defaultValue="completed" className="space-y-6">
          <TabsList className="bg-white rounded-xl p-1 shadow-sm">
            <TabsTrigger value="completed" className="rounded-lg">
              ישיבות שהושלמו ({completedMeetings.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="rounded-lg">
              ישיבות שבוטלו ({cancelledMeetings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="completed">
            <div className="grid gap-4">
              {completedMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  responses={responses.filter(r => r.meeting_id === meeting.id)}
                  onUpdate={loadData}
                />
              ))}
              
              {completedMeetings.length === 0 && (
                <div className="meetiz-card rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    אין ישיבות שהושלמו
                  </h3>
                  <p className="text-slate-600">
                    ישיבות שהסתיימו יופיעו כאן
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="cancelled">
            <div className="grid gap-4">
              {cancelledMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  responses={responses.filter(r => r.meeting_id === meeting.id)}
                  onUpdate={loadData}
                />
              ))}
              
              {cancelledMeetings.length === 0 && (
                <div className="meetiz-card rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <History className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    אין ישיבות שבוטלו
                  </h3>
                  <p className="text-slate-600">
                    ישיבות שבוטלו יופיעו כאן
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
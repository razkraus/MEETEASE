
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, UserCog, Lock, Home } from "lucide-react"; // Added Home icon
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function QuickActions({ canCreateMeetings }) {
  const actions = [
    {
      title: "ישיבה חדשה",
      description: "צור ישיבה עם מועדים מרובים",
      icon: Plus,
      link: createPageUrl("CreateMeeting"),
      color: "bg-blue-600 hover:bg-blue-700",
      disabled: !canCreateMeetings
    },
    {
      title: "הישיבות שלי",
      description: "נהל את כל הישיבות שלך",
      icon: Calendar,
      link: createPageUrl("MyMeetings"),
      color: "bg-green-600 hover:bg-green-700"
    },
    { // Replaced "חברי צוות" with "חזור לבית"
      title: "חזור לבית",
      description: "מסך הבית הראשי",
      icon: Home, // Changed icon to Home
      link: createPageUrl("Dashboard"), // Link to Dashboard page (now considered home)
      color: "bg-indigo-600 hover:bg-indigo-700" // Changed color
    }
  ];

  return (
    <Card className="meetiz-card">
      <CardHeader>
        <CardTitle className="text-xl font-bold">פעולות מהירות</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.map((action, index) => (
          action.disabled ? (
            <div key={index} className="relative">
              <Button
                disabled
                className={`w-full justify-start text-right h-auto p-4 opacity-50 cursor-not-allowed bg-slate-300 text-slate-500 rounded-xl`}
              >
                <div className="flex items-center gap-3 w-full">
                  <Lock className="w-5 h-5" />
                  <div className="text-right">
                    <div className="font-semibold">{action.title}</div>
                    <div className="text-sm opacity-90">נדרשת הרשאה</div>
                  </div>
                </div>
              </Button>
            </div>
          ) : (
            <Link key={index} to={action.link}>
              <Button
                className={`w-full justify-start text-right h-auto p-4 ${action.color} text-white rounded-xl shadow-sm hover:shadow-md transition-all`}
              >
                <div className="flex items-center gap-3 w-full">
                  <action.icon className="w-5 h-5" />
                  <div className="text-right">
                    <div className="font-semibold">{action.title}</div>
                    <div className="text-sm opacity-90">{action.description}</div>
                  </div>
                </div>
              </Button>
            </Link>
          )
        ))}
        
        <div className="pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-center">
            💡 טיפ: ישיבות חיצוניות מחייבות אישור מועדים מהמשתתפים
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

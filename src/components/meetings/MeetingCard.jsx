
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock, ExternalLink, CheckCircle, Share2, Copy, MessageCircle, Mail, Send, Bell, Copy as CopyIcon } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { createPageUrl } from "@/utils";
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { SendEmail } from "@/api/integrations";

const statusLabels = {
  draft: { label: "טיוטה", color: "bg-slate-100 text-slate-700" },
  sent: { label: "נשלח", color: "bg-orange-100 text-orange-700" },
  confirmed: { label: "מאושר", color: "bg-green-100 text-green-700" },
  cancelled: { label: "בוטל", color: "bg-red-100 text-red-700" }
};

export default function MeetingCard({ meeting, responses, onUpdate }) {
  const [isSharing, setIsSharing] = useState(false);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const responseCount = responses.length;
  const participantCount = meeting.participants?.length || 0;

  // חישוב מי לא הגיב
  const respondedEmails = new Set(responses.map(r => r.participant_email));
  const nonResponders = meeting.participants?.filter(p => !respondedEmails.has(p.email)) || [];

  const getInvitationLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}${createPageUrl("RespondToMeeting")}?meeting=${meeting.id}&code=${meeting.invitation_code}`;
  };

  const copyInvitationLink = async () => {
    try {
      await navigator.clipboard.writeText(getInvitationLink());
      toast({
        title: "הקישור הועתק!",
        description: "הקישור לישיבה הועתק ללוח העתקה",
      });
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const sendQuickReminders = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (nonResponders.length === 0) {
      toast({
        title: "כל המשתתפים הגיבו!",
        description: "אין צורך לשלוח תזכורות",
      });
      return;
    }

    setIsSendingReminders(true);
    
    try {
      let successCount = 0;
      let failureCount = 0;

      for (const participant of nonResponders) {
        try {
          await sendReminderEmail(meeting, participant);
          successCount++;
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          failureCount++;
          console.error(`Failed to send reminder to ${participant.email}:`, error);
        }
      }

      if (successCount > 0) {
        toast({
          title: "תזכורות נשלחו!",
          description: `נשלחו תזכורות ל-${successCount} משתתפים`,
        });
        if (onUpdate) onUpdate();
      }

      if (failureCount > 0) {
        toast({
          title: "חלק מהתזכורות נכשלו",
          description: `${failureCount} תזכורות לא נשלחו בהצלחה`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error("Error sending reminders:", error);
      toast({
        title: "שגיאה בשליחת תזכורות",
        description: "נסה שוב מאוחר יותר",
        variant: "destructive"
      });
    }
    
    setIsSendingReminders(false);
  };

  const sendReminderEmail = async (meeting, participant) => {
    const invitationLink = `${window.location.origin}${createPageUrl("RespondToMeeting")}?meeting=${meeting.id}&code=${meeting.invitation_code}&email=${encodeURIComponent(participant.email)}`;
    
    const proposedDatesHTML = meeting.proposed_dates?.map(date => `
      <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 8px; font-size: 14px;">
        📅 ${date.date_label}
      </div>
    `).join('') || '';
    
    const emailHTML = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>תזכורת - הזמנה לישיבה</title>
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; direction: rtl;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px 20px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">🔔 מיטיז</div>
            <h1 style="margin: 0;">תזכורת - הזמנה לישיבה</h1>
          </div>
          
          <div style="padding: 30px 20px;">
            <h2>שלום ${participant.name},</h2>
            
            <p>זוהי תזכורת לישיבה שאליה הוזמנת ועדיין לא הגבת.</p>
            
            <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #f59e0b;">
              <h3>📅 ${meeting.title}</h3>
              ${meeting.description ? `<p>${meeting.description}</p>` : ''}
              <p><strong>📍 מיקום:</strong> ${meeting.location || 'יצוין לאחר אישור המועד'}</p>
              <p><strong>⏰ משך:</strong> ${meeting.duration_minutes} דקות</p>
            </div>
            
            <div>
              <h4>🗓️ מועדים מוצעים:</h4>
              ${proposedDatesHTML}
            </div>
            
            <div style="text-align: center;">
              <a href="${invitationLink}" style="display: inline-block; background: #16a34a; color: white; text-decoration: none; padding: 15px 30px; border-radius: 12px; font-weight: bold; margin: 20px 0;">
                ✅ לחץ כאן לבחירת מועדים
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailSubject = `🔔 תזכורת - הזמנה לישיבה: ${meeting.title}`;

    await SendEmail({
      to: participant.email.trim(),
      subject: emailSubject,
      body: emailHTML
    });
  };

  const duplicateMeeting = (meeting) => {
    // יצירת נתוני הישיבה החדשה על בסיס הקיימת
    const meetingData = {
      title: `${meeting.title} - עותק`,
      description: meeting.description || '',
      location: meeting.location || '',
      duration_minutes: meeting.duration_minutes,
      participants: meeting.participants || [],
      proposed_dates: [], // Reset proposed dates for a new meeting
      meeting_type: meeting.meeting_type || 'external' // Preserve meeting type
    };
    
    // שמירה ב-localStorage עד הפניה לעמוד יצירת הישיבה
    localStorage.setItem('duplicatedMeetingData', JSON.stringify(meetingData));
    
    // הפניה לעמוד יצירת ישיבה עם פרמטר מיוחד
    window.location.href = `${createPageUrl("CreateMeeting")}?duplicate=true`;
  };

  return (
    <Link to={`${createPageUrl("MeetingDetails")}?id=${meeting.id}`}>
      <Card className="meetiz-card hover:shadow-lg transition-all duration-300 cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl font-bold text-slate-900 mb-2">
                {meeting.title}
              </CardTitle>
              {meeting.description && (
                <p className="text-slate-600 text-sm">{meeting.description}</p>
              )}
            </div>
            <Badge className={`${statusLabels[meeting.status].color} text-xs`}>
              {statusLabels[meeting.status].label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            {meeting.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span>{meeting.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>{meeting.duration_minutes} דקות</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <span>{participantCount} משתתפים</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>{format(new Date(meeting.created_date), "d MMMM yyyy", { locale: he })}</span>
            </div>
          </div>

          {meeting.status === 'sent' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">
                    {responseCount} מתוך {participantCount} השיבו
                  </span>
                </div>
                <div className="flex gap-2">
                  {nonResponders.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={sendQuickReminders}
                      disabled={isSendingReminders}
                      className="text-xs"
                    >
                      {isSendingReminders ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-600 mr-1"></div>
                          שולח...
                        </>
                      ) : (
                        <>
                          <Bell className="w-3 h-3 mr-1" />
                          תזכורת ל-{nonResponders.length}
                        </>
                      )}
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyInvitationLink}
                    className="text-xs"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    העתק קישור
                  </Button>
                </div>
              </div>
            </div>
          )}

          {meeting.final_date && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">הישיבה נקבעה</p>
                  <p className="text-xs text-green-700">
                    {format(new Date(meeting.final_date), "EEEE, d MMMM yyyy 'בשעה' HH:mm", { locale: he })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions section */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500">
                נוצר ב-{format(new Date(meeting.created_date), "d MMMM yyyy 'בשעה' HH:mm", { locale: he })}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="1" fill="currentColor"/>
                      <circle cx="19" cy="12" r="1" fill="currentColor"/>
                      <circle cx="5" cy="12" r="1" fill="currentColor"/>
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={`${createPageUrl("MeetingDetails")}?id=${meeting.id}`}>
                      <ExternalLink className="ml-2 h-4 w-4" />
                      <span>פתח ישיבה</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      duplicateMeeting(meeting);
                    }}
                  >
                    <CopyIcon className="ml-2 h-4 w-4" />
                    שכפל ישיבה
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    copyInvitationLink();
                  }}>
                    <Copy className="ml-2 h-4 w-4" />
                    העתק קישור הזמנה
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

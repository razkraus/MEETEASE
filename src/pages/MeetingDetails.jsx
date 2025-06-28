
import React, { useState, useEffect } from "react";
import { Meeting, Response, Notification, User, Contact, TeamMember } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin, Clock, Users, CheckCircle, ArrowRight, User as UserIcon, Building2, MessageSquare, CalendarCheck, Edit, UserPlus, UserMinus, Send, Mail, Bell, Copy as CopyIcon, Car, XCircle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { SendEmail } from "@/api/integrations";

const statusLabels = {
  draft: { label: "טיוטה", color: "bg-slate-100 text-slate-700" },
  sent: { label: "נשלח", color: "bg-orange-100 text-orange-700" },
  confirmed: { label: "מאושר", color: "bg-green-100 text-green-700" },
  cancelled: { label: "בוטל", color: "bg-red-100 text-red-700" }
};

export default function MeetingDetails() {
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [selectedFinalDate, setSelectedFinalDate] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isEditingParticipants, setIsEditingParticipants] = useState(false); // New state
  const [editedParticipants, setEditedParticipants] = useState([]); // New state
  const [newParticipantName, setNewParticipantName] = useState(""); // New state
  const [newParticipantEmail, setNewParticipantEmail] = useState(""); // New state
  const [newParticipantCompany, setNewParticipantCompany] = useState(""); // New state
  const [isSending, setIsSending] = useState(false); // New state for re-sending
  const [contacts, setContacts] = useState([]); // New state
  const [teamMembers, setTeamMembers] = useState([]); // New state
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);

  useEffect(() => {
    loadMeetingData();
    loadContactsAndTeam(); // Call new function
  }, []);

  const loadContactsAndTeam = async () => {
    try {
      const user = await User.me();
      if (user.organization_id) {
        const [contactsData, teamMembersData] = await Promise.all([
          Contact.filter({ organization_id: user.organization_id }),
          TeamMember.filter({ organization_id: user.organization_id })
        ]);
        setContacts(contactsData);
        setTeamMembers(teamMembersData);
      }
    } catch (error) {
      console.error("Error loading contacts and team:", error);
    }
  };

  const loadMeetingData = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const meetingId = urlParams.get('id');

    if (!meetingId) {
      navigate(createPageUrl("MyMeetings"));
      return;
    }

    try {
      const currentUser = await User.me();
      const [meetingData, responsesData] = await Promise.all([
        Meeting.filter({ id: meetingId }),
        Response.filter({ meeting_id: meetingId }, "-created_date")
      ]);

      if (meetingData.length > 0) {
        const meeting = meetingData[0];
        
        // Security check: Only allow access if user created the meeting OR is a participant
        const hasAccess = meeting.created_by === currentUser.email || 
                         (meeting.participants && meeting.participants.some(p => p.email === currentUser.email));
        
        if (!hasAccess) {
          alert("אין לך הרשאה לצפות בישיבה זו.");
          navigate(createPageUrl("MyMeetings"));
          return;
        }
        
        setMeeting(meeting);
        setResponses(responsesData);
        setEditedParticipants(meeting.participants || []);
      } else {
        navigate(createPageUrl("MyMeetings"));
      }
    } catch (error) {
      console.error("Error loading meeting data:", error);
    }
    setIsLoading(false);
  };

  const addParticipant = (participant) => {
    // Check if participant already exists by email to prevent duplicates
    if (!editedParticipants.some(p => p.email === participant.email)) {
      setEditedParticipants([...editedParticipants, participant]);
    }
  };

  const addNewParticipant = () => {
    if (!newParticipantName || !newParticipantEmail) {
      alert("אנא מלא שם ואימייל למשתתף חדש.");
      return;
    }
    
    // Basic email format validation
    if (!/\S+@\S+\.\S+/.test(newParticipantEmail)) {
      alert("אנא הכנס כתובת אימייל חוקית.");
      return;
    }

    const participant = {
      name: newParticipantName,
      email: newParticipantEmail,
      type: 'external', // New participants added manually are external by default
      company: newParticipantCompany
    };
    
    addParticipant(participant); // Use the common add function
    // Clear input fields after adding
    setNewParticipantName("");
    setNewParticipantEmail("");
    setNewParticipantCompany("");
  };

  const removeParticipant = (email) => {
    setEditedParticipants(editedParticipants.filter(p => p.email !== email));
  };

  const saveParticipants = async () => {
    try {
      // Update the meeting object in the database with the new participants list
      await Meeting.update(meeting.id, {
        participants: editedParticipants // Save the edited list
      });
      setMeeting({ ...meeting, participants: editedParticipants }); // Update local state
      setIsEditingParticipants(false); // Close the dialog
    } catch (error) {
      console.error("Error updating participants:", error);
      alert("שגיאה בעדכון המשתתפים");
    }
  };

  const sendReminders = async () => {
    if (!meeting || !meeting.participants) return;

    setIsSending(true);
    try {
        const respondedEmails = new Set(responses.filter(r => r.status !== 'declined').map(r => r.participant_email));
        const nonResponders = meeting.participants.filter(p => !respondedEmails.has(p.email));

        if (nonResponders.length === 0) {
            alert("כל המשתתפים כבר הגיבו או סירבו!");
            setIsSending(false);
            return;
        }

        console.log(`📧 Starting to send reminders to ${nonResponders.length} participants`);

        let successCount = 0;
        let failureCount = 0;
        const failedEmails = [];
        const successfulEmails = [];

        for (const participant of nonResponders) {
            try {
                await sendInvitationEmail(meeting, participant);
                successCount++;
                successfulEmails.push(participant.email);
            } catch (emailError) {
                failureCount++;
                failedEmails.push({
                    email: participant.email,
                    name: participant.name,
                    error: emailError.message || 'שגיאה לא ידועה'
                });
            }
        }

        if (successfulEmails.length > 0) {
            const currentMeeting = await Meeting.get(meeting.id);
            const updatedParticipants = currentMeeting.participants.map(p => {
                if (successfulEmails.includes(p.email)) {
                    return {
                        ...p,
                        reminders_sent: (p.reminders_sent || 0) + 1,
                        status: 'reminded'
                    };
                }
                return p;
            });
            await Meeting.update(meeting.id, { participants: updatedParticipants });
            setMeeting(prev => ({ ...prev, participants: updatedParticipants }));
        }

        let message = '';
        if (successCount > 0) {
            message += `✅ נשלחו תזכורות ל-${successCount} משתתפים בהצלחה\n`;
        }
        if (failureCount > 0) {
            message += `❌ ${failureCount} תזכורות נכשלו:\n`;
            failedEmails.forEach(failed => {
                message += `- ${failed.name} (${failed.email}): ${failed.error}\n`;
            });
            message += '\nאנא בדוק את כתובות המייל או נסה שוב מאוחר יותר.';
        }
        
        if (message) {
            alert(message);
        }

    } catch (error) {
        console.error("Error sending reminders:", error);
        alert("שגיאה בשליחת התזכורות: " + error.message);
    }
    setIsSending(false);
  };

  const sendInvitationsToNewParticipants = async () => {
    setIsSending(true);
    try {
      const existingEmails = new Set(responses.map(r => r.participant_email)); // Use Set for efficient lookup
      // Filter for participants who are in the current `editedParticipants` list but *have not* responded yet
      const participantsToSendInvitations = editedParticipants.filter(p => !existingEmails.has(p.email));

      if (participantsToSendInvitations.length === 0) { // Fix: Typo corrected here
        alert("אין משתתפים חדשים או כאלה שטרם הגיבו לשלוח להם הזמנה מחדש.");
        setIsSending(false);
        return;
      }

      // שליחת הזמנות לכל המשתתפים החדשים - לכולם אותו מייל
      for (const participant of participantsToSendInvitations) {
        try {
          await sendInvitationEmail(meeting, participant);
        } catch (emailError) {
          console.error(`Failed to send email to ${participant.email}:`, emailError);
          // Don't block the loop for one failure, just log it.
        }
      }

      alert(`נשלחו הזמנות ל-${participantsToSendInvitations.length} משתתפים.`);
    } catch (error) {
      console.error("Error sending invitations:", error);
      alert("שגיאה בשליחת ההזמנות");
    }
    setIsSending(false);
  };

  const sendInvitationEmail = async (meeting, participant) => {
    console.log(`📧 Preparing reminder email for ${participant.email}...`);
    
    // בדיקות נוספות
    if (!participant.email) {
        throw new Error('כתובת מייל חסרה');
    }
    
    if (!participant.name) {
        throw new Error('שם משתתף חסר');
    }

    // בדיקת תקינות מייל
    const emailRegex = /^[^\s@]+@[^\s@]+\.\S+$/;
    if (!emailRegex.test(participant.email)) {
        throw new Error('כתובת מייל לא תקינה');
    }
    
    const invitationLink = `${window.location.origin}${createPageUrl("RespondToMeeting")}?meeting=${meeting.id}&code=${meeting.invitation_code}&email=${encodeURIComponent(participant.email)}`;
    
    console.log(`🔗 Invitation link: ${invitationLink}`);
    
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
        <style>
          body { 
            font-family: Arial, sans-serif; 
            background-color: #f8fafc; 
            margin: 0; 
            padding: 20px; 
            direction: rtl;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
            color: white; 
            padding: 30px 20px; 
            text-align: center;
          }
          .logo { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 10px;
          }
          .content { 
            padding: 30px 20px;
          }
          .meeting-info { 
            background: #fef3c7; 
            border: 1px solid #f59e0b; 
            border-radius: 12px; 
            padding: 20px; 
            margin: 20px 0;
          }
          .cta-button { 
            display: inline-block; 
            background: #16a34a; 
            color: white !important; 
            text-decoration: none; 
            padding: 15px 30px; 
            border-radius: 12px; 
            font-weight: bold; 
            text-align: center; 
            margin: 20px 0;
          }
          .footer { 
            background: #f8fafc; 
            padding: 20px; 
            text-align: center; 
            font-size: 12px; 
            color: #64748b; 
            border-top: 1px solid #e2e8f0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔔 מיטיז</div>
            <h1 style="margin: 0;">תזכורת - הזמנה לישיבה</h1>
          </div>
          
          <div class="content">
            <h2>שלום ${participant.name},</h2>
            
            <p>זוהי תזכורת לישיבה שאליה הוזמנת ועדיין לא הגבת.</p>
            <p>אנא הקדש רגע לבחירת המועדים שמתאימים לך כדי שנוכל לקבע את הישיבה.</p>
            
            <div class="meeting-info">
              <h3>📅 ${meeting.title}</h3>
              
              ${meeting.description ? `<p>${meeting.description}</p>` : ''}
              
              <p><strong>📍 מיקום:</strong> ${meeting.location || 'יצוין לאחר אישור המועד'}</p>
              <p><strong>⏰ משך:</strong> ${meeting.duration_minutes} דקות</p>
              ${meeting.modality === 'physical' && participant.travel_time_minutes > 0 ? `<p><strong>🚗 תוספת נסיעה:</strong> ${participant.travel_time_minutes} דקות (לכל כיוון)</p>` : ''}
              <p><strong>👥 משתתפים:</strong> ${meeting.participants?.length || 0} אנשים</p>
            </div>
            
            <div>
              <h4>🗓️ מועדים מוצעים - בחר את המתאימים לך:</h4>
              ${proposedDatesHTML}
            </div>
            
            <div style="background: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <strong>⏰ תזכורת חשובה:</strong> אנא הגב בהקדם כדי שנוכל לקבע את הישיבה במועד המתאים לכולם.
            </div>
            
            <div style="text-align: center;">
              <a href="${invitationLink}" class="cta-button">
                ✅ לחץ כאן לבחירת מועדים
              </a>
            </div>
            
            <p style="font-size: 14px; color: #64748b; margin-top: 20px;">
              אם הקישור לא עובד, העתק והדבק את הכתובת הבאה בדפדפן:<br>
              <code style="background: #f1f5f9; padding: 5px; border-radius: 4px; font-size: 12px;">
                ${invitationLink}
              </code>
            </p>
          </div>
          
          <div class="footer">
            <p><strong>מיטיז</strong> - המערכת החכמה לתיאום ישיבות</p>
            <p>מייל תזכורת אוטומטי</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailSubject = `🔔 תזכורת - הזמנה לישיבה: ${meeting.title}`;
    
    console.log(`📤 Sending reminder email to ${participant.email}`);
    
    try {
        const result = await SendEmail({
            to: participant.email.trim(),
            subject: emailSubject,
            body: emailHTML
        });
        
        console.log(`✅ Reminder email sent successfully to ${participant.email}:`, result);
        return result;
        
    } catch (error) {
        console.error(`❌ Failed to send reminder email to ${participant.email}:`, error);
        
        // ניסיון חוזר עם מייל פשוט
        try {
            console.log(`🔄 Retrying with simple email for ${participant.email}`);
            const simpleResult = await SendEmail({
                to: participant.email.trim(),
                subject: `תזכורת - ישיבה: ${meeting.title}`,
                body: `שלום ${participant.name}, זוהי תזכורת לישיבה "${meeting.title}" שאליה הוזמנת. אנא בחר מועדים: ${invitationLink}`
            });
            console.log(`✅ Simple reminder sent to ${participant.email}`);
            return simpleResult;
        } catch (retryError) {
            console.error(`❌ Retry failed for ${participant.email}:`, retryError);
            throw new Error(`נכשל גם בניסיון השני: ${retryError.message}`);
        }
    }
  };

  const sendInternalNotificationEmail = async (meeting, participant) => {
    const dashboardLink = `${window.location.origin}${createPageUrl("MyMeetings")}`;
    
    const emailHTML = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ישיבה חדשה - מיטיז</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; direction: rtl; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px 20px; text-align: center; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .content { padding: 30px 20px; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white !important; text-decoration: none; padding: 15px 30px; border-radius: 12px; font-weight: bold; margin: 20px 0; font-size: 16px; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;}
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔔 מיטיז</div>
            <h1 style="margin: 0;">נוספת לישיבה חדשה</h1>
          </div>
          <div class="content">
            <h2 style="color: #333;">שלום ${participant.name},</h2>
            <p style="font-size: 16px; line-height: 1.5; color: #555;">
              נוספת כמשתתף לישיבה: <strong>${meeting.title}</strong>.
            </p>
            <p style="font-size: 16px; line-height: 1.5; color: #555;">
              אנא בדוק את פרטי הישיבה וסמן את זמינותך במערכת מיטיז.
            </p>
            <div style="text-align: center;">
              <a href="${dashboardLink}" class="cta-button">
                ✅ עבור לישיבות שלי
              </a>
            </div>
            <p style="font-size: 14px; color: #777; text-align: center; margin-top: 20px;">
              תודה רבה על שיתוף הפעולה!
            </p>
          </div>
          <div class="footer">
            <p><strong>מיטיז</strong> - המערכת החכמה לתיאום ישיבות</p>
            <p>שליחה אוטומטית ע"י מיטיז - אין להשיב למייל זה.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await SendEmail({
      to: participant.email,
      subject: `🔔 נוספת לישיבה: ${meeting.title}`,
      body: emailHTML
    });
  };

  const sendCalendarInvitation = async (meetingData, participant, finalDate) => {
    const meetingDate = new Date(finalDate);
    const endDate = new Date(meetingDate.getTime() + (meetingData.duration_minutes * 60000));
    
    // יצירת קובץ ICS לזימון יומן
    const formatDateForICS = (date) => {
      // Formats date to YYYYMMDDTHHMMSSZ for ICS, removing milliseconds
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//מיטיז//Meeting Scheduler//HE
BEGIN:VEVENT
UID:${meetingData.id}-${participant.email}@meetiz.com
DTSTAMP:${formatDateForICS(new Date())}
DTSTART:${formatDateForICS(meetingDate)}
DTEND:${formatDateForICS(endDate)}
SUMMARY:${meetingData.title}
DESCRIPTION:${meetingData.description || 'ישיבה שנקבעה דרך מיטיז'}
LOCATION:${meetingData.location || ''}
ORGANIZER:mailto:${meetingData.created_by}
ATTENDEE:mailto:${participant.email}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const emailHTML = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>הישיבה אושרה - זימון ליומן</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background-color: #f8fafc; 
            margin: 0; 
            padding: 20px; 
            direction: rtl;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); 
            color: white; 
            padding: 30px 20px; 
            text-align: center;
          }
          .logo { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 10px;
          }
          .content { 
            padding: 30px 20px;
          }
          .meeting-info { 
            background: #f0fdf4; 
            border: 1px solid #bbf7d0; 
            border-radius: 12px; 
            padding: 20px; 
            margin: 20px 0;
          }
          .meeting-title { 
            font-size: 20px; 
            font-weight: bold; 
            color: #15803d; 
            margin-bottom: 15px;
          }
          .detail-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 10px; 
            padding-bottom: 8px; 
            border-bottom: 1px solid #dcfce7;
          }
          .detail-row:last-child { 
            border-bottom: none; 
            margin-bottom: 0;
          }
          .label { 
            font-weight: bold; 
            color: #15803d;
          }
          .value { 
            color: #166534;
          }
          .calendar-section { 
            background: #fffbeb; 
            border: 1px solid #fed7aa; 
            border-radius: 8px; 
            padding: 15px; 
            margin: 15px 0; 
            text-align: center;
          }
          .add-to-calendar { 
            display: inline-block; 
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
            color: white !important; 
            text-decoration: none; 
            padding: 12px 24px; 
            border-radius: 8px; 
            font-weight: bold; 
            margin: 10px 5px;
            font-size: 14px;
          }
          .footer { 
            background: #f8fafc; 
            padding: 20px; 
            text-align: center; 
            font-size: 12px; 
            color: #64748b; 
            border-top: 1px solid #e2e8f0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">✅ מיטיז</div>
            <h2 style="margin: 0;">הישיבה אושרה!</h2>
          </div>

          <div class="content">
            <p style="font-size: 18px; color: #15803d; font-weight: bold; text-align: center;">
              🎉 מעולה! הישיבה נקבעה סופית
            </p>

            <div class="meeting-info">
              <div class="meeting-title">📅 ${meetingData.title}</div>
              
              <div class="detail-row">
                <span class="label">תאריך ושעה:</span>
                <span class="value">${format(meetingDate, "EEEE, d MMMM yyyy 'בשעה' HH:mm", { locale: he })}</span>
              </div>

              <div class="detail-row">
                <span class="label">משך:</span>
                <span class="value">${meetingData.duration_minutes} דקות</span>
              </div>

              ${meetingData.modality === 'physical' && participant.travel_time_minutes > 0 ? `
                <div class="detail-row">
                  <span class="label">זמן נסיעה:</span>
                  <span class="value">${participant.travel_time_minutes} דקות (לכל כיוון)</span>
                </div>
              ` : ''}

              ${meetingData.location ? `
                <div class="detail-row">
                  <span class="label">מיקום:</span>
                  <span class="value">${meetingData.location}</span>
                </div>
              ` : ''}

              ${meetingData.description ? `
                <div class="detail-row">
                  <span class="label">תיאור:</span>
                  <span class="value">${meetingData.description}</span>
                </div>
              ` : ''}
            </div>

            <div class="calendar-section">
              <h3 style="color: #92400e; margin-bottom: 10px;">📲 הוסף ליומן שלך</h3>
              <p style="color: #92400e; font-size: 14px; margin-bottom: 15px;">
                לחץ על הקישורים להוספת האירוע ליומן שלך:
              </p>
              
              <a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(meetingData.title)}&dates=${formatDateForICS(meetingDate).replace(/Z$/, '')}/${formatDateForICS(endDate).replace(/Z$/, '')}&details=${encodeURIComponent(meetingData.description || 'ישיבה שנקבעה דרך מיטיז')}&location=${encodeURIComponent(meetingData.location || '')}" 
                 class="add-to-calendar" target="_blank" rel="noopener noreferrer">
                📅 Google Calendar
              </a>
              
              <a href="https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(meetingData.title)}&startdt=${meetingDate.toISOString()}&enddt=${endDate.toISOString()}&body=${encodeURIComponent(meetingData.description || 'ישיבה שנקבעה דרך מיטיז')}&location=${encodeURIComponent(meetingData.location || '')}" 
                 class="add-to-calendar" target="_blank" rel="noopener noreferrer">
                📧 Outlook
              </a>
            </div>

            <div style="background: #f1f5f9; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="color: #1e293b; margin: 0; font-size: 14px;">
                <strong>💡 טיפ:</strong> מומלץ להוסיף את האירוע ליומן שלך כדי לא לשכוח!
              </p>
            </div>
          </div>

          <div class="footer">
            <p><strong>מיטיז</strong> - המערכת החכמה לתיאום ישיבות</p>
            <p>תודה שבחרת במיטיז לתיאום הישיבות שלך</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // שליחת המייל עם זימון היומן
    await SendEmail({
      to: participant.email,
      subject: `✅ הישיבה "${meetingData.title}" אושרה - ${format(meetingDate, "d/M/yyyy HH:mm", { locale: he })}`,
      body: emailHTML
    });
  };

  const confirmMeeting = async () => {
    if (!selectedFinalDate) return;
    
    setIsConfirming(true);
    try {
      // עדכון הישיבה לסטטוס מאושר
      await Meeting.update(meeting.id, {
        status: "confirmed",
        final_date: selectedFinalDate
      });
      
      // יצירת נוטיפקציות לכל המשתתפים
      for (const participant of meeting.participants) {
        // Only send notifications/calendar invites to participants who didn't decline
        const response = responses.find(r => r.participant_email === participant.email);
        if (!response || response.status !== 'declined') {
          await Notification.create({
            user_email: participant.email,
            meeting_id: meeting.id,
            type: "meeting_confirmed",
            title: `הישיבה "${meeting.title}" אושרה`,
            message: `הישיבה נקבעה ל-${format(new Date(selectedFinalDate), "EEEE, d MMMM yyyy 'בשעה' HH:mm", { locale: he })}`,
            organization_id: meeting.organization_id
          });

          // שליחת מיילי אישור עם זימון ליומן לכל המשתתפים שלא סירבו
          try {
            await sendCalendarInvitation(meeting, participant, selectedFinalDate);
          } catch (emailError) {
            console.error(`Failed to send calendar invitation to ${participant.email}:`, emailError);
            // Decide if you want to break or continue for other participants
          }
        }
      }

      setShowSuccessDialog(true); // Open success dialog
      loadMeetingData(); // רענון הנתונים
    } catch (error) {
      console.error("Error confirming meeting:", error);
      alert("אירעה שגיאה באישור הישיבה. נסה שוב.");
    }
    setIsConfirming(false);
  };

  const getDateResponseCount = (datetime) => {
    return responses.filter(r => r.status !== 'declined' && r.available_dates.includes(datetime)).length;
  };

  const getRespondersForDate = (datetime) => {
    return responses.filter(r => r.status !== 'declined' && r.available_dates.includes(datetime))
      .map(r => ({ name: r.participant_name, email: r.participant_email }));
  };

  const getBestDates = () => {
    const dateCounts = meeting.proposed_dates.map(date => ({
      ...date,
      responseCount: getDateResponseCount(date.datetime),
      responders: getRespondersForDate(date.datetime)
    })).sort((a, b) => b.responseCount - a.responseCount);
    
    return dateCounts;
  };

  const duplicateMeeting = () => {
    const meetingData = {
      title: `${meeting.title} - עותק`,
      description: meeting.description || '',
      location: meeting.location || '',
      duration_minutes: meeting.duration_minutes,
      participants: meeting.participants || [],
      proposed_dates: [],
      meeting_type: meeting.meeting_type || 'external'
    };
    
    localStorage.setItem('duplicatedMeetingData', JSON.stringify(meetingData));
    navigate(`${createPageUrl("CreateMeeting")}?duplicate=true`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!meeting) return null;

  const bestDates = getBestDates();
  // Filter out declined responses from the total count for accurate response rate calculation
  const effectiveResponsesCount = responses.filter(r => r.status !== 'declined').length;
  const totalParticipants = meeting.participants?.length || 0;
  const responseRate = totalParticipants > 0 ? (effectiveResponsesCount / totalParticipants) * 100 : 0;
  const maxResponses = bestDates.length > 0 ? bestDates[0].responseCount : 0;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("MyMeetings"))}
            className="rounded-full"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              {meeting.title}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <Badge className={statusLabels[meeting.status].color}>
                {statusLabels[meeting.status].label}
              </Badge>
              <span className="text-slate-600">
                {effectiveResponsesCount} מתוך {totalParticipants} השיבו
              </span>
            </div>
          </div>
          
          {/* כפתור שכפול */}
          <Button
            variant="outline"
            onClick={duplicateMeeting}
            className="rounded-xl"
          >
            <CopyIcon className="w-4 h-4 ml-2" />
            שכפל ישיבה
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* עמודה ימנית - פרטי הישיבה */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* סטטיסטיקות */}
            <Card className="meetiz-card">
              <CardHeader>
                <CardTitle>סטטיסטיקות תגובות</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{effectiveResponsesCount}</div>
                    <div className="text-sm text-slate-600">תגובות התקבלו</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{Math.round(responseRate)}%</div>
                    <div className="text-sm text-slate-600">אחוז תגובה</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{bestDates[0]?.responseCount || 0}</div>
                    <div className="text-sm text-slate-600">מועד פופולרי</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* מועדים מוצעים - תצוגה משופרת */}
            <Card className="meetiz-card">
              <CardHeader>
                <CardTitle>מועדים מוצעים ותגובות</CardTitle>
                {maxResponses > 0 && (
                  <p className="text-sm text-slate-600">
                    המועד הפופולרי ביותר: {maxResponses} תגובות מתוך {effectiveResponsesCount}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {bestDates.map((date, index) => {
                  const isTopChoice = date.responseCount === maxResponses && maxResponses > 0;
                  const isSecondChoice = date.responseCount === maxResponses - 1 && maxResponses > 1;
                  
                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isTopChoice 
                          ? 'border-green-300 bg-green-50 shadow-md' 
                          : isSecondChoice
                          ? 'border-blue-200 bg-blue-50'
                          : date.responseCount > 0 
                          ? 'border-slate-200 bg-slate-50' 
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-medium text-slate-900">{date.date_label}</p>
                            {isTopChoice && (
                              <Badge className="bg-green-600 text-white text-xs">
                                🏆 מועד מוביל
                              </Badge>
                            )}
                            {isSecondChoice && (
                              <Badge className="bg-blue-600 text-white text-xs">
                                🥈 אלטרנטיבה טובה
                              </Badge>
                            )}
                          </div>
                          
                          {/* פרטי התגובות */}
                          <div className="space-y-2">
                            <Badge 
                              variant={date.responseCount > 0 ? "default" : "secondary"}
                              className={isTopChoice ? "bg-green-700" : isSecondChoice ? "bg-blue-700" : ""}
                            >
                              {date.responseCount}/{effectiveResponsesCount} תגובות
                            </Badge>
                            {effectiveResponsesCount > 0 && (
                              <span className="text-sm text-slate-600">
                                ({Math.round((date.responseCount / effectiveResponsesCount) * 100)}%)
                              </span>
                            )}
                            
                            {/* רשימת מגיבים */}
                            {date.responders.length > 0 && (
                              <div className="mt-3 p-3 bg-white/70 rounded-lg border border-slate-100">
                                <p className="text-xs font-semibold text-slate-700 mb-2">
                                  מגיבים זמינים:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {date.responders.map((responder, idx) => (
                                    <div 
                                      key={idx}
                                      className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border text-xs"
                                    >
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span className="font-medium">{responder.name}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* כפתור בחירה */}
                        <div className="flex flex-col items-end gap-2">
                          {meeting.status === 'sent' && date.responseCount > 0 && (
                            <Button
                              size="sm"
                              onClick={() => setSelectedFinalDate(date.datetime)}
                              variant={selectedFinalDate === date.datetime ? "default" : "outline"}
                              className={
                                selectedFinalDate === date.datetime 
                                  ? "bg-green-600 hover:bg-green-700 text-white" 
                                  : isTopChoice 
                                  ? "border-green-300 text-green-700 hover:bg-green-50"
                                  : ""
                              }
                            >
                              {selectedFinalDate === date.datetime ? "✓ נבחר" : "בחר מועד זה"}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* אינדיקטור חזותי */}
                      {date.responseCount > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                            <span>רמת תמיכה:</span>
                            <span className="font-medium">
                              {date.responseCount === maxResponses && maxResponses > 0 ? 'גבוהה ביותר' :
                               date.responseCount >= maxResponses - 1 && maxResponses > 1 ? 'גבוהה' :
                               date.responseCount > 0 ? 'בינונית' : 'נמוכה'}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                isTopChoice ? 'bg-green-500' : 
                                isSecondChoice ? 'bg-blue-500' : 
                                'bg-slate-400'
                              }`}
                              style={{ 
                                width: `${effectiveResponsesCount > 0 ? (date.responseCount / effectiveResponsesCount) * 100 : 0}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* אישור ישיבה */}
            {meeting.status === 'sent' && selectedFinalDate && (
              <Card className="meetiz-card bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-green-900">מוכן לאישור הישיבה?</h3>
                      <p className="text-green-700">
                        המועד שנבחר: {selectedFinalDate && format(new Date(selectedFinalDate), "EEEE, d MMMM yyyy 'בשעה' HH:mm", { locale: he })}
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowConfirmationDialog(true)}
                      disabled={isConfirming}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      אשר ישיבה
                      <CalendarCheck className="w-4 h-4 mr-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* תגובות משתתפים */}
            <Card className="meetiz-card">
              <CardHeader>
                <CardTitle>תגובות משתתפים</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {responses.map((response, index) => {
                  const isDeclined = response.status === 'declined';
                  return (
                    <div key={index} className={`border rounded-lg p-4 ${isDeclined ? 'bg-red-50 border-red-200' : ''}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${isDeclined ? 'bg-red-100' : 'bg-blue-100'} rounded-full flex items-center justify-center`}>
                            <UserIcon className={`w-5 h-5 ${isDeclined ? 'text-red-600' : 'text-blue-600'}`} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">{response.participant_name}</h4>
                            <p className="text-sm text-slate-600">{response.participant_email}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {isDeclined ? (
                            <Badge className="bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 ml-1" />
                              סירב/ה
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800">
                              {response.available_dates.length} מועדים
                            </Badge>
                          )}
                          {!isDeclined && response.travel_time_minutes > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <Car className="w-3 h-3 ml-1" />
                              {response.travel_time_minutes} דק׳ נסיעה
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {!isDeclined ? (
                        <>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-slate-700">מועדים זמינים:</p>
                            <div className="flex flex-wrap gap-2">
                              {response.available_dates.map((date, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {format(new Date(date), "d/M HH:mm")}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {response.travel_time_minutes > 0 && (
                            <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                              <p className="text-sm text-green-800">
                                <Car className="w-4 h-4 inline ml-2" />
                                זמן נסיעה: {response.travel_time_minutes} דקות לכל כיוון
                                <br />
                                <span className="font-medium">
                                  סה"כ זמן לשריין עבורו: {meeting.duration_minutes + (response.travel_time_minutes * 2)} דקות
                                </span>
                              </p>
                            </div>
                          )}

                          {response.notes && (
                            <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                              <p className="text-sm text-slate-600">
                                <MessageSquare className="w-4 h-4 inline mr-2" />
                                {response.notes}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg">
                          <p className="text-sm font-medium text-red-800 mb-1">סיבת הסירוב:</p>
                          <p className="text-sm text-red-700">{response.notes}</p>
                        </div>
                      )}
                      
                      <div className="mt-3 text-xs text-slate-500">
                        הגיב {formatDistanceToNow(new Date(response.created_date), { 
                          addSuffix: true, 
                          locale: he 
                        })} ({format(new Date(response.created_date), "d MMMM yyyy 'בשעה' HH:mm", { locale: he })})
                      </div>
                    </div>
                  );
                })}
                
                {responses.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                    <p>עדיין לא התקבלו תגובות</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* עמודה שמאלית - פרטי צד */}
          <div className="space-y-6">
            {/* פרטי הישיבה */}
            <Card className="meetiz-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  פרטי הישיבה
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {meeting.description && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">תיאור:</p>
                    <p className="text-slate-600">{meeting.description}</p>
                  </div>
                )}
                
                <div className="space-y-3 text-sm">
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
                  {/* Note: This general travel time display is based on meeting.travel_time_minutes,
                      while the detailed one in responses card is per-participant.
                      Keeping this general one as it might still be relevant for overall meeting setup. */}
                  {meeting.modality === 'physical' && meeting.travel_time_minutes > 0 && (
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-slate-500" />
                      <span>תוספת נסיעה: {meeting.travel_time_minutes} דקות (לכל כיוון)</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span>{meeting.participants?.length || 0} משתתפים</span>
                  </div>
                </div>

                {meeting.final_date && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">מועד סופי:</span>
                    </div>
                    <p className="text-green-700 mt-1">
                      {format(new Date(meeting.final_date), "EEEE, d MMMM yyyy 'בשעה' HH:mm", { locale: he })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* משתתפים */}
            <Card className="meetiz-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    משתתפים
                  </div>
                  {meeting.status !== 'confirmed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingParticipants(true)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      ערוך
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {meeting.participants?.map((participant, index) => {
                    const response = responses.find(r => r.participant_email === participant.email);
                    const hasResponded = !!response;
                    const isDeclined = response?.status === 'declined';

                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          {participant.type === 'internal' ? 
                            <Users className="w-4 h-4 text-purple-600" /> : 
                            <Building2 className="w-4 h-4 text-green-600" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{participant.name}</p>
                          <p className="text-sm text-slate-600 truncate">{participant.email}</p>
                        </div>
                        {(() => {
                            if (isDeclined) {
                                return <Badge className="bg-red-100 text-red-800 shrink-0"><XCircle className="w-3 h-3 ml-1" /> סירב</Badge>;
                            } else if (hasResponded) {
                                return <Badge className="bg-green-100 text-green-800 shrink-0"><CheckCircle className="w-3 h-3 ml-1" /> הגיב</Badge>;
                            } else if (participant.reminders_sent > 0) {
                                return <Badge className="bg-orange-100 text-orange-800 shrink-0"><Bell className="w-3 h-3 ml-1" /> {participant.reminders_sent} תזכורות</Badge>;
                            } else {
                                return <Badge variant="outline" className="shrink-0"><Mail className="w-3 h-3 ml-1" /> הוזמן</Badge>;
                            }
                        })()}
                      </div>
                    );
                  }) || <p className="text-slate-500">אין משתתפים</p>}
                </div>

                {meeting.status !== 'confirmed' && (effectiveResponsesCount < (meeting.participants?.length || 0)) && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <Button
                      onClick={sendReminders}
                      disabled={isSending}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      {isSending ? "שולח..." : "שלח תזכורות למי שטרם הגיב"}
                      <Send className="w-4 h-4 mr-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dialog עריכת משתתפים */}
        <Dialog open={isEditingParticipants} onOpenChange={setIsEditingParticipants}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>עריכת משתתפים</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {/* רשימת משתתפים נוכחיים */}
              <div className="space-y-2">
                <Label>משתתפים נוכחיים:</Label>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {editedParticipants.length > 0 ? (
                    editedParticipants.map((participant, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium">{participant.name}</p>
                          <p className="text-sm text-slate-600">{participant.email}</p>
                          {participant.company && <p className="text-xs text-slate-500">{participant.company}</p>}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeParticipant(participant.email)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm">אין משתתפים ברשימה</p>
                  )}
                </div>
              </div>

              {/* הוספת משתתף חדש */}
              <div className="border-t pt-4">
                <Label htmlFor="newParticipantName">הוסף משתתף חדש:</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                  <Input
                    id="newParticipantName"
                    placeholder="שם מלא"
                    value={newParticipantName}
                    onChange={(e) => setNewParticipantName(e.target.value)}
                  />
                  <Input
                    placeholder="אימייל"
                    type="email"
                    value={newParticipantEmail}
                    onChange={(e) => setNewParticipantEmail(e.target.value)}
                  />
                  <Input
                    placeholder="חברה (אופציונלי)"
                    value={newParticipantCompany}
                    onChange={(e) => setNewParticipantCompany(e.target.value)}
                  />
                </div>
                <Button
                  onClick={addNewParticipant}
                  disabled={!newParticipantName || !newParticipantEmail || !/\S+@\S+\.\S+/.test(newParticipantEmail)}
                  className="mt-3"
                  size="sm"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  הוסף משתתף
                </Button>
              </div>

              {/* הוספה מאנשי קשר */}
              <div className="border-t pt-4">
                <Label>או בחר מאנשי קשר קיימים:</Label>
                <div className="max-h-32 overflow-y-auto mt-2 space-y-1 border rounded-md p-2 bg-slate-50">
                  {contacts.length > 0 ? (
                    contacts.filter(contact => !editedParticipants.some(p => p.email === contact.email)).map(contact => (
                      <button
                        key={contact.id}
                        onClick={() => addParticipant({ 
                          name: contact.name, 
                          email: contact.email, 
                          type: 'external',
                          company: contact.company 
                        })}
                        className="w-full text-right p-2 hover:bg-slate-100 rounded text-sm"
                      >
                        {contact.name} - {contact.email} ({contact.company || 'ללא חברה'})
                      </button>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm">אין אנשי קשר זמינים.</p>
                  )}
                </div>
              </div>

              {/* הוספה מחברי צוות */}
              <div className="border-t pt-4">
                <Label>או בחר מחברי צוות:</Label>
                <div className="max-h-32 overflow-y-auto mt-2 space-y-1 border rounded-md p-2 bg-slate-50">
                  {teamMembers.length > 0 ? (
                    teamMembers.filter(member => !editedParticipants.some(p => p.email === member.user_email)).map(member => (
                      <button
                        key={member.id}
                        onClick={() => addParticipant({ 
                          name: member.user_name, 
                          email: member.user_email, 
                          type: 'internal',
                          company: meeting?.organization_id
                        })}
                        className="w-full text-right p-2 hover:bg-slate-100 rounded text-sm"
                      >
                        {member.user_name} - {member.user_email} (צוות)
                      </button>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm">אין חברי צוות זמינים.</p>
                  )}
                </div>
              </div>
            </div>

            {/* כפתורים תמיד בתחתית */}
            <div className="flex justify-end gap-3 pt-4 border-t bg-white">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditingParticipants(false);
                  setEditedParticipants(meeting.participants || []);
                }}
              >
                ביטול
              </Button>
              <Button onClick={saveParticipants}>
                שמור שינויים
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog אישור קביעת מועד */}
        <Dialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <CalendarCheck className="w-8 h-8 text-blue-600" />
                </div>
                אישור קביעת מועד
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-1">
              <div className="text-center space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">המועד שנבחר:</h4>
                  <p className="text-blue-800 text-lg font-medium">
                    {selectedFinalDate && format(new Date(selectedFinalDate), "EEEE, d MMMM yyyy", { locale: he })}
                  </p>
                  <p className="text-blue-700">
                    {selectedFinalDate && format(new Date(selectedFinalDate), "HH:mm")}
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-right">
                  <h4 className="font-semibold text-amber-800 mb-2">מה יקרה כעת:</h4>
                  <div className="text-sm text-amber-700 space-y-1">
                    <p>✅ הישיבה תקבע רשמית במועד זה</p>
                    <p>📧 זימונים ליומן יישלחו לכל המשתתפים שאישרו זמינות</p>
                    <p>📱 הודעות אישור יישלחו במערכת</p>
                    <p>🔔 נוטיפקציות יישלחו במערכת</p>
                  </div>
                </div>

                <div className="text-sm text-slate-600">
                  <strong>משתתפים שיקבלו זימונים:</strong>
                  <div className="mt-2 max-h-32 overflow-y-auto space-y-1 border rounded-md p-2 bg-slate-50">
                    {meeting.participants?.filter(p => {
                      const res = responses.find(r => r.participant_email === p.email);
                      return !res || res.status !== 'declined';
                    }).map((participant, index) => (
                      <div key={index} className="flex items-center justify-between bg-white rounded px-3 py-2 shadow-sm">
                        <span className="font-medium">{participant.name}</span>
                        <span className="text-xs text-slate-500 truncate ml-2">{participant.email}</span>
                      </div>
                    ))}
                    {meeting.participants?.filter(p => {
                      const res = responses.find(r => r.participant_email === p.email);
                      return res && res.status === 'declined';
                    }).length > 0 && (
                      <div className="text-red-600 text-xs mt-2">
                        (משתתפים שסירבו לא יקבלו זימון)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4 border-t bg-white">
              <Button 
                onClick={() => setShowConfirmationDialog(false)}
                variant="outline"
                className="flex-1"
              >
                ביטל
              </Button>
              <Button 
                onClick={() => {
                  setShowConfirmationDialog(false);
                  confirmMeeting();
                }}
                disabled={isConfirming}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {isConfirming ? "מקבע..." : "קבע ושלח זימונים"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog הצלחה */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                הישיבה אושרה בהצלחה!
              </DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-4">
              <p className="text-slate-600">
                הישיבה נקבעה ל-{selectedFinalDate && format(new Date(selectedFinalDate), "EEEE, d MMMM yyyy 'בשעה' HH:mm", { locale: he })}
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  ✅ זימונים ליומן נשלחו לכל המשתתפים<br/>
                  📧 הודעות אישור נשלחו במייל<br/>
                  🔔 נוטיפקציות נשלחו במערכת
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowSuccessDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  המשך לנהל
                </Button>
                <Button 
                  onClick={() => navigate(createPageUrl("Dashboard"))}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  חזור לבית
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

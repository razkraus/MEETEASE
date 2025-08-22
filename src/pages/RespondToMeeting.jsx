import { useState, useEffect } from "react";
import { Meeting, Response, Contact, Notification } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Clock, Users, CheckCircle, Briefcase, Phone, Building2, Car, AlertTriangle, XCircle, Edit, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { SendEmail } from "@/api/integrations";
import { createPageUrl } from "@/utils";

export default function RespondToMeeting() {
  const [meeting, setMeeting] = useState(null);
  const [selectedDates, setSelectedDates] = useState([]);
  const [participantName, setParticipantName] = useState("");
  const [participantEmail, setParticipantEmail] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [businessField, setBusinessField] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [travelTimeMinutes, setTravelTimeMinutes] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [existingContact, setExistingContact] = useState(null);
  const [isDeclining, setIsDeclining] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [existingResponse, setExistingResponse] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadMeeting();
  }, []);

  const loadMeeting = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const meetingId = urlParams.get('meeting');
    const invitationCode = urlParams.get('code');
    const participantEmailFromUrl = urlParams.get('email');

    if (!meetingId || !invitationCode) {
      setIsLoading(false);
      return;
    }

    try {
      const meetings = await Meeting.filter({
        id: meetingId,
        invitation_code: invitationCode
      });

      if (meetings.length > 0) {
        const meetingData = meetings[0];
        setMeeting(meetingData);

        // Check if user already responded
        if (participantEmailFromUrl) {
          const existingResponses = await Response.filter({
            meeting_id: meetingId,
            participant_email: participantEmailFromUrl
          });

          if (existingResponses.length > 0) {
            const response = existingResponses[0];
            setExistingResponse(response);

            // Pre-fill form with existing response data
            setParticipantName(response.participant_name || "");
            setParticipantEmail(response.participant_email || "");
            setSelectedDates(response.available_dates || []);
            setTravelTimeMinutes(response.travel_time_minutes || 0);
            setNotes(response.notes || "");

            // If it's a declined response, set up decline mode
            if (response.status === 'declined') {
              setIsDeclining(true);
              setDeclineReason(response.notes || "");
            }

            setIsUpdating(true);
          }

          // Load contact data if available
          const loadedFromContact = await loadExistingContactData(participantEmailFromUrl, meetingData.organization_id);
          if (!loadedFromContact && !existingResponse) {
            // If contact doesn't exist and no previous response, pre-fill from meeting participant data
            const participantInMeeting = meetingData.participants?.find(p => p.email === participantEmailFromUrl);
            if (participantInMeeting) {
              setParticipantName(participantInMeeting.name || "");
              setCompany(participantInMeeting.company || "");
            }
            setParticipantEmail(participantEmailFromUrl);
          }
        }
      }
    } catch (error) {
      console.error("Error loading meeting:", error);
    }
    setIsLoading(false);
  };

  const loadExistingContactData = async (email, organizationId) => {
    try {
      const contacts = await Contact.filter({
        email: email,
        organization_id: organizationId
      });

      if (contacts.length > 0) {
        const contact = contacts[0];
        setExistingContact(contact);

        // Only pre-fill if we don't have existing response data
        if (!existingResponse) {
          setParticipantName(contact.name || "");
          setParticipantEmail(contact.email || "");
          setCompany(contact.company || "");
          setTitle(contact.title || "");
          setBusinessField(contact.business_field || "");
          setPhone(contact.phone || "");
        }
        return true;
      } else {
        setParticipantEmail(email);
        return false;
      }
    } catch (error) {
      console.error("Error loading existing contact:", error);
      return false;
    }
  };

  const handleDateToggle = (datetime) => {
    setSelectedDates(prev =>
      prev.includes(datetime)
        ? prev.filter(d => d !== datetime)
        : [...prev, datetime]
    );
  };

  const handleSubmit = async () => {
    if (!participantName || !participantEmail || selectedDates.length === 0) {
      alert("אנא מלא את השדות הנדרשים ובחר לפחות מועד אחד.");
      return;
    }

    if (!existingContact && (!company || !title || !phone)) {
        alert("אנא מלא את כל שדות החובה: שם מלא, אימייל, חברה, תפקיד, וטלפון.");
        return;
    }

    setIsSubmitting(true);
    try {
      const responseData = {
        meeting_id: meeting.id,
        participant_email: participantEmail,
        participant_name: participantName,
        available_dates: selectedDates,
        travel_time_minutes: travelTimeMinutes,
        notes: notes,
        status: 'available'
      };

      if (existingResponse) {
        // Update existing response
        await Response.update(existingResponse.id, responseData);
      } else {
        // Create new response
        await Response.create(responseData);
      }

      // Handle contact creation/update
      let contactCreated = false;
      if (existingContact) {
        await Contact.update(existingContact.id, {
          name: participantName,
          company: company || existingContact.company,
          title: title || existingContact.title,
          business_field: businessField || existingContact.business_field,
          phone: phone || existingContact.phone,
          total_meetings_invited: existingResponse ? existingContact.total_meetings_invited : (existingContact.total_meetings_invited || 0) + 1
        });
      } else if (!existingResponse) {
        await Contact.create({
          name: participantName,
          email: participantEmail,
          company: company,
          title: title,
          business_field: businessField,
          phone: phone,
          organization_id: meeting.organization_id,
          first_invited_date: new Date().toISOString(),
          total_meetings_invited: 1
        });
        contactCreated = true;
      }

      // Update participant status in Meeting entity
      if (!existingResponse) {
        const meetingToUpdate = await Meeting.get(meeting.id);
        if (meetingToUpdate && meetingToUpdate.participants) {
          const updatedParticipants = meetingToUpdate.participants.map(p =>
            p.email === participantEmail ? { ...p, status: 'responded' } : p
          );
          await Meeting.update(meeting.id, { participants: updatedParticipants });
        }
      }

      // Send notification
      await Notification.create({
        user_email: meeting.created_by,
        meeting_id: meeting.id,
        type: "new_response",
        title: `${participantName} ${existingResponse ? 'עדכן את התגובה' : 'הגיב'} לישיבה "${meeting.title}"`,
        message: `${existingResponse ? 'עדכן עם' : 'הגיב עם'} ${selectedDates.length} מועדים זמינים`,
        participant_name: participantName,
        organization_id: meeting.organization_id
      });

      await sendNotificationToOrganizer(meeting, {
        name: participantName,
        email: participantEmail,
        company: company,
        title: title,
        businessField: businessField,
        phone: phone,
        selectedDates: selectedDates,
        travelTimeMinutes: travelTimeMinutes,
        notes: notes,
        isNewContact: contactCreated,
        isUpdate: !!existingResponse
      });

      setHasSubmitted(true);
      setSubmissionStatus('approved');
    } catch (error) {
      console.error("Error submitting response:", error);
      alert("אירעה שגיאה בשליחת התגובה. נסה שוב.");
    }
    setIsSubmitting(false);
  };

  const handleDeclineSubmit = async () => {
    if (!declineReason) {
      alert("אנא הכנס סיבה לסירוב.");
      return;
    }
    if (!participantName || !participantEmail) {
      alert("אנא ודא שהשם והאימייל שלך מולאו כראוי.");
      return;
    }

    setIsSubmitting(true);
    try {
      const responseData = {
        meeting_id: meeting.id,
        participant_email: participantEmail,
        participant_name: participantName,
        available_dates: [],
        notes: declineReason,
        status: 'declined'
      };

      if (existingResponse) {
        // Update existing response to declined
        await Response.update(existingResponse.id, responseData);
      } else {
        // Create new declined response
        await Response.create(responseData);
      }

      // Update participant status in Meeting entity if not already updated
      if (!existingResponse) {
        const meetingToUpdate = await Meeting.get(meeting.id);
        if (meetingToUpdate && meetingToUpdate.participants) {
          const updatedParticipants = meetingToUpdate.participants.map(p =>
            p.email === participantEmail ? { ...p, status: 'responded' } : p
          );
          await Meeting.update(meeting.id, { participants: updatedParticipants });
        }
      }

      // Notify the organizer about the decline
      await Notification.create({
        user_email: meeting.created_by,
        meeting_id: meeting.id,
        type: "new_response",
        title: `❌ ${participantName} ${existingResponse ? 'עדכן לסירוב' : 'סירב/ה'} להגיע לישיבה "${meeting.title}"`,
        message: `סיבה: ${declineReason}`,
        participant_name: participantName,
        organization_id: meeting.organization_id
      });

      await sendDeclineNotificationToOrganizer(meeting, {
        name: participantName,
        email: participantEmail,
        reason: declineReason,
        isUpdate: !!existingResponse
      });

      setHasSubmitted(true);
      setSubmissionStatus('declined');
    } catch (error) {
      console.error("Error submitting decline:", error);
      alert("אירעה שגיאה בשליחת הסירוב. נסה שוב.");
    }
    setIsSubmitting(false);
  };

  const sendDeclineNotificationToOrganizer = async (meeting, data) => {
    const dashboardLink = `${window.location.origin}${createPageUrl("MyMeetings")}`;

    const emailHTML = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <title>${data.isUpdate ? 'עדכון לסירוב' : 'סירוב להזמנה'} - מיטיז</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #f8fafc; padding: 20px; direction: rtl; }
          .container { max-width: 600px; margin: auto; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px 20px; text-align: center; }
          .content { padding: 30px; }
          .reason-box { background: #fee2e2; border: 1px solid #fca5a5; border-radius: 12px; padding: 20px; margin: 20px 0; }
          .cta-button { display: inline-block; background: #2563eb; color: white !important; text-decoration: none; padding: 15px 30px; border-radius: 12px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0; font-size: 24px;">❌ ${data.isUpdate ? 'עדכון לסירוב' : 'סירוב להזמנה'}</h1>
          </div>
          <div class="content">
            <h2 style="color: #b91c1c;">${data.name} ${data.isUpdate ? 'עדכן את התגובה לסירוב' : 'לא יוכל/תוכל להגיע לישיבה'}</h2>
            <p>${data.isUpdate ? 'התקבל עדכון תגובה לסירוב' : 'התקבל סירוב להזמנה'} לישיבה: <strong>"${meeting.title}"</strong>.</p>
            <div class="reason-box">
              <h4 style="color: #991b1b; margin-top:0;">סיבת הסירוב:</h4>
              <p style="color: #b91c1c; font-size: 16px;">${data.reason}</p>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${dashboardLink}" class="cta-button">צפה בפרטי הישיבה</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await SendEmail({
      to: meeting.created_by,
      subject: `❌ ${data.isUpdate ? 'עדכון לסירוב' : 'סירוב להזמנה'}: ${meeting.title} - ${data.name}`,
      body: emailHTML
    });
  };

  const sendNotificationToOrganizer = async (meeting, participantData) => {
    const dashboardLink = `${window.location.origin}${createPageUrl("MyMeetings")}`;

    const emailHTML = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${participantData.isUpdate ? 'עדכון תגובה' : 'תגובה חדשה'} לישיבה - מיטיז</title>
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
          .participant-info {
            background: #f1f5f9;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e2e8f0;
          }
          .info-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          .label {
            font-weight: bold;
            color: #1e293b;
          }
          .value {
            color: #64748b;
          }
          .dates-section {
            background: #fef3c7;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
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
            <div class="logo">${participantData.isUpdate ? '🔄' : '✅'} מיטיז</div>
            <h2 style="margin: 0;">${participantData.isUpdate ? 'תגובה עודכנה!' : 'תגובה חדשה התקבלה!'}</h2>
          </div>

          <div class="content">
            <h3 style="color: #1e293b; margin-bottom: 20px;">
              ${participantData.name} ${participantData.isUpdate ? 'עדכן את התגובה' : 'הגיב'} לישיבה "${meeting.title}"
            </h3>

            ${participantData.isUpdate ? `
              <div style="background: #e0f2fe; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; margin: 15px 0;">
                <p style="color: #0284c7; font-weight: bold; margin: 0;">
                  🔄 זהו עדכון לתגובה קיימת
                </p>
              </div>
            ` : ''}

            <div class="participant-info">
              <h4 style="color: #1e293b; margin-bottom: 15px;">פרטי המשתתף:</h4>

              <div class="info-row">
                <span class="label">שם מלא:</span>
                <span class="value">${participantData.name}</span>
              </div>

              <div class="info-row">
                <span class="label">אימייל:</span>
                <span class="value">${participantData.email}</span>
              </div>

              <div class="info-row">
                <span class="label">חברה:</span>
                <span class="value">${participantData.company}</span>
              </div>

              <div class="info-row">
                <span class="label">תפקיד:</span>
                <span class="value">${participantData.title}</span>
              </div>

              ${participantData.businessField ? `
                <div class="info-row">
                  <span class="label">תחום עיסוק:</span>
                  <span class="value">${participantData.businessField}</span>
                </div>
              ` : ''}

              <div class="info-row">
                <span class="label">טלפון:</span>
                <span class="value">${participantData.phone}</span>
              </div>

              ${participantData.travelTimeMinutes > 0 ? `
                <div class="info-row">
                  <span class="label">זמן נסיעה:</span>
                  <span class="value">${participantData.travelTimeMinutes} דקות (לכל כיוון)</span>
                </div>
              ` : ''}
            </div>

            <div class="dates-section">
              <h4 style="color: #92400e; margin-bottom: 10px;">המועדים שבחר:</h4>
              <ul style="margin: 0; padding-right: 20px; color: #92400e;">
                ${participantData.selectedDates.map(datetime =>
                  `<li>${format(new Date(datetime), "EEEE, d MMMM yyyy 'בשעה' HH:mm", { locale: he })}</li>`
                ).join('')}
              </ul>
            </div>

            ${participantData.travelTimeMinutes > 0 ? `
              <div style="background: #fef3c7; border: 1px solid #fed7aa; border-radius: 8px; padding: 15px; margin: 15px 0;">
                <h4 style="color: #92400e; margin-bottom: 10px;">🚗 מידע נסיעה:</h4>
                <p style="color: #92400e; margin: 0;">
                  המשתתף יצטרך ${participantData.travelTimeMinutes} דקות נסיעה לכל כיוון.
                  <br>
                  סה"כ זמן שיש לשריין עבורו: ${meeting.duration_minutes + (participantData.travelTimeMinutes * 2)} דקות.
                </p>
              </div>
            ` : ''}

            ${participantData.notes ? `
              <div style="background: #f8fafc; border-radius: 8px; padding: 15px; margin: 15px 0;">
                <h4 style="color: #1e293b; margin-bottom: 10px;">הערות:</h4>
                <p style="color: #64748b; margin: 0;">${participantData.notes}</p>
              </div>
            ` : ''}

            ${participantData.isNewContact ? `
              <div style="background: #dcfce7; border: 1px solid #16a34a; border-radius: 8px; padding: 15px; margin: 15px 0;">
                <p style="color: #15803d; font-weight: bold;">
                  🆕 איש קשר חדש נוסף למערכת!
                </p>
              </div>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardLink}" class="cta-button">
                צפה בכל התגובות במערכת
              </a>
            </div>
          </div>

          <div class="footer">
            <p><strong>מיטיז</strong> - המערכת החכמה לתיאום ישיבות</p>
            <p>מייל זה נשלח אוטומטית כשמישהו ${participantData.isUpdate ? 'מעדכן תגובה' : 'מגיב'} לישיבה שלך</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await SendEmail({
      to: meeting.created_by,
      subject: `🔔 ${participantData.isUpdate ? 'עדכון תגובה' : 'תגובה חדשה'} לישיבה: ${meeting.title} - ${participantData.name}`,
      body: emailHTML
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <Card className="meetiz-card max-w-md w-full text-center p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            הזמנה לא נמצאה
          </h2>
          <p className="text-slate-600">
            ההזמנה לישיבה לא נמצאה או שפגה תוקפה
          </p>
        </Card>
      </div>
    );
  }

  if (hasSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <Card className="meetiz-card max-w-md w-full text-center p-8">
          <div className={`w-16 h-16 mx-auto mb-6 ${submissionStatus === 'approved' ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center`}>
            {submissionStatus === 'approved' ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            {submissionStatus === 'approved' ?
              (isUpdating ? "התגובה עודכנה בהצלחה!" : "תודה על התגובה!") :
              (isUpdating ? "העדכון לסירוב נשלח" : "הסירוב נשלח")
            }
          </h2>
          <p className="text-slate-600 mb-6">
            {submissionStatus === 'approved'
              ? (isUpdating ? "התגובה המעודכנת שלך נרשמה בהצלחה. מזמין הישיבה יקבל עדכון." : "התגובה שלך נרשמה בהצלחה. מזמין הישיבה יקבע את המועד הסופי ויעדכן אותך.")
              : "מזמין הישיבה קיבל את הודעת הסירוב שלך."
            }
          </p>
        </Card>
      </div>
    );
  }

  const canSubmit = participantName && participantEmail && selectedDates.length > 0 && (existingContact || (company && title && phone));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4" dir="rtl">
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {isUpdating ? 'עדכון תגובה לישיבה' : 'הזמנה לישיבה'}
          </h1>
          <p className="text-slate-600">
            {isUpdating ? 'עדכן את המועדים שמתאימים לך' : 'אנא סמן את המועדים שמתאימים לך'}
          </p>
          {existingContact && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                ✅ הפרטים שלך נטענו אוטומטית. תוכל לעדכן מה שחסר או לשנות לפי הצורך.
              </p>
            </div>
          )}
          {isUpdating && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800 flex items-center gap-2">
                <Edit className="w-4 h-4" />
                אתה עורך תגובה קיימת. השינויים שלך יחליפו את התגובה הקודמת.
              </p>
            </div>
          )}
        </div>

        {/* Meeting Details */}
        <Card className="meetiz-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <Calendar className="w-6 h-6 text-blue-600" />
              {meeting.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {meeting.description && (
              <p className="text-slate-700">{meeting.description}</p>
            )}

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
                <span>{meeting.participants?.length || 0} משתתפים</span>
              </div>
              {meeting.modality === 'physical' && (
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-green-600" />
                  <span>ישיבה פיזית</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Response Form */}
        <Card className="meetiz-card">
          <CardHeader>
            <CardTitle>הפרטים שלך</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isDeclining ? (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">שם מלא *</Label>
                    <Input
                      id="name"
                      value={participantName}
                      onChange={(e) => setParticipantName(e.target.value)}
                      placeholder="השם שלך"
                      className="rounded-xl"
                      disabled={!!existingContact?.name}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">אימייל *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={participantEmail}
                      onChange={(e) => setParticipantEmail(e.target.value)}
                      placeholder="האימייל שלך"
                      className="rounded-xl"
                      disabled={!!participantEmail}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">חברה {!company && !existingContact?.company && "*"}</Label>
                    <Input
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="שם החברה"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">תפקיד {!title && !existingContact?.title && "*"}</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="התפקיד שלך"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessField">תחום עיסוק</Label>
                    <Input
                      id="businessField"
                      value={businessField}
                      onChange={(e) => setBusinessField(e.target.value)}
                      placeholder="תחום עיסוק החברה (אופציונלי)"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">טלפון {!phone && !existingContact?.phone && "*"}</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="מספר טלפון"
                      className="rounded-xl"
                    />
                  </div>
                </div>

                {/* זמן נסיעה - מוצג רק עבור ישיבות פיזיות */}
                {meeting.modality === 'physical' && (
                  <div className="space-y-2 bg-green-50 p-4 rounded-xl border border-green-200">
                    <Label htmlFor="travel_time" className="font-semibold text-green-800">
                      זמן הנסיעה שלך (לכל כיוון)
                    </Label>
                    <Select
                      value={travelTimeMinutes.toString()}
                      onValueChange={(value) => setTravelTimeMinutes(parseInt(value))}
                    >
                      <SelectTrigger className="rounded-xl bg-white">
                        <SelectValue placeholder="בחר זמן נסיעה" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">ללא (אני כבר במקום)</SelectItem>
                        <SelectItem value="15">15 דקות</SelectItem>
                        <SelectItem value="30">30 דקות</SelectItem>
                        <SelectItem value="45">45 דקות</SelectItem>
                        <SelectItem value="60">שעה</SelectItem>
                        <SelectItem value="90">שעה וחצי</SelectItem>
                        <SelectItem value="120">שעתיים</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-green-700 pt-2">
                      זמן זה יעזור לתאם את הזמינות שלך ביומן האישי שלך.
                      {travelTimeMinutes > 0 && (
                        <span className="block font-medium pt-1">
                          סה"כ זמן שיש לשריין: {meeting.duration_minutes + (travelTimeMinutes * 2)} דקות
                        </span>
                      )}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <Label className="text-base font-semibold">
                    מועדים זמינים עבורך *
                  </Label>
                  <div className="space-y-3">
                    {meeting.proposed_dates?.map((date, index) => (
                      <div
                        key={index}
                        className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          selectedDates.includes(date.datetime)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                        onClick={() => handleDateToggle(date.datetime)}
                      >
                        <Checkbox
                          checked={selectedDates.includes(date.datetime)}
                          onChange={() => handleDateToggle(date.datetime)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">
                            {format(new Date(date.datetime), "EEEE, d MMMM yyyy", { locale: he })}
                          </p>
                          <p className="text-sm text-slate-600">
                            {format(new Date(date.datetime), "HH:mm")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">הערות (אופציונלי)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="הערות נוספות או הגבלות..."
                    className="rounded-xl"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                  className="w-full meetiz-button-primary text-white rounded-xl py-3"
                >
                  {isSubmitting ? "שולח..." : (isUpdating ? "עדכן תגובה" : "שלח תגובה")}
                </Button>

                <div className="text-center pt-4 border-t border-slate-200">
                  <Button
                    variant="link"
                    className="text-red-600 hover:text-red-800"
                    onClick={() => setIsDeclining(true)}
                  >
                    {isUpdating ? "רוצה לשנות לסירוב" : "אף אחד מהמועדים לא מתאים לי"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="bg-red-50 p-6 rounded-xl border border-red-200">
                <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  {isUpdating ? "עדכון לסירוב" : "סירוב להזמנה"}
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="participantName" className="text-red-900">שם מלא *</Label>
                    <Input
                      id="participantName"
                      value={participantName}
                      onChange={(e) => setParticipantName(e.target.value)}
                      placeholder="השם שלך"
                      className="rounded-xl bg-white"
                      disabled={!!existingContact?.name}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="participantEmail" className="text-red-900">אימייל *</Label>
                    <Input
                      id="participantEmail"
                      type="email"
                      value={participantEmail}
                      onChange={(e) => setParticipantEmail(e.target.value)}
                      placeholder="האימייל שלך"
                      className="rounded-xl bg-white"
                      disabled={!!participantEmail}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="declineReason" className="text-red-900">אנא פרט מדוע אינך יכול/ה להשתתף *</Label>
                    <Textarea
                      id="declineReason"
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      placeholder="לדוגמה: אני בחופשה בתאריכים אלו, הנושא אינו רלוונטי עבורי וכו'..."
                      className="rounded-xl bg-white"
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDeclining(false);
                        if (!isUpdating) setDeclineReason("");
                      }}
                      className="flex-1"
                    >
                      ביטול
                    </Button>
                    <Button
                      onClick={handleDeclineSubmit}
                      disabled={!declineReason || !participantName || !participantEmail || isSubmitting}
                      className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 flex-1"
                    >
                      {isSubmitting ? "שולח..." : (isUpdating ? "עדכן לסירוב" : "שלח סירוב")}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
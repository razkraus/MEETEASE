
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy, Share2, Mail, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function MeetingSuccess({ meeting }) {
  const [copiedLinks, setCopiedLinks] = useState(new Set());

  const copyToClipboard = async (text, participantEmail) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLinks(prev => new Set([...prev, participantEmail]));
      setTimeout(() => {
        setCopiedLinks(prev => {
          const newSet = new Set(prev);
          newSet.delete(participantEmail);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const shareViaWhatsApp = (participant) => {
    const message = `היי ${participant.name}!\n\nהוזמנת לישיבה: "${meeting.title}"\n\nאנא לחץ על הקישור כדי לבחור מועדים שמתאימים לך:\n${participant.link}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaEmail = (participant) => {
    const subject = `🗓️ הזמנה לישיבה: ${meeting.title}`;
    const body = `היי ${participant.name}!\n\nהוזמנת לישיבה חדשה.\n\nפרטי הישיבה:\n📅 ${meeting.title}\n⏰ משך: ${meeting.duration_minutes} דקות\n👥 משתתפים: ${meeting.participants?.length || 0} אנשים\n\nאנא לחץ על הקישור כדי לבחור מועדים שמתאימים לך:\n${participant.link}\n\nתודה!`;
    
    const mailtoUrl = `mailto:${participant.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  if (!meeting) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <Card className="meetiz-card max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            🎉 הישיבה נוצרה בהצלחה!
          </CardTitle>
          <p className="text-slate-600 mt-2">
            {meeting.title}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📤 שיתוף הזמנות</h3>
            <p className="text-blue-800 text-sm">
              לא ניתן לשלוח מיילים אוטומטית למשתתפים חיצוניים. 
              אנא שתף איתם את קישורי ההזמנה באמצעות הכפתורים למטה.
            </p>
          </div>

          {meeting.invitationLinks && meeting.invitationLinks.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">קישורי הזמנה למשתתפים:</h3>
              <div className="space-y-4">
                {meeting.invitationLinks.map((participant, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-slate-900">{participant.name}</h4>
                        <p className="text-sm text-slate-600">{participant.email}</p>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 rounded p-3 mb-3">
                      <p className="text-xs text-slate-600 mb-2">קישור הזמנה:</p>
                      <p className="text-sm font-mono text-slate-800 break-all">
                        {participant.link}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(participant.link, participant.email)}
                        className="flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        {copiedLinks.has(participant.email) ? 'הועתק!' : 'העתק קישור'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareViaWhatsApp(participant)}
                        className="flex items-center gap-2 text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <Share2 className="w-4 h-4" />
                        שתף בוואטסאפ
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareViaEmail(participant)}
                        className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Mail className="w-4 h-4" />
                        שלח במייל
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-center pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600 mb-4">
              לאחר ששתפת את הקישורים, תוכל לעקוב אחר התגובות בדשבורד
            </p>
            <Button 
              onClick={() => window.location.href = '/Dashboard'}
              className="meetiz-button-primary text-white"
            >
              חזור לבית
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

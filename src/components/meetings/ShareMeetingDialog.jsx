import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircle, Mail, Copy, Share2, Link2 } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function ShareMeetingDialog({ meeting, open, onOpenChange }) {
  const [copied, setCopied] = useState(false);

  const getInvitationLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}${createPageUrl("RespondToMeeting")}?meeting=${meeting.id}&code=${meeting.invitation_code}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getInvitationLink());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(
      `🗓️ הוזמנת לישיבה: ${meeting.title}\n\n` +
      `📍 מיקום: ${meeting.location || 'לא צוין'}\n` +
      `⏰ משך: ${meeting.duration_minutes} דקות\n\n` +
      `לחץ על הקישור כדי לבחור מועדים שמתאימים לך:\n${getInvitationLink()}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`הזמנה לישיבה: ${meeting.title}`);
    const body = encodeURIComponent(
      `שלום,\n\n` +
      `הוזמנת לישיבה: ${meeting.title}\n\n` +
      `פרטי הישיבה:\n` +
      `📍 מיקום: ${meeting.location || 'לא צוין'}\n` +
      `⏰ משך: ${meeting.duration_minutes} דקות\n\n` +
      `${meeting.description ? `תיאור: ${meeting.description}\n\n` : ''}` +
      `אנא לחץ על הקישור הבא כדי לבחור מועדים שמתאימים לך:\n${getInvitationLink()}\n\n` +
      `תודה,\nמערכת מיטיז`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            שתף ישיבה
          </DialogTitle>
          <DialogDescription>
            שתף את הקישור לישיבה עם המשתתפים
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="link">קישור לישיבה</Label>
            <div className="flex gap-2">
              <Input
                id="link"
                value={getInvitationLink()}
                readOnly
                className="text-sm"
              />
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="px-3"
              >
                {copied ? "הועתק!" : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>שתף דרך</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={shareViaWhatsApp}
                variant="outline"
                className="justify-start gap-3 h-12"
              >
                <MessageCircle className="w-5 h-5 text-green-600" />
                ווצאפ
              </Button>
              <Button
                onClick={shareViaEmail}
                variant="outline"
                className="justify-start gap-3 h-12"
              >
                <Mail className="w-5 h-5 text-blue-600" />
                אימייל
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Link2 className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 text-sm">איך זה עובד?</h4>
                <p className="text-blue-800 text-xs mt-1">
                  המשתתפים יקבלו קישור שיוביל אותם לעמוד בו הם יוכלו לבחור מועדים שמתאימים להם מתוך הרשימה שהצעת.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
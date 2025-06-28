
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Users, Mail, File, Download } from "lucide-react"; // Removed Paperclip as it's not used in the final render

export default function MeetingReview({ data }) {
  const getFileIcon = (fileType) => {
    // This function provides a visual icon for different file types.
    // It can be expanded to include more specific icons (e.g., FileText, Image, FileSpreadsheet)
    // from lucide-react if desired, but for now, it uses a generic File icon with type-suggestive colors.
    if (fileType.includes("image/")) {
      return <File className="w-5 h-5 text-indigo-500" />;
    } else if (fileType.includes("application/pdf")) {
      return <File className="w-5 h-5 text-red-500" />;
    } else if (fileType.includes("application/msword") || fileType.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document")) {
      return <File className="w-5 h-5 text-blue-500" />; // Word document
    } else if (fileType.includes("application/vnd.ms-excel") || fileType.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) {
      return <File className="w-5 h-5 text-green-500" />; // Excel spreadsheet
    } else if (fileType.includes("application/vnd.ms-powerpoint") || fileType.includes("application/vnd.openxmlformats-officedocument.presentationml.presentation")) {
      return <File className="w-5 h-5 text-orange-500" />; // PowerPoint presentation
    } else if (fileType.includes("text/")) {
      return <File className="w-5 h-5 text-gray-500" />; // Text file
    }
    return <File className="w-5 h-5 text-gray-700" />; // Default generic file
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">סיכום הישיבה</h2>
        <p className="text-slate-600">בדוק את הפרטים לפני שליחת ההזמנות</p>
      </div>

      <div className="grid gap-6">
        {/* Meeting Details */}
        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              פרטי הישיבה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold text-slate-900">{data.title}</h4>
              {data.description && (
                <p className="text-slate-600 mt-1">{data.description}</p>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              {data.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span>{data.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>{data.duration_minutes} דקות</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attachments */}
        {data.attachments && data.attachments.length > 0 && (
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <File className="w-5 h-5 text-purple-600" />
                קבצים מצורפים ({data.attachments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getFileIcon(attachment.file_type)}
                      <div>
                        <p className="font-medium text-sm">{attachment.file_name}</p>
                        <p className="text-xs text-slate-500">{formatFileSize(attachment.file_size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(attachment.file_url, '_blank')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Proposed Dates */}
        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              מועדים מוצעים ({data.proposed_dates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.proposed_dates.map((date, index) => (
                <div key={index} className="p-3 bg-slate-50 rounded-lg">
                  <p className="font-medium">{date.date_label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Participants */}
        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              משתתפים ({data.participants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.participants.map((participant, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">{participant.name}</p>
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <Mail className="w-3 h-3" />
                      {participant.email}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-blue-800 text-sm">
          <strong>לתשומת לבך:</strong> לאחר הלחיצה על "שלח הזמנות", כל המשתתפים יקבלו הזמנה עם כל המועדים המוצעים{data.attachments && data.attachments.length > 0 ? ' והקבצים המצורפים' : ''}. 
          הם יוכלו לסמן אילו מועדים מתאימים להם, ולאחר מכן תוכל לקבוע את המועד הסופי.
        </p>
      </div>
    </div>
  );
}

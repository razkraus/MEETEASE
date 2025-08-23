import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Globe, Users, Upload, File, X, Paperclip, FileText, Presentation, Image, Archive } from 'lucide-react';
import { UploadFile } from "@/api/integrations";

export default function MeetingBasicInfo({ data, onChange }) {
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (field, value) => {
    const newData = { ...data, [field]: value };
    onChange(newData);
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    const uploadedFiles = [];

    try {
      for (const file of files) {
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert(`הקובץ ${file.name} גדול מדי. גודל מקסימלי: 10MB`);
          continue;
        }

        // Upload file
        const result = await UploadFile({ file });
        
        const attachment = {
          file_name: file.name,
          file_url: result.file_url,
          file_type: file.name.split('.').pop().toLowerCase(),
          file_size: file.size,
          uploaded_date: new Date().toISOString()
        };
        
        uploadedFiles.push(attachment);
      }

      // Add to existing attachments
      const currentAttachments = data.attachments || [];
      handleChange('attachments', [...currentAttachments, ...uploadedFiles]);
      
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("שגיאה בהעלאת הקובץ. נסה שוב.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = (index) => {
    const currentAttachments = data.attachments || [];
    const updatedAttachments = currentAttachments.filter((_, i) => i !== index);
    handleChange('attachments', updatedAttachments);
  };

  const getFileIcon = (fileType) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-600" />;
      case 'ppt':
      case 'pptx':
        return <Presentation className="w-4 h-4 text-orange-600" />;
      case 'doc':
      case 'docx':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="w-4 h-4 text-green-600" />;
      case 'zip':
      case 'rar':
        return <Archive className="w-4 h-4 text-purple-600" />;
      default:
        return <File className="w-4 h-4 text-slate-600" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">פרטי הישיבה</h2>
        <p className="text-slate-600">התחל על ידי הזנת הפרטים הבסיסיים של הישיבה.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="font-semibold">כותרת הישיבה *</Label>
          <Input
            id="title"
            value={data.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="לדוגמה: ישיבת צוות שבועית"
            className="rounded-xl text-base p-6"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="font-semibold">תיאור (אופציונלי)</Label>
          <Textarea
            id="description"
            value={data.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="פרט על מטרת הישיבה ונושאים שיידונו..."
            className="rounded-xl h-28 p-4"
          />
        </div>
        
        {/* קבצים מצורפים */}
        <div className="space-y-2">
          <Label className="font-semibold">קבצים מצורפים (אופציונלי)</Label>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="file"
                id="file-upload"
                multiple
                accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png,.gif,.zip,.rar"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('file-upload').click()}
                disabled={isUploading}
                className="rounded-xl flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    מעלה...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    צרף קבצים
                  </>
                )}
              </Button>
              <p className="text-xs text-slate-500">
                מצגות, PDF, תמונות, מסמכים (עד 10MB לקובץ)
              </p>
            </div>

            {/* רשימת קבצים מצורפים */}
            {data.attachments && data.attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">קבצים מצורפים:</p>
                <div className="space-y-2">
                  {data.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        {getFileIcon(attachment.file_type)}
                        <div>
                          <p className="font-medium text-sm text-slate-900">{attachment.file_name}</p>
                          <p className="text-xs text-slate-500">{formatFileSize(attachment.file_size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(attachment.file_url, '_blank')}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Paperclip className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* סוג ישיבה */}
        <div className="space-y-2">
          <Label className="font-semibold">אופן קיום הישיבה</Label>
          <RadioGroup
            value={data.modality}
            onValueChange={(value) => handleChange('modality', value)}
            className="grid grid-cols-2 gap-4"
          >
            <Label htmlFor="online" className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300 transition-all">
              <RadioGroupItem value="online" id="online" />
              <Globe className="w-5 h-5 text-blue-600" />
              <span className="font-medium">מקוונת</span>
            </Label>
            <Label htmlFor="physical" className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer has-[:checked]:bg-green-50 has-[:checked]:border-green-300 transition-all">
              <RadioGroupItem value="physical" id="physical" />
              <Users className="w-5 h-5 text-green-600" />
              <span className="font-medium">פיזית</span>
            </Label>
          </RadioGroup>
          
          {/* הודעה מידעית עבור ישיבה פיזית */}
          {data.modality === 'physical' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-3">
              <p className="text-sm text-green-800">
                🚗 <strong>ישיבה פיזית:</strong> כל משתתף יוכל להגדיר את זמן הנסיעה האישי שלו בעת התגובה להזמנה.
              </p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="location" className="font-semibold">מיקום</Label>
            <Input
              id="location"
              value={data.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder={data.modality === 'physical' ? "כתובת מדויקת של הישיבה" : "חדר ישיבות / זום / כתובת"}
              className="rounded-xl p-6"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="font-semibold">משך הישיבה</Label>
            <Select 
              value={data.duration_minutes.toString()} 
              onValueChange={(value) => handleChange('duration_minutes', parseInt(value))}
            >
              <SelectTrigger className="rounded-xl text-base p-6">
                <SelectValue placeholder="בחר משך זמן" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 דקות</SelectItem>
                <SelectItem value="45">45 דקות</SelectItem>
                <SelectItem value="60">שעה</SelectItem>
                <SelectItem value="90">שעה וחצי</SelectItem>
                <SelectItem value="120">שעתיים</SelectItem>
                <SelectItem value="180">3 שעות</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
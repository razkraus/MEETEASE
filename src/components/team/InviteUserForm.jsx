
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, UserPlus, CheckCircle } from 'lucide-react';
import { TeamMember, User } from '@/api/entities';

export default function InviteUserForm({ organizationId, organizationName, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    title: '',
    can_create_meetings: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Check if email already exists in User or TeamMember entities
      const [existingUsers, existingTeamMembers] = await Promise.all([
        User.filter({ email: formData.email }),
        TeamMember.filter({ email: formData.email })
      ]);

      if (existingUsers.length > 0 || existingTeamMembers.length > 0) {
        setError('כתובת המייל הזו כבר רשומה במערכת. לא ניתן להוסיף את אותו המשתמש פעמיים.');
        setIsSubmitting(false);
        return;
      }

      await TeamMember.create({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        title: formData.title,
        organization_id: organizationId,
        organization_name: organizationName,
        can_create_meetings: formData.can_create_meetings,
        status: 'pending'
      });

      setIsSuccess(true);

    } catch (error) {
      console.error("Failed to add team member:", error);
      setError('הוספת חבר הצוות נכשלה. אנא נסה שוב.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  if (isSuccess) {
    return (
      <div className="text-center p-4 space-y-4">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">חבר הצוות הוסף בהצלחה!</h3>
        <p className="text-slate-600 mb-4">
          {formData.full_name} נוסף לרשימת חברי הצוות.
          <br/>
          בעת הזמנה לישיבה הוא יקבל הנחיות להתחברות למערכת.
        </p>
        <Button onClick={onSuccess} className="mt-4">
          סגור
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Alert>
        <UserPlus className="h-4 w-4" />
        <AlertDescription>
          הזן את פרטי החבר החדש. הוא יתווסף לרשימת החברים ויקבל הזמנה למערכת רק כשתזמין אותו לישיבה.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">שם מלא *</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
            required
            placeholder="ישראל ישראלי"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">תפקיד *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            required
            placeholder="מנהל פרויקטים"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">אימייל *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          required
          placeholder="כתובת אימייל (לצורך התחברות)"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">טלפון</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="מספר טלפון (אופציונלי)"
        />
      </div>

      <div className="flex items-center space-x-2 space-x-reverse">
        <Checkbox
          id="can_create"
          checked={formData.can_create_meetings}
          onCheckedChange={(checked) => handleChange('can_create_meetings', checked)}
        />
        <Label htmlFor="can_create" className="text-sm">
          אפשר לעובד ליצור ישיבות
        </Label>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          📝 <strong>תהליך פשוט:</strong> החבר לא יקבל מייל כעת<br/>
          ✅ הוא יתווסף לרשימת החברים שלך<br/>
          📧 בהזמנה לישיבה הוא יקבל מייל עם הנחיות התחברות
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          ביטול
        </Button>
        <Button type="submit" disabled={isSubmitting || !formData.full_name || !formData.email || !formData.title}>
          {isSubmitting ? 'מוסיף...' : 'הוסף חבר צוות'}
        </Button>
      </div>
    </form>
  );
}

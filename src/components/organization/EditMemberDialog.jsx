import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function EditMemberDialog({ isOpen, onClose, member, onSuccess }) {
  const [formData, setFormData] = useState({
    full_name: '',
    title: '',
    phone: '',
    can_create_meetings: false
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (member) {
      setFormData({
        full_name: member.full_name || '',
        title: member.title || '',
        phone: member.phone || '',
        can_create_meetings: member.can_create_meetings || false
      });
    }
  }, [member]);

  const handleSave = async () => {
    if (!member) return;
    setIsSaving(true);
    try {
      await User.update(member.id, formData);
      onSuccess();
    } catch (error) {
      console.error("Failed to update member:", error);
      alert("שגיאה בעדכון פרטי החבר.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>עריכת פרטי חבר: {member?.full_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">שם מלא</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">תפקיד</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">טלפון</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <Label htmlFor="can_create_meetings">הרשאה ליצירת ישיבות</Label>
              <p className="text-[0.8rem] text-muted-foreground">
                האם לאפשר לחבר זה ליצור ישיבות חדשות בארגון?
              </p>
            </div>
            <Switch
              id="can_create_meetings"
              checked={formData.can_create_meetings}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, can_create_meetings: checked }))}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">ביטול</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "שומר..." : "שמור שינויים"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
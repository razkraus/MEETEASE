import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function RemoveMemberDialog({ isOpen, onClose, member, onConfirm }) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleConfirm = async () => {
    if (!member) return;
    setIsRemoving(true);
    try {
      await onConfirm(member);
    } catch (error) {
      console.error("Removal failed:", error);
    } finally {
      setIsRemoving(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
          </div>
          <DialogTitle className="text-center text-xl">האם להסיר את {member?.name}?</DialogTitle>
          <DialogDescription className="text-center text-slate-600 pt-2">
            הפעולה תסיר את המשתמש מהארגון והוא יאבד את כל ההרשאות. <br/>
            <strong>לא ניתן לשחזר פעולה זו.</strong>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-4 flex gap-2">
          <Button onClick={handleConfirm} disabled={isRemoving} variant="destructive" className="flex-1">
            {isRemoving ? "מסיר..." : "כן, הסר מהארגון"}
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="flex-1">ביטול</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from 'react';
import { Organization, User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function WelcomeScreen({ onOrganizationCreated }) {
  const [orgName, setOrgName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateOrganization = async (e) => {
    e.preventDefault();
    if (!orgName) return;
    
    setIsSubmitting(true);
    try {
      const user = await User.me();
      const newOrg = await Organization.create({
        name: orgName,
        owner_email: user.email,
      });
      await User.updateMyUserData({
        organization_id: newOrg.id,
        organization_name: newOrg.name,
      });
      onOrganizationCreated();
    } catch (error) {
      console.error("Failed to create organization", error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4" dir="rtl">
      <div className="text-center bg-white p-10 rounded-2xl shadow-xl max-w-lg w-full">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">ברוכים הבאים למיטיז!</h1>
        <p className="text-slate-600 mb-8">כדי להתחיל, צור את הארגון שלך. תוכל להוסיף לקוחות ולנהל פגישות תחת ארגון זה.</p>
        <form onSubmit={handleCreateOrganization} className="space-y-4">
          <div className="space-y-2 text-right">
            <Label htmlFor="orgName">שם הארגון</Label>
            <Input 
              id="orgName"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="לדוגמה: Acme Inc."
              className="text-center"
              required
            />
          </div>
          <Button type="submit" disabled={isSubmitting || !orgName} className="w-full meetiz-button-primary text-white py-3 rounded-xl">
            {isSubmitting ? 'יוצר ארגון...' : 'צור ארגון והמשך'}
          </Button>
        </form>
      </div>
    </div>
  );
}
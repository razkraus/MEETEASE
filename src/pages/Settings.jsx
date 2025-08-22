
import { useState, useEffect, useRef } from 'react';
import { User, Organization } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { LogOut, User as UserIcon, Building2, Save, Edit, Camera } from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import { UploadFile } from '@/api/integrations';

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [orgDetails, setOrgDetails] = useState({ name: '', business_field: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      if (currentUser.organization_id) {
        const orgData = await Organization.filter({ id: currentUser.organization_id });
        if (orgData.length > 0) {
          const org = orgData[0];
          setOrganization(org);
          setOrgDetails({ name: org.name, business_field: org.business_field || '' });
        }
      }
    } catch (e) {
      // not logged in
    }
  };

  const handleLogout = async () => {
    await User.logout();
    window.location.reload();
  };

  const handleOrgDetailsChange = (e) => {
    const { name, value } = e.target;
    setOrgDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveOrganization = async () => {
    if (!organization) return;
    setIsSaving(true);
    try {
      await Organization.update(organization.id, {
        name: orgDetails.name,
        business_field: orgDetails.business_field
      });
      if (user.organization_name !== orgDetails.name) {
        await User.updateMyUserData({ organization_name: orgDetails.name });
      }
      setIsEditing(false);
      await loadData();
    } catch (error) {
      console.error("Failed to save organization details", error);
      alert("שגיאה בשמירת פרטי הארגון.");
    }
    setIsSaving(false);
  };

  const handleProfilePictureChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      await User.updateMyUserData({ profile_picture_url: file_url });
      await loadData(); // Reload data to show new picture
    } catch (error) {
      console.error("Failed to upload profile picture:", error);
      alert("שגיאה בהעלאת התמונה.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) {
    return <div className="p-8">טוען...</div>;
  }

  const isOwner = user.email === organization?.owner_email;

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8">הגדרות</h1>
        
        <Card className="meetiz-card mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserIcon className="w-5 h-5" /> פרטי משתמש</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <Avatar src={user.profile_picture_url} name={user.full_name} className="w-24 h-24 text-3xl" />
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleProfilePictureChange} 
                accept="image/*"
              />
              <Button 
                size="icon" 
                className="absolute -bottom-2 -right-2 rounded-full"
                onClick={() => fileInputRef.current.click()}
                disabled={isUploading}
              >
                {isUploading ? "..." : <Camera className="w-4 h-4" />}
              </Button>
            </div>
            <div className="text-center sm:text-right">
              <p><strong>שם מלא:</strong> {user.full_name}</p>
              <p><strong>אימייל:</strong> {user.email}</p>
              <p><strong>תפקיד:</strong> {user.title || 'לא הוגדר'}</p>
            </div>
          </CardContent>
        </Card>

        {organization && (
          <Card className="meetiz-card mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" /> פרטי ארגון
              </CardTitle>
              {isOwner && !isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 ml-2" />
                  ערוך
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="font-semibold">שם הארגון</Label>
                    <Input
                      id="name"
                      name="name"
                      value={orgDetails.name}
                      onChange={handleOrgDetailsChange}
                      className="rounded-xl mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="business_field" className="font-semibold">תחום עיסוק</Label>
                    <Input
                      id="business_field"
                      name="business_field"
                      value={orgDetails.business_field}
                      onChange={handleOrgDetailsChange}
                      placeholder="לדוגמה: עריכת דין, ראיית חשבון"
                      className="rounded-xl mt-1"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-500">שם הארגון</p>
                    <p className="font-semibold">{organization.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">תחום עיסוק</p>
                    <p className="font-semibold">{organization.business_field || 'לא הוגדר'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">בעלים</p>
                    <p className="font-semibold">{organization.owner_email}</p>
                  </div>
                </div>
              )}
            </CardContent>
            {isEditing && (
              <CardFooter className="flex justify-end gap-2 border-t pt-4 mt-4">
                <Button variant="ghost" onClick={() => setIsEditing(false)}>ביטול</Button>
                <Button onClick={handleSaveOrganization} disabled={isSaving}>
                  {isSaving ? 'שומר...' : 'שמור שינויים'}
                  <Save className="w-4 h-4 mr-2" />
                </Button>
              </CardFooter>
            )}
          </Card>
        )}

        <Button variant="destructive" onClick={handleLogout} className="w-full rounded-xl">
          <LogOut className="w-4 h-4 ml-2" />
          התנתק
        </Button>
      </div>
    </div>
  );
}


import { useState, useEffect } from 'react';
import { User, Organization, TeamMember } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';

import WelcomeScreen from './WelcomeScreen';

const publicPages = ['RespondToMeeting'];

export default function AuthWrapper({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  
  const location = useLocation();
  const isPublicPage = publicPages.some(page => location.pathname.startsWith(createPageUrl(page)));

  useEffect(() => {
    if (isPublicPage) {
      setIsLoading(false);
      return;
    }
    checkAuth();
  }, [isPublicPage]);

  const checkAuth = async () => {
    try {
      const currentUser = await User.me();
      
      if (!currentUser.organization_id) {
        const teamMemberInvites = await TeamMember.filter({ email: currentUser.email, status: 'pending' });
        
        if (teamMemberInvites.length > 0) {
          const invite = teamMemberInvites[0];
          
          await User.updateMyUserData({
            organization_id: invite.organization_id,
            organization_name: invite.organization_name,
            user_type: 'internal',
            can_create_meetings: invite.can_create_meetings,
            phone: invite.phone || '',
            title: invite.title || '',
            full_name: invite.full_name,
          });
          
          await TeamMember.update(invite.id, {
            status: 'active',
            user_id: currentUser.id
          });
          
          window.location.reload();
          return;
        }
      }
      
      const refreshedUser = await User.me();
      setUser(refreshedUser);
      
      if (!refreshedUser.organization_id) {
        setShowWelcome(true);
      }
    } catch (error) {
      // Not logged in
    }
    setIsLoading(false);
  };

  const handleLogin = async () => {
    await User.login();
  };

  const handleSetupComplete = async (setupData) => {
    try {
      const organization = await Organization.create({
        name: setupData.organizationName,
        owner_email: user.email,
        subscription_type: 'premium'
      });

      await User.updateMyUserData({
        organization_id: organization.id,
        organization_name: setupData.organizationName,
        user_type: 'internal',
        can_create_meetings: true,
        phone: setupData.phone
      });

      setShowWelcome(false);
      window.location.reload();
    } catch (error) {
      console.error("Setup failed:", error);
    }
  };

  if (isPublicPage) {
    return children;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4" dir="rtl">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">ברוכים הבאים למיטיז</CardTitle>
            <p className="text-slate-600">המערכת החכמה לתיאום ישיבות</p>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLogin} className="w-full meetiz-button-primary text-white rounded-xl py-3">
              התחבר עם Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showWelcome) {
    return (
      <WelcomeScreen 
        user={user}
        onComplete={handleSetupComplete}
      />
    );
  }

  return children;
}

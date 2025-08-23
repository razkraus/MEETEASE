
import { useState, useEffect } from 'react';
import { User, Organization, TeamMember } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Plus, Mail, Building2, Crown, UserCheck, UserX, Edit, UserPlus, MoreVertical, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import InviteUserForm from '../components/team/InviteUserForm';
import EditMemberDialog from '../components/organization/EditMemberDialog';
import RemoveMemberDialog from '../components/organization/RemoveMemberDialog';
import Avatar from '../components/ui/Avatar';

export default function OrganizationMembersPage() {
  const [users, setUsers] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [removingMember, setRemovingMember] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      if (user.organization_id) {
        const [registeredUsers, teamData, orgData] = await Promise.all([
          User.filter({ organization_id: user.organization_id }),
          TeamMember.filter({ organization_id: user.organization_id }),
          Organization.filter({ id: user.organization_id })
        ]);
        setUsers(registeredUsers);
        setTeamMembers(teamData);
        if (orgData.length > 0) {
          setOrganization(orgData[0]);
        }
      }
    } catch (error) {
      console.error("Error loading team data:", error);
    }
    setIsLoading(false);
  };

  const handleUserAdded = () => {
    setIsInviteOpen(false);
    loadData();
  };

  const handleMemberUpdated = () => {
    setEditingMember(null);
    loadData();
  };

  const handleRemoveConfirmed = async (memberToRemove) => {
    try {
      if (memberToRemove.type === 'registered') {
        // If it's a registered user, remove them from the organization
        // by updating their user record and deleting the team member record.
        await User.update(memberToRemove.id, {
          organization_id: null,
          organization_name: null,
          can_create_meetings: false,
          title: null,
        });
        
        // Find and delete the corresponding team member record as well
        const teamMemberRecord = teamMembers.find(tm => tm.email === memberToRemove.email);
        if (teamMemberRecord) {
          await TeamMember.delete(teamMemberRecord.id);
        }
      } else if (memberToRemove.type === 'pending') {
        // If it's a pending invitation, just delete the team member record
        await TeamMember.delete(memberToRemove.id);
      }
      
      setRemovingMember(null); // Close the dialog
      loadData(); // Refresh the list
    } catch (error) {
      console.error("Failed to remove member:", error);
      alert("שגיאה בהסרת החבר.");
    }
  };

  const isOwner = currentUser?.email === organization?.owner_email;
  const isPremium = organization?.subscription_type === 'premium';

  // משלב רשימת משתמשים רשומים עם חברי צוות שעדיין לא נרשמו
  const allTeamMembers = [
    ...users.map(user => ({ ...user, type: 'registered', id: user.id, name: user.full_name, status: 'active' })),
    ...teamMembers.filter(tm => !users.some(u => u.email === tm.email)).map(tm => ({ ...tm, type: 'pending', name: tm.full_name, status: 'pending' })) // Add status for pending
  ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">חברים בארגון</h1>
            <p className="text-slate-600 mt-1">נהל את החברים בארגון {organization?.name}</p>
          </div>
          {isOwner && (
            <Button onClick={() => setIsInviteOpen(true)} className="meetiz-button-primary text-white rounded-xl px-6">
              <UserPlus className="w-4 h-4 ml-2" />
              הוסף חבר חדש
            </Button>
          )}
        </div>

        {/* Organization Info */}
        <Card className="meetiz-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              פרטי הארגון
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-slate-500">שם הארגון</p>
                <p className="font-semibold">{organization?.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">בעלים</p>
                <p className="font-semibold">{organization?.owner_email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">תחום עיסוק</p>
                <p className="font-semibold">{organization?.business_field || 'לא הוגדר'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">סוג מנוי</p>
                <div className="flex items-center gap-2">
                  <Badge className={isPremium ? "bg-yellow-100 text-yellow-800" : "bg-slate-100 text-slate-700"}>
                    {isPremium ? "פרימיום" : "חינמי"}
                  </Badge>
                  {isPremium && <Crown className="w-4 h-4 text-yellow-500" />}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Members List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allTeamMembers.map(member => (
            <Card key={member.id || member.email} className="meetiz-card group">
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar src={member.profile_picture_url} name={member.name} />
                    <div>
                      <h3 className="font-bold text-slate-900">{member.name}</h3>
                      <p className="text-sm text-slate-500">{member.title || 'לא הוגדר תפקיד'}</p>
                    </div>
                  </div>
                  {member.email === organization?.owner_email ? (
                    <Crown className="w-5 h-5 text-yellow-500" />
                  ) : (
                    isOwner && (
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setEditingMember(member)} disabled={member.type !== 'registered'}>
                              <Edit className="ml-2 h-4 w-4" />
                              <span>ערוך פרטים</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setRemovingMember(member)} className="text-red-600 focus:text-red-600">
                              <Trash2 className="ml-2 h-4 w-4" />
                              <span>הסר מהארגון</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )
                  )}
                </div>

                <div className="space-y-2 text-sm">
                   <div className="flex items-center gap-2 text-slate-600">
                     <Mail className="w-4 h-4" />
                     {member.email}
                   </div>
                  {member.type === 'registered' && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">יצירת ישיבות:</span>
                        {member.can_create_meetings ? (
                            <UserCheck className="w-4 h-4 text-green-600" />
                          ) : (
                            <UserX className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                  )}
                   <Badge className={`mt-1 ${member.status === 'active' ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}>
                        {member.status === 'active' ? 'פעיל' : 'ממתין להרשמה'}
                   </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {allTeamMembers.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              אין חברים בארגון
            </h3>
            <p className="text-slate-600 mb-6">
              הזמן חברים חדשים כדי שיוכלו ליצור ולהשתתף בישיבות.
            </p>
            {isOwner && (
              <Button onClick={() => setIsInviteOpen(true)} className="meetiz-button-primary text-white rounded-xl">
                הזמן חבר ראשון
              </Button>
            )}
          </div>
        )}
      </div>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הוספת חבר חדש לארגון</DialogTitle>
          </DialogHeader>
          <InviteUserForm 
            organizationId={currentUser?.organization_id}
            organizationName={organization?.name}
            onSuccess={handleUserAdded}
            onCancel={() => setIsInviteOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {editingMember && (
        <EditMemberDialog
          isOpen={!!editingMember}
          onClose={() => setEditingMember(null)}
          member={editingMember}
          onSuccess={handleMemberUpdated}
        />
      )}

      {removingMember && (
        <RemoveMemberDialog
          isOpen={!!removingMember}
          onClose={() => setRemovingMember(null)}
          member={removingMember}
          onConfirm={handleRemoveConfirmed}
        />
      )}
    </div>
  );
}

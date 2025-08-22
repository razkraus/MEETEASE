
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Mail, User, Contact, Trash, Users, Building2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Contact as ContactEntity, User as CurrentUser, TeamMember } from '@/api/entities';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function MeetingParticipants({ data, onChange }) {
  const [contacts, setContacts] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await CurrentUser.me();
        setCurrentUser(user);
        
        if (user.organization_id) {
          const [contactsData, teamMembersData, registeredUsersData] = await Promise.all([
            ContactEntity.filter({ organization_id: user.organization_id }),
            TeamMember.filter({ organization_id: user.organization_id }),
            CurrentUser.filter({ organization_id: user.organization_id })
          ]);
          setContacts(contactsData);
          setTeamMembers(teamMembersData);
          setRegisteredUsers(registeredUsersData.filter(u => u.email !== user.email)); // Exclude current user from registered users
        }
      } catch (e) { 
        console.error(e); 
      }
    };
    fetchData();
  }, []);

  const addParticipant = (participant) => {
    if (!data.participants.some(p => p.email === participant.email)) {
      onChange({
        ...data,
        participants: [...data.participants, participant]
      });
    }
  };

  const addAllTeamMembers = () => {
    const allMembers = [
      ...registeredUsers.map(user => ({ 
        name: user.full_name, 
        email: user.email, 
        type: 'internal',
        status: 'invited',
        reminders_sent: 0
      })),
      ...teamMembers.filter(tm => !registeredUsers.some(u => u.email === tm.email)).map(tm => ({ 
        name: tm.full_name, 
        email: tm.email, 
        type: 'internal',
        status: 'invited',
        reminders_sent: 0
      }))
    ];

    const newParticipants = [...data.participants];
    let addedCount = 0;

    allMembers.forEach(member => {
      if (!newParticipants.some(p => p.email === member.email)) {
        newParticipants.push(member);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      onChange({
        ...data,
        participants: newParticipants
      });
    }
  };
  
  const addExternalParticipant = async () => {
    if (!newName || !newEmail || !/\S+@\S+\.\S+/.test(newEmail)) return;
    
    const participant = { 
      name: newName, 
      email: newEmail, 
      type: 'external',
      company: newCompany,
      status: 'invited', // New property
      reminders_sent: 0 // New property
    };
    
    // Add to contacts database for future use
    try {
      await ContactEntity.create({
        name: newName,
        email: newEmail,
        company: newCompany,
        organization_id: currentUser.organization_id,
        first_invited_date: new Date().toISOString(),
        total_meetings_invited: 1
      });
    } catch (error) {
      // Contact might already exist, that's ok
    }
    
    addParticipant(participant);
    setNewName("");
    setNewEmail("");
    setNewCompany("");
  };

  const removeParticipant = (email) => {
    onChange({
      ...data,
      participants: data.participants.filter(p => p.email !== email)
    });
  };

  // Determine meeting type based on participants
  const hasExternalParticipants = data.participants.some(p => p.type === 'external');
  const meetingType = hasExternalParticipants ? 'external' : 'internal';
  
  // Update meeting type in parent
  useEffect(() => {
    onChange({
      ...data,
      meeting_type: meetingType
    });
  }, [meetingType]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">משתתפי הישיבה</h2>
        <p className="text-slate-600">בחר משתתפים מהארגון או חיצוניים</p>
        {meetingType === 'external' && (
          <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              🔔 ישיבה חיצונית - המשתתפים החיצוניים יקבלו הזמנה ויוכלו לאשר מועדים
            </p>
          </div>
        )}
      </div>
      
      <Tabs defaultValue="team" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            חברי ארגון
          </TabsTrigger>
          <TabsTrigger value="external" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            חיצוניים
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="team" className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="font-semibold">בחר חברי ארגון</Label>
            {(registeredUsers.length > 0 || teamMembers.length > 0) && (
              <Button
                onClick={addAllTeamMembers}
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Users className="w-4 h-4 ml-2" />
                בחר את כל חברי הארגון
              </Button>
            )}
          </div>
          
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between rounded-xl">
                בחר חבר בארגון...
                <Users className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="חפש חבר בארגון..." />
                <CommandList>
                  <CommandEmpty>לא נמצאו חברי ארגון.</CommandEmpty>
                  
                  {/* משתמשים רשומים */}
                  {registeredUsers.length > 0 && (
                    <CommandGroup heading="רשומים במערכת">
                      {registeredUsers.map((member) => (
                        <CommandItem
                          key={`user-${member.id}`}
                          onSelect={() => {
                            addParticipant({ 
                              name: member.full_name, 
                              email: member.email, 
                              type: 'internal',
                              status: 'invited',
                              reminders_sent: 0
                            });
                            setOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            {member.full_name} - {member.email}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  
                  {/* חברי ארגון שטרם נרשמו */}
                  {teamMembers.length > 0 && (
                    <CommandGroup heading="חברי ארגון (ממתינים לרישום)">
                      {teamMembers.filter(tm => !registeredUsers.some(u => u.email === tm.email)).map((member) => (
                        <CommandItem
                          key={`team-${member.id}`}
                          onSelect={() => {
                            addParticipant({ 
                              name: member.full_name, 
                              email: member.email, 
                              type: 'internal',
                              status: 'invited',
                              reminders_sent: 0
                            });
                            setOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                            {member.full_name} - {member.email}
                            <span className="text-xs text-slate-500">(ממתין לרישום)</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </TabsContent>
        
        <TabsContent value="external" className="space-y-4">
          {/* Select from existing contacts */}
          <div className="space-y-2">
            <Label className="font-semibold">בחר מתוך אנשי קשר קיימים</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between rounded-xl">
                  בחר איש קשר...
                  <Contact className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="חפש איש קשר..." />
                  <CommandList>
                    <CommandEmpty>לא נמצאו אנשי קשר.</CommandEmpty>
                    <CommandGroup>
                      {contacts.map((contact) => (
                        <CommandItem
                          key={contact.id}
                          onSelect={() => {
                            addParticipant({ 
                              name: contact.name, 
                              email: contact.email, 
                              type: 'external',
                              company: contact.company,
                              status: 'invited', // New property
                              reminders_sent: 0 // New property
                            });
                          }}
                        >
                          {contact.name} - {contact.email}
                          {contact.company && ` (${contact.company})`}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Add new external contact */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-4 border border-slate-200">
            <Label className="text-base font-semibold">או הוסף איש קשר חדש</Label>
            <div className="grid grid-cols-1 gap-4">
              <Input 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                placeholder="שם מלא" 
                className="rounded-xl"
              />
              <Input 
                type="email" 
                value={newEmail} 
                onChange={(e) => setNewEmail(e.target.value)} 
                placeholder="כתובת אימייל" 
                className="rounded-xl"
              />
              <Input 
                value={newCompany} 
                onChange={(e) => setNewCompany(e.target.value)} 
                placeholder="חברה (אופציונלי)" 
                className="rounded-xl"
              />
              <Button 
                onClick={addExternalParticipant} 
                disabled={!newName || !newEmail} 
                className="meetiz-button-primary text-white rounded-xl"
              >
                <Plus className="w-4 h-4 ml-1" />
                הוסף איש קשר
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Participants List */}
      <div className="space-y-3">
        <h3 className="font-semibold">משתתפים שנבחרו ({data.participants.length})</h3>
        <AnimatePresence>
          {data.participants.map((participant) => (
            <motion.div 
              key={participant.email} 
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                  participant.type === 'internal' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  {participant.type === 'internal' ? 
                    <Users className="w-5 h-5 text-blue-600" /> : 
                    <Building2 className="w-5 h-5 text-green-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{participant.name}</p>
                  <p className="text-sm text-slate-600 truncate">
                    {participant.email}
                    {participant.company && ` • ${participant.company}`}
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => removeParticipant(participant.email)} 
                className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
              >
                <Trash className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {data.participants.length === 0 && (
        <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl">
          בחר משתתפים לישיבה
        </div>
      )}
    </div>
  );
}

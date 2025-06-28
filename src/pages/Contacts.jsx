import React, { useState, useEffect } from 'react';
import { Contact, User } from '@/api/entities';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Building2, Search, Mail, Phone, Briefcase, Users, ChevronDown, ChevronUp } from 'lucide-react';
import Avatar from '../components/ui/Avatar';

const groupByCompany = (contacts) => {
  return contacts.reduce((acc, contact) => {
    const companyName = contact.company || 'ללא חברה';
    if (!acc[companyName]) {
      acc[companyName] = [];
    }
    acc[companyName].push(contact);
    return acc;
  }, {});
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openCompanies, setOpenCompanies] = useState({});

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      if (currentUser.organization_id) {
        const contactsData = await Contact.filter(
          { organization_id: currentUser.organization_id }, 
          '-created_date'
        );
        setContacts(contactsData);
        // Initially open all company accordions
        const grouped = groupByCompany(contactsData);
        const initialOpenState = Object.keys(grouped).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {});
        setOpenCompanies(initialOpenState);
      }
    } catch (error) {
      console.error("Error loading contacts:", error);
    }
    setIsLoading(false);
  };

  const toggleCompany = (companyName) => {
    setOpenCompanies(prev => ({ ...prev, [companyName]: !prev[companyName] }));
  };

  const filteredContacts = contacts.filter(contact => 
    (contact.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (contact.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (contact.company?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (contact.title?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const groupedContacts = groupByCompany(filteredContacts);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">אנשי קשר</h1>
            <p className="text-slate-600 mt-1">כל האנשים שהוזמנו לישיבות בעבר, מקובצים לפי חברה.</p>
          </div>
        </div>

        <div className="meetiz-card rounded-2xl p-6 mb-8">
          <div className="relative">
            <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="חפש לפי שם, אימייל, חברה או תפקיד..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 rounded-xl border-slate-200"
            />
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedContacts).map(([companyName, companyContacts]) => (
            <Card key={companyName} className="meetiz-card overflow-hidden">
              <button
                onClick={() => toggleCompany(companyName)}
                className="w-full p-4 flex justify-between items-center bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h2 className="font-bold text-lg text-slate-800">{companyName}</h2>
                  <Badge variant="secondary">{companyContacts.length} אנשי קשר</Badge>
                </div>
                {openCompanies[companyName] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              
              {openCompanies[companyName] && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {companyContacts.map(contact => (
                    <Card key={contact.id} className="border-slate-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4 mb-3">
                          <Avatar name={contact.name} />
                          <div>
                            <h3 className="font-bold text-slate-900">{contact.name}</h3>
                            <p className="text-sm text-slate-500">{contact.title || 'לא הוגדר תפקיד'}</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{contact.email}</span>
                          </div>
                          {contact.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              <span>{contact.phone}</span>
                            </div>
                          )}
                           <div className="flex items-center gap-2 pt-2 border-t mt-2">
                              <Users className="w-4 h-4" />
                              <span>הוזמן ל-{contact.total_meetings_invited || 0} ישיבות</span>
                            </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
        
        {filteredContacts.length === 0 && !isLoading && (
           <div className="text-center py-12">
             <Building2 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
             <h3 className="text-xl font-semibold text-slate-900 mb-2">
               אין אנשי קשר עדיין
             </h3>
             <p className="text-slate-600">
               אנשי קשר יתווספו אוטומטית כשתזמין אותם לישיבות
             </p>
           </div>
        )}
      </div>
    </div>
  );
}
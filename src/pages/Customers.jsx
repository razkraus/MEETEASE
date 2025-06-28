import React, { useState, useEffect } from 'react';
import { Customer, User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import CustomerForm from '../components/customers/CustomerForm';
import WelcomeScreen from '../components/customers/WelcomeScreen';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      if (currentUser.organization_id) {
        const customerData = await Customer.filter({ organization_id: currentUser.organization_id });
        setCustomers(customerData);
      }
    } catch (error) {
      console.error("User not logged in or error fetching data", error);
    }
    setIsLoading(false);
  };
  
  const handleCustomerCreated = (newCustomer) => {
    setCustomers(prev => [...prev, newCustomer]);
    setIsFormOpen(false);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="p-8">טוען...</div>;
  }
  
  if (!user?.organization_id) {
    return <WelcomeScreen onOrganizationCreated={loadInitialData} />;
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">ניהול לקוחות</h1>
            <p className="text-slate-600 mt-1">נהל את רשימת הלקוחות בארגון שלך</p>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="meetiz-button-primary text-white rounded-xl px-6">
                <Plus className="w-4 h-4 ml-2" />
                לקוח חדש
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>יצירת לקוח חדש</DialogTitle>
              </DialogHeader>
              <CustomerForm 
                organizationId={user.organization_id} 
                onSuccess={handleCustomerCreated}
                onCancel={() => setIsFormOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="meetiz-card rounded-2xl p-6 mb-8">
          <div className="relative">
            <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="חפש לקוח לפי שם, אימייל או חברה..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 rounded-xl border-slate-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map(customer => (
            <div key={customer.id} className="meetiz-card p-4 rounded-xl">
              <h3 className="font-bold">{customer.name}</h3>
              <p className="text-sm text-slate-500">{customer.company}</p>
              <p className="text-sm text-slate-500">{customer.email}</p>
            </div>
          ))}
        </div>
        
        {filteredCustomers.length === 0 && (
           <div className="text-center col-span-full py-12">
             <p>לא נמצאו לקוחות.</p>
           </div>
        )}
      </div>
    </div>
  );
}
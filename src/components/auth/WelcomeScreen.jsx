import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Crown, Users, Sparkles } from 'lucide-react';

export default function WelcomeScreen({ user, onComplete }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    organizationName: '',
    phone: '',
    subscription_type: 'premium' // ברירת מחדל פרימיום
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    } else {
      onComplete(formData);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4" dir="rtl">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {step === 1 ? `שלום ${user?.full_name}! 👋` : 'בחר את התוכנית שלך'}
          </CardTitle>
          <p className="text-slate-600">
            {step === 1 ? 'בואו נתחיל להגדיר את הארגון שלך' : 'אנחנו מתחילים אותך עם פרימיום!'}
          </p>
        </CardHeader>
        
        <CardContent>
          {step === 1 ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="orgName">שם הארגון *</Label>
                <Input
                  id="orgName"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({...formData, organizationName: e.target.value})}
                  placeholder="לדוגמה: חברת טכנולוגיה בע״מ"
                  required
                  className="rounded-xl"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">מספר טלפון</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="050-1234567"
                  className="rounded-xl"
                />
              </div>

              <Button type="submit" className="w-full meetiz-button-primary text-white rounded-xl py-3">
                המשך להגדרת התוכנית
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Premium Plan Highlight */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Crown className="w-8 h-8 text-yellow-500" />
                    <h3 className="text-2xl font-bold text-blue-900">פרימיום - חינם לחודש הראשון!</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
                    <div className="space-y-2">
                      <p>✨ ישיבות ללא הגבלה</p>
                      <p>📅 אינטגרציה מלאה עם יומנים</p>
                      <p>🤖 זיהוי אוטומטי של זמנים פנויים</p>
                    </div>
                    <div className="space-y-2">
                      <p>🔔 התראות אוטומטיות</p>
                      <p>📊 דוחות ואנליטיקות</p>
                      <p>🛠️ תמיכה מקצועית 24/7</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-yellow-100 rounded-lg text-center">
                    <p className="text-yellow-800 font-semibold">
                      🎉 החודش הראשון שלך חינם! אחר כך רק ₪99 לחודש
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl"
                >
                  חזור
                </Button>
                <Button 
                  onClick={() => onComplete(formData)}
                  className="flex-2 meetiz-button-primary text-white rounded-xl"
                >
                  <Sparkles className="w-4 h-4 ml-2" />
                  התחל עם פרימיום
                </Button>
              </div>
              
              <p className="text-xs text-slate-500 text-center">
                ללא התחייבות • ביטול בכל עת • ללא עמלות נסתרות
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
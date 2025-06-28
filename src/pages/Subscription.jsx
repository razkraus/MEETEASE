import React, { useState, useEffect } from 'react';
import { User, Organization } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, Zap, Users, Calendar, Shield, Sparkles } from 'lucide-react';

const plans = [
  {
    name: 'חינמי',
    price: '₪0',
    period: 'לחודש',
    description: 'מושלם להתחלה',
    current: true,
    features: [
      'עד 3 ישיבות בחודש',
      'עד 5 משתתפים בישיבה',
      'תמיכה בסיסית באימייל',
      'מועדים מוצעים באופן ידני',
      'שמירת היסטוריית ישיבות למשך 30 יום'
    ],
    limitations: [
      'ללא אינטגרציה ליומן',
      'ללא התראות אוטומטיות',
      'ללא דוחות מתקדמים'
    ]
  },
  {
    name: 'פרימיום',
    price: '₪99',
    period: 'לחודש',
    description: 'לצוותים מקצועיים',
    popular: true,
    features: [
      'ישיבות ללא הגבלה',
      'משתתפים ללא הגבלה',
      'אינטגרציה מלאה עם Google Calendar ו-Outlook',
      'זיהוי אוטומטי של זמנים פנויים',
      'התראות אוטומטיות ותזכורות חכמות',
      'דוחות ואנליטיקות מתקדמים',
      'היסטוריית ישיבות ללא הגבלת זמן',
      'תמיכה מקצועית 24/7',
      'אפשרות ליצור תבניות ישיבות',
      'ניהול מתקדם של אנשי קשר'
    ]
  },
  {
    name: 'ארגוני',
    price: '₪299',
    period: 'לחודש',
    description: 'לארגונים גדולים',
    enterprise: true,
    features: [
      'כל התכונות של פרימיום',
      'ניהול מרובה ארגונים',
      'הרשאות מתקדמות לממונים',
      'אינטגרציה עם מערכות HR',
      'דשבורד מנהלים עם תובנות',
      'הדרכה ואימון צוות',
      'התאמה אישית למותג הארגון',
      'SLA מובטח',
      'גיבויים אוטומטיים'
    ]
  }
];

export default function SubscriptionPage() {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

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
          setOrganization(orgData[0]);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleUpgrade = async (planName) => {
    setIsUpgrading(true);
    try {
      // סימולציה של תהליך תשלום
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // עדכון הארגון לפרימיום
      if (organization) {
        await Organization.update(organization.id, {
          subscription_type: 'premium'
        });
        
        // עדכון הרשאות המשתמש
        await User.updateMyUserData({
          can_create_meetings: true
        });
        
        loadData();
      }
    } catch (error) {
      console.error("Error upgrading:", error);
    }
    setIsUpgrading(false);
  };

  const currentPlan = organization?.subscription_type || 'free';

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Crown className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
              מחירונים ומנויים
            </h1>
          </div>
          <p className="text-xl text-slate-600 mb-4">
            בחר את התוכנית המתאימה לצרכים שלך
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-slate-500">המנוי הנוכחי שלך:</span>
            <Badge className={currentPlan === 'premium' ? "bg-yellow-100 text-yellow-800" : "bg-slate-100 text-slate-700"}>
              {currentPlan === 'premium' ? '🏆 פרימיום' : '🆓 חינמי'}
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <Card key={plan.name} className={`meetiz-card relative overflow-hidden ${
              plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''
            } ${plan.enterprise ? 'bg-gradient-to-br from-purple-50 to-indigo-50' : ''}`}>
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center py-2 text-sm font-semibold">
                  <Star className="w-4 h-4 inline mr-1" />
                  הכי פופולרי
                </div>
              )}
              {plan.enterprise && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-indigo-700 text-white text-center py-2 text-sm font-semibold">
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  לארגונים
                </div>
              )}
              
              <CardHeader className={`text-center ${plan.popular || plan.enterprise ? 'pt-12' : 'pt-6'}`}>
                <div className="flex items-center justify-center mb-4">
                  {plan.name === 'חינמי' && <Users className="w-8 h-8 text-slate-500" />}
                  {plan.name === 'פרימיום' && <Crown className="w-8 h-8 text-yellow-500" />}
                  {plan.name === 'ארגוני' && <Shield className="w-8 h-8 text-purple-500" />}
                </div>
                <CardTitle className="text-2xl font-bold mb-2">{plan.name}</CardTitle>
                <p className="text-slate-600 mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-slate-500 mr-2">{plan.period}</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900">כלול בתוכנית:</h4>
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {plan.limitations && (
                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <h4 className="font-semibold text-slate-500">מגבלות:</h4>
                    {plan.limitations.map((limitation, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <span className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0">✗</span>
                        <span className="text-sm text-slate-500">{limitation}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-6">
                  {currentPlan === 'premium' && plan.name === 'פרימיום' ? (
                    <Button disabled className="w-full rounded-xl bg-green-100 text-green-800 cursor-default">
                      <Check className="w-4 h-4 ml-2" />
                      התוכנית הנוכחית שלך
                    </Button>
                  ) : currentPlan === 'free' && plan.name === 'חינמי' ? (
                    <Button disabled className="w-full rounded-xl bg-slate-100 text-slate-600 cursor-default">
                      התוכנית הנוכחית שלך
                    </Button>
                  ) : plan.name !== 'חינמי' ? (
                    <Button 
                      onClick={() => handleUpgrade(plan.name)}
                      disabled={isUpgrading}
                      className={`w-full rounded-xl ${
                        plan.popular 
                          ? 'meetiz-button-primary text-white' 
                          : plan.enterprise
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-slate-600 hover:bg-slate-700 text-white'
                      }`}
                    >
                      {isUpgrading ? (
                        <>
                          <Zap className="w-4 h-4 ml-2 animate-spin" />
                          מעבד תשלום...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 ml-2" />
                          שדרג ל{plan.name}
                        </>
                      )}
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <Card className="meetiz-card">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">שאלות נפוצות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">איך עובדת האינטגרציה עם היומן?</h4>
                <p className="text-sm text-slate-600">במנוי פרימיום, המערכת מתחברת ליומן Google או Outlook שלך וסורקת אוטומטיט זמנים פנויים לכל המשתתפים, כך שתוכל להציע רק מועדים שמתאימים לכולם.</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">האם אפשר לבטל את המנוי בכל עת?</h4>
                <p className="text-sm text-slate-600">כן! אפשר לבטל את המנוי בכל עת ללא עמלות ביטול. המנוי יישאר פעיל עד תום התקופה ששולמה.</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">מה קורה לנתונים כשאני מבטל?</h4>
                <p className="text-sm text-slate-600">כל הנתונים נשמרים במערכת למשך 90 יום לאחר ביטול המנוי. במהלך תקופה זו תוכל לשדרג בחזרה ולקבל את כל הנתונים.</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">האם יש הנחה לארגונים גדולים?</h4>
                <p className="text-sm text-slate-600">כן! לארגונים עם יותר מ-50 משתמשים אנחנו מציעים הנחות מיוחדות. צרו קשר עם צוות המכירות שלנו.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <div className="text-center mt-12">
          <h3 className="text-xl font-bold text-slate-900 mb-4">צריכים עזרה בבחירת התוכנית?</h3>
          <p className="text-slate-600 mb-6">צוות המכירות שלנו כאן כדי לעזור לכם למצוא את הפתרון המושלם</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" className="rounded-xl">
              <Calendar className="w-4 h-4 ml-2" />
              קבע פגישת ייעוץ
            </Button>
            <Button variant="outline" className="rounded-xl">
              צור קשר עם המכירות
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
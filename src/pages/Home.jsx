import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, CheckCircle, ArrowLeft, Star, Shield, Clock, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      // אם המשתמש מחובר ויש לו ארגון, הפנה לדשבורד
      if (currentUser && currentUser.organization_id) {
        window.location.href = createPageUrl("Dashboard");
        return;
      }
    } catch (error) {
      // לא מחובר - נשאר בדף הבית
    }
    setIsLoading(false);
  };

  const handleLogin = async () => {
    try {
      await User.login();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // אם המשתמש מחובר אבל אין לו ארגון
  if (user && !user.organization_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4" dir="rtl">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">הגדרת הארגון</CardTitle>
            <p className="text-slate-600">אנא השלם את הגדרת הארגון שלך</p>
          </CardHeader>
          <CardContent>
            <Link to={createPageUrl("Dashboard")}>
              <Button className="w-full meetiz-button-primary text-white rounded-xl py-3">
                המשך להגדרות
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // דף נחיתה למשתמשים לא מחוברים
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" dir="rtl">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-slate-900">מיטיז</h1>
                <p className="text-xs text-slate-500 hidden sm:block">יצירת ישיבות חכמות</p>
              </div>
            </div>
            <Button onClick={handleLogin} className="meetiz-button-primary text-white rounded-xl px-6">
              התחבר עם Google
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            תאמו ישיבות
            <span className="text-blue-600"> בקלות</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            מיטיז מאפשר לכם לתאם ישיבות עם משתתפים מרובים בקלות מירבית. 
            פשוט הציעו מועדים, תנו למשתתפים לבחור, וקבעו את הישיבה אוטומטית.
          </p>
          <Button onClick={handleLogin} className="meetiz-button-primary text-white text-lg px-8 py-4 rounded-xl shadow-lg">
            התחל בחינם
            <ArrowLeft className="w-5 h-5 mr-3" />
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="meetiz-card text-center p-8 hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-xl mb-4">תיאום מועדים</CardTitle>
            <p className="text-slate-600">
              הציעו מספר מועדים אפשריים ותנו למשתתפים לבחור את המתאים להם
            </p>
          </Card>

          <Card className="meetiz-card text-center p-8 hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-xl mb-4">אישור אוטומטי</CardTitle>
            <p className="text-slate-600">
              ברגע שכולם הגיבו, בחרו את המועד הטוב ביותר ושלחו זימונים ליומן
            </p>
          </Card>

          <Card className="meetiz-card text-center p-8 hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 mx-auto mb-6 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <CardTitle className="text-xl mb-4">ניהול צוות</CardTitle>
            <p className="text-slate-600">
              נהלו את חברי הצוות ואנשי הקשר החיצוניים במקום אחד
            </p>
          </Card>
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg border">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            למה לבחור במיטיז?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">חיסכון בזמן</h3>
                <p className="text-slate-600">
                  אל תבזבזו זמן על הודעות ודוא"ל לתיאום מועדים. מיטיז עושה את זה בשבילכם.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">אמין ובטוח</h3>
                <p className="text-slate-600">
                  המידע שלכם מוגן ובטוח. התחברות באמצעות Google בלבד.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">קל לשימוש</h3>
                <p className="text-slate-600">
                  ממשק פשוט ואינטואיטיבי שמתאים לכולם, ללא צורך בהדרכה.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                <Globe className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">נגיש מכל מקום</h3>
                <p className="text-slate-600">
                  עובד על כל מכשיר - מחשב, טאבלט או נייד. תמיד זמין עבורכם.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            מוכנים להתחיל?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            הצטרפו לאלפי ארגונים שכבר משתמשים במיטיז לתיאום ישיבות
          </p>
          <Button onClick={handleLogin} className="meetiz-button-primary text-white text-lg px-8 py-4 rounded-xl shadow-lg">
            התחברו עכשיו בחינם
            <ArrowLeft className="w-5 h-5 mr-3" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">מיטיז</span>
          </div>
          <p className="text-slate-600">
            © 2024 מיטיז. כל הזכויות שמורות.
          </p>
        </div>
      </footer>
    </div>
  );
}
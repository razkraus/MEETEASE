

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Calendar, Plus, Users, Settings, Home, Contact, UserCog, Crown, Menu, Bell, History, Search, LifeBuoy } from "lucide-react"; // Added LifeBuoy
import AuthWrapper from "./components/auth/AuthWrapper";
import NotificationBell from "./components/dashboard/NotificationBell";

const navigationItems = [
  {
    title: "בית", // Changed from "דשבורד" to "בית"
    url: createPageUrl("Dashboard"),
    icon: Home, // Changed from BarChart3 to Home
  },
  {
    title: "בדיקת זמינות",
    url: createPageUrl("CheckAvailability"),
    icon: Search,
  },
  {
    title: "ישיבה חדשה",
    url: createPageUrl("CreateMeeting"),
    icon: Plus,
  },
  {
    title: "הישיבות שלי",
    url: createPageUrl("MyMeetings"),
    icon: Calendar,
  },
  {
    title: "היסטוריה", // New item: Meeting History
    url: createPageUrl("MeetingHistory"),
    icon: History,
  },
  {
    title: "חברים בארגון",
    url: createPageUrl("OrganizationMembers"),
    icon: UserCog,
  },
  {
    title: "אנשי קשר",
    url: createPageUrl("Contacts"),
    icon: Contact,
  },
  {
    title: "צור קשר", // New item: Contact Us
    url: createPageUrl("ContactUs"),
    icon: LifeBuoy,
  },
  {
    title: "מנויים",
    url: createPageUrl("Subscription"),
    icon: Crown,
  },
  {
    title: "הגדרות",
    url: createPageUrl("Settings"),
    icon: Settings,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" dir="rtl">
        {/* תפריט עליון קבוע */}
        <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* לוגו וכותרת */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-lg text-slate-900">מיטיז</h1>
                  <p className="text-xs text-slate-500 hidden sm:block">יצירת ישיבות חכמות</p>
                </div>
              </div>

              {/* תפריט ניווט */}
              <nav className="hidden lg:flex items-center space-x-reverse space-x-8">
                {navigationItems.map((item) => (
                  <Link
                    key={item.title}
                    to={item.url}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      location.pathname === item.url
                        ? 'bg-blue-50 text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </Link>
                ))}
              </nav>

              {/* פעמון התראות */}
              <div className="flex items-center">
                <NotificationBell />
              </div>
            </div>

            {/* תפריט מובייל */}
            <div className="lg:hidden border-t border-slate-200 py-3">
              <div className="flex overflow-x-auto space-x-reverse space-x-4 pb-2">
                {navigationItems.map((item) => (
                  <Link
                    key={item.title}
                    to={item.url}
                    className={`flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                      location.pathname === item.url
                        ? 'bg-blue-50 text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* תוכן ראשי */}
        <main className="flex-1">
          <style>
            {`
              :root {
                --primary-color: #2563eb;
                --primary-hover: #1d4ed8;
                --secondary-color: #64748b;
                --background-gradient: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%);
                --card-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                --card-shadow-hover: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
              }
              
              /* תיקונים עבור RTL */
              * {
                text-align: right;
              }
              
              .text-left {
                text-align: left !important;
              }
              
              .text-center {
                text-align: center !important;
              }
              
              input, textarea, select {
                text-align: right;
                direction: rtl;
              }
              
              .meetiz-card {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: var(--card-shadow);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                text-align: right;
              }
              
              .meetiz-card:hover {
                box-shadow: var(--card-shadow-hover);
                transform: translateY(-2px);
              }
              
              .meetiz-button-primary {
                background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              }
              
              .meetiz-button-primary:hover {
                transform: translateY(-1px);
                box-shadow: 0 10px 25px -3px rgba(37, 99, 235, 0.3);
              }

              /* תיקון תצוגת דשבורד במחשב */
              @media (min-width: 1024px) {
                .dashboard-container {
                  max-width: none;
                  padding: 2rem;
                }
                
                .stats-grid {
                  grid-template-columns: repeat(4, 1fr);
                  gap: 1.5rem;
                }
                
                .dashboard-grid {
                  grid-template-columns: 2fr 1fr;
                  gap: 2rem;
                }
              }

              /* תיקוני RTL כלליים */
              .flex {
                direction: rtl;
              }
              
              .grid {
                direction: rtl;
              }
              
              /* תיקון כיוון טקסט בכרטיסים */
              .card-content, .card-header {
                direction: rtl;
                text-align: right;
              }
              
              /* תיקון מיקום אייקונים */
              .mr-2 {
                margin-right: 0.5rem;
                margin-left: 0;
              }
              
              .ml-2 {
                margin-left: 0.5rem;
                margin-right: 0;
              }
              
              /* תיקון כפתורים */
              .btn-rtl {
                direction: rtl;
                text-align: center;
              }
              
              /* תיקון popover וdropdown */
              .popover-content, .dropdown-content {
                direction: rtl;
                text-align: right;
              }

              /* תיקון נוטיפקציות */
              .notification-bell {
                display: flex !important;
                visibility: visible !important;
              }
              
              /* תיקון תפריט נווט */
              .nav-item {
                direction: rtl;
              }
              
              /* תיקון overflow במובייל */
              .mobile-nav {
                direction: rtl;
              }
              
              .mobile-nav::-webkit-scrollbar {
                height: 4px;
              }
              
              .mobile-nav::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 2px;
              }
              
              .mobile-nav::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 2px;
              }
            `}
          </style>
          {children}
        </main>
      </div>
    </AuthWrapper>
  );
}


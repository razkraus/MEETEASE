import React, { useState, useEffect } from 'react';
import { Notification, User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Calendar, Users, AlertCircle, RefreshCw } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user?.email) {
      loadNotifications();
      // Set interval to try loading notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error("Error loading user:", error);
      setError("שגיאה בטעינת פרטי משתמש");
    }
  };

  const loadNotifications = async (isRetry = false) => {
    if (!user?.email) return;
    
    try {
      if (!isRetry) {
        setIsLoading(true);
      }
      setError(null);
      
      const notificationsData = await Notification.filter(
        { user_email: user.email },
        "-created_date",
        20
      );
      
      setNotifications(notificationsData || []);
      setUnreadCount((notificationsData || []).filter(n => !n.is_read).length);
      setRetryCount(0); // Reset retry count on success
      
    } catch (error) {
      console.error("Error loading notifications:", error);
      
      // If this is a network error and we haven't retried too many times, try again
      if (error.message.includes("Network") && retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          loadNotifications(true);
        }, 2000 * (retryCount + 1)); // Exponential backoff
      } else {
        setError("שגיאת רשת בטעינת הודעות");
        setNotifications([]);
        setUnreadCount(0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await Notification.update(notificationId, { is_read: true });
      // Update local state immediately for better UX
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
      // Silently fail - not critical
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifications.map(n => Notification.update(n.id, { is_read: true }))
      );
      // Update local state immediately
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
      // Try to reload notifications on error
      loadNotifications();
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    loadNotifications();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_response':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'meeting_confirmed':
        return <Calendar className="w-4 h-4 text-green-600" />;
      case 'meeting_cancelled':
        return <Calendar className="w-4 h-4 text-red-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  // Don't render anything if there's no user
  if (!user) {
    return null;
  }

  return (
    <div className="notification-bell">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-slate-100">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -left-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
            {error && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full"></div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 max-h-96 overflow-y-auto popover-content" align="start" side="bottom">
          <div className="space-y-4" dir="rtl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">הודעות</h3>
              <div className="flex items-center gap-2">
                {error && (
                  <Button variant="ghost" size="sm" onClick={handleRetry}>
                    <RefreshCw className="w-4 h-4 ml-1" />
                    רענן
                  </Button>
                )}
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    <Check className="w-4 h-4 ml-1" />
                    סמן הכל כנקרא
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {isLoading ? (
                <div className="text-center py-4 text-slate-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm">טוען הודעות...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">
                  <AlertCircle className="w-12 h-12 mx-auto text-red-300 mb-2" />
                  <p className="text-sm">{error}</p>
                  {retryCount > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      ניסיון {retryCount}/3...
                    </p>
                  )}
                  <Button variant="link" onClick={handleRetry} className="mt-2 text-sm">
                    <RefreshCw className="w-4 h-4 ml-1" />
                    נסה שוב
                  </Button>
                </div>
              ) : notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      notification.is_read 
                        ? 'bg-white border-slate-200' 
                        : 'bg-blue-50 border-blue-200'
                    }`}
                    onClick={() => {
                      if (!notification.is_read) {
                        markAsRead(notification.id);
                      }
                    }}
                  >
                    <Link to={`${createPageUrl("MeetingDetails")}?id=${notification.meeting_id}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${!notification.is_read ? 'text-slate-900' : 'text-slate-700'}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-500 mt-2">
                            {formatDistanceToNow(new Date(notification.created_date), { 
                              addSuffix: true, 
                              locale: he 
                            })}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                        )}
                      </div>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Bell className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <p>אין הודעות חדשות</p>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const user = await base44.auth.me();
      if (!user) return;

      const allNotifs = await base44.entities.Notification.filter(
        { recipient_email: user.email },
        '-created_date',
        20
      );

      setNotifications(allNotifs);
      setUnreadCount(allNotifs.filter(n => !n.is_read).length);
    } catch (err) {
      console.log('Error loading notifications:', err);
    }
  };

  const markAsRead = async (notification) => {
    try {
      if (!notification.is_read) {
        await base44.entities.Notification.update(notification.id, { is_read: true });
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Navigate to relevant page
      if (notification.link) {
        navigate(notification.link);
        setIsOpen(false);
      }
    } catch (err) {
      console.log('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const user = await base44.auth.me();
      const unread = notifications.filter(n => !n.is_read);
      
      await Promise.all(
        unread.map(n => base44.entities.Notification.update(n.id, { is_read: true }))
      );
      
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.log('Error marking all as read:', err);
    }
  };

  const getIcon = (type) => {
    const icons = {
      follow: '👥',
      comment: '💬',
      message: '✉️',
      challenge: '🎮',
      mention: '🔔',
      like: '❤️'
    };
    return icons[type] || '🔔';
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-green-400 hover:text-white hover:bg-purple-900/30"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-zinc-900 border-zinc-700 p-0">
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h3 className="font-semibold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-purple-400 hover:text-purple-300"
            >
              Mark all read
            </button>
          )}
        </div>
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {notifications.map(notif => (
                <button
                  key={notif.id}
                  onClick={() => markAsRead(notif)}
                  className={`w-full p-3 text-left hover:bg-zinc-800 transition-colors ${
                    !notif.is_read ? 'bg-purple-900/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getIcon(notif.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">
                        <span className="font-semibold text-green-400">
                          {notif.sender_name}
                        </span>{' '}
                        {notif.content}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {getTimeAgo(notif.created_date)}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-1" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
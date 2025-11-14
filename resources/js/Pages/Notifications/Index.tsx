import GooglePhotosLayout from '@/Layouts/GooglePhotosLayout';
import { Head, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Bell, Calendar, Star, Users, Image, Eye, EyeOff, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { useEffect, useState } from 'react';

interface NotificationItem {
  id: number;
  type?: string | null;
  title?: string | null;
  body?: string | null;
  is_read?: boolean;
  created_at: string;
}

interface Props {
  notifications: {
    data: NotificationItem[];
    current_page: number;
    last_page: number;
  };
}

export default function NotificationsIndex({ notifications }: Props) {
  const [hoveredNotification, setHoveredNotification] = useState<number | null>(null);

  const goToPage = (page: number) => {
    router.get(route('notifications.index', { page }), {}, { preserveScroll: true });
  };

  const getNotificationIcon = (type: string | null | undefined) => {
    switch (type) {
      case 'info':
        return <Image className="h-5 w-5" />;
      case 'event':
        return <Calendar className="h-5 w-5" />;
      case 'favorite':
        return <Star className="h-5 w-5" />;
      case 'social':
        return <Users className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: string | null | undefined) => {
    switch (type) {
      case 'info':
        return 'bg-blue-500';
      case 'event':
        return 'bg-green-500';
      case 'favorite':
        return 'bg-amber-500';
      case 'social':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const markAsRead = (id: number) => {
    router.patch(route('notifications.read', id), {}, { preserveScroll: true });
  };

  const markAsUnread = (id: number) => {
    router.patch(route('notifications.unread', id), {}, { preserveScroll: true });
  };

  const deleteNotification = (id: number) => {
    router.delete(route('notifications.destroy', id), { preserveScroll: true });
  };

  const unreadCount = notifications.data.filter(n => !n.is_read).length;

  return (
    <GooglePhotosLayout>
      <Head title="Thông báo" />

      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section - Google Photos Style */}
          <div className="mb-8">
            <h1 className="text-3xl font-light text-gray-900 dark:text-gray-100 mb-2">
              Thông báo
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {notifications.data.length} thông báo {unreadCount > 0 && `• ${unreadCount} chưa đọc`}
            </p>
          </div>

          {notifications.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="text-center max-w-md">
                <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                  <Bell className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-xl font-light text-gray-900 dark:text-gray-100 mb-2">
                  Không có thông báo
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tất cả thông báo của bạn sẽ xuất hiện ở đây
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.data.map((n) => (
                <div
                  key={n.id}
                  className={`group rounded-lg border transition-all duration-200 hover:shadow-md ${
                    n.is_read 
                      ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-800' 
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  }`}
                  onMouseEnter={() => setHoveredNotification(n.id)}
                  onMouseLeave={() => setHoveredNotification(null)}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full ${getNotificationColor(n.type)} flex items-center justify-center text-white`}>
                        {getNotificationIcon(n.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className={`text-base font-medium mb-1 ${
                              n.is_read 
                                ? 'text-gray-700 dark:text-gray-300' 
                                : 'text-gray-900 dark:text-gray-100'
                            }`}>
                              {n.title || n.body || 'Thông báo mới'}
                            </h3>
                            {n.body && n.title && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {n.body}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDistanceToNow(new Date(n.created_at), { 
                                  addSuffix: true, 
                                  locale: vi 
                                })}
                              </span>
                              {!n.is_read && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                                  Mới
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className={`flex items-center gap-1 transition-opacity duration-200 ${
                            hoveredNotification === n.id ? 'opacity-100' : 'opacity-0'
                          }`}>
                            {n.is_read ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsUnread(n.id)}
                                className="h-8 w-8 p-0"
                              >
                                <EyeOff className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(n.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(n.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {notifications.last_page > 1 && (
            <div className="flex justify-center gap-2 mt-12">
              {Array.from({ length: notifications.last_page }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    page === notifications.current_page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </GooglePhotosLayout>
  );
}

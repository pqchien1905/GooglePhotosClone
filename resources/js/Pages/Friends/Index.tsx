import GooglePhotosLayout from '@/Layouts/GooglePhotosLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Users, UserPlus, Mail, Check, X, Ban, UserX, Search } from 'lucide-react';
import { useState } from 'react';

interface User { id: number; name: string; email: string }
interface FriendItem { id: number; requester_id: number; addressee_id: number; status: 'pending'|'accepted'|'blocked'; requester?: User; addressee?: User; created_at: string }

interface Props {
  friends: { data: FriendItem[] };
  incoming: { data: FriendItem[] };
  outgoing: { data: FriendItem[] };
  blocked: { data: FriendItem[] };
}

export default function FriendsIndex({ friends, incoming, outgoing, blocked }: Props) {
  const { auth } = usePage().props as any;
  const { data, setData, post, processing, errors, reset } = useForm({ email: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'friends' | 'incoming' | 'outgoing' | 'blocked'>('friends');

  const getOtherUser = (f: FriendItem) => {
    const myId: number | undefined = auth?.user?.id;
    if (myId === undefined) return f.requester ?? f.addressee;
    if (f.requester && f.requester.id === myId) return f.addressee;
    if (f.addressee && f.addressee.id === myId) return f.requester;
    return f.requester_id === myId ? f.addressee : f.requester;
  };

  const sendRequest = () => {
    post(route('friends.store'), {
      preserveScroll: true,
      onSuccess: () => reset('email')
    });
  };

  const accept = (id: number) => router.patch(route('friends.update', id), {}, { preserveScroll: true });
  const remove = (id: number) => router.delete(route('friends.destroy', id), { preserveScroll: true });
  const block = (id: number) => router.post(route('friends.block', id), {}, { preserveScroll: true });
  const unblock = (id: number) => router.post(route('friends.unblock', id), {}, { preserveScroll: true });

  const filteredFriends = friends.data.filter(f => {
    const other = getOtherUser(f);
    return other?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
           other?.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredIncoming = incoming.data.filter(f => {
    const other = getOtherUser(f);
    return other?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
           other?.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredOutgoing = outgoing.data.filter(f => {
    const other = getOtherUser(f);
    return other?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
           other?.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredBlocked = blocked.data.filter(f => {
    const other = getOtherUser(f);
    return other?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
           other?.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getTabData = () => {
    switch (activeTab) {
      case 'friends': return filteredFriends;
      case 'incoming': return filteredIncoming;
      case 'outgoing': return filteredOutgoing;
      case 'blocked': return filteredBlocked;
      default: return [];
    }
  };

  const getTabCount = () => {
    switch (activeTab) {
      case 'friends': return friends.data.length;
      case 'incoming': return incoming.data.length;
      case 'outgoing': return outgoing.data.length;
      case 'blocked': return blocked.data.length;
      default: return 0;
    }
  };

  return (
    <GooglePhotosLayout>
      <Head title="Bạn bè" />
      
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section - Google Photos Style */}
          <div className="mb-8">
            <h1 className="text-3xl font-light text-gray-900 dark:text-gray-100 mb-2">
              Bạn bè
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Quản lý kết nối và lời mời kết bạn
            </p>
          </div>

          {/* Search Bar - Google Photos Style */}
          <div className="mb-8 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                placeholder="Tìm kiếm bạn bè..."
              />
            </div>
          </div>

          {/* Tabs - Google Photos Style */}
          <div className="flex items-center gap-8 border-b border-gray-200 dark:border-gray-800 mb-8 pb-1">
            <button
              onClick={() => setActiveTab('friends')}
              className={`relative pb-3 text-sm font-medium transition-colors ${
                activeTab === 'friends'
                  ? 'text-gray-900 dark:text-gray-100'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Bạn bè ({friends.data.length})
              {activeTab === 'friends' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('incoming')}
              className={`relative pb-3 text-sm font-medium transition-colors ${
                activeTab === 'incoming'
                  ? 'text-gray-900 dark:text-gray-100'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Lời mời đến ({incoming.data.length})
              {activeTab === 'incoming' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('outgoing')}
              className={`relative pb-3 text-sm font-medium transition-colors ${
                activeTab === 'outgoing'
                  ? 'text-gray-900 dark:text-gray-100'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Đã gửi ({outgoing.data.length})
              {activeTab === 'outgoing' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></span>
              )}
            </button>
            {blocked.data.length > 0 && (
              <button
                onClick={() => setActiveTab('blocked')}
                className={`relative pb-3 text-sm font-medium transition-colors ${
                  activeTab === 'blocked'
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Đã chặn ({blocked.data.length})
                {activeTab === 'blocked' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></span>
                )}
              </button>
            )}
          </div>

          {/* Add Friend Section */}
          <div className="mb-8 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Thêm bạn bè
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Gửi lời mời kết bạn bằng email
                </p>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      type="email"
                      value={data.email}
                      onChange={(e) => setData('email', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                      placeholder="Email bạn bè"
                    />
                  </div>
                  <Button
                    onClick={sendRequest}
                    disabled={processing || !data.email}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Gửi lời mời
                  </Button>
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {errors.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          {getTabData().length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="text-center max-w-md">
                <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                  <Users className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-xl font-light text-gray-900 dark:text-gray-100 mb-2">
                  {activeTab === 'friends' && 'Chưa có bạn bè'}
                  {activeTab === 'incoming' && 'Không có lời mời đến'}
                  {activeTab === 'outgoing' && 'Không có lời mời đã gửi'}
                  {activeTab === 'blocked' && 'Không có người dùng bị chặn'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activeTab === 'friends' && 'Bắt đầu kết bạn để chia sẻ ảnh và album'}
                  {activeTab === 'incoming' && 'Các lời mời kết bạn sẽ hiển thị ở đây'}
                  {activeTab === 'outgoing' && 'Các lời mời bạn đã gửi sẽ hiển thị ở đây'}
                  {activeTab === 'blocked' && 'Các người dùng bạn đã chặn sẽ hiển thị ở đây'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getTabData().map((f) => {
                const other = getOtherUser(f);
                const name = other?.name ?? '';
                const email = other?.email ?? '';
                const initials = name.charAt(0).toUpperCase();

                return (
                  <div
                    key={f.id}
                    className="group rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-lg flex-shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                          {name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {activeTab === 'friends' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => block(f.id)}
                            className="flex-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            <Ban className="h-4 w-4 mr-1.5" />
                            Chặn
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => remove(f.id)}
                            className="flex-1"
                          >
                            <UserX className="h-4 w-4 mr-1.5" />
                            Xóa
                          </Button>
                        </>
                      )}
                      
                      {activeTab === 'incoming' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => accept(f.id)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Check className="h-4 w-4 mr-1.5" />
                            Chấp nhận
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => remove(f.id)}
                            className="flex-1"
                          >
                            <X className="h-4 w-4 mr-1.5" />
                            Từ chối
                          </Button>
                        </>
                      )}
                      
                      {activeTab === 'outgoing' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => remove(f.id)}
                          className="w-full"
                        >
                          <X className="h-4 w-4 mr-1.5" />
                          Hủy lời mời
                        </Button>
                      )}
                      
                      {activeTab === 'blocked' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unblock(f.id)}
                          className="w-full"
                        >
                          Bỏ chặn
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </GooglePhotosLayout>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { Button } from '@/Components/ui/button';
import { Share2, Copy, Check, Link as LinkIcon, Clock, Users, Mail, X, Eye } from 'lucide-react';
import SharePhotosEmailPreview from '@/Components/SharePhotosEmailPreview';

interface Friend { id: number; name: string; email: string }

interface Photo {
  id: number;
  path: string;
  thumb_path?: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  photoIds: number[];
  photos?: Photo[]; // Optional: pass photos data for preview
  senderName?: string; // Optional: sender name for preview
}

type Tab = 'link' | 'friends' | 'email';

export default function SharePhotosModal({ isOpen, onClose, photoIds = [], photos = [], senderName }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('link');
  const [loading, setLoading] = useState(false);
  
  // Link sharing state
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  
  // Friends sharing state
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState<string>('');
  const [q, setQ] = useState('');
  const [friendsLoading, setFriendsLoading] = useState(false);
  
  // Email sharing state
  const [emailAddresses, setEmailAddresses] = useState<string>('');
  const [emailMessage, setEmailMessage] = useState<string>('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset all state when modal closes
      setActiveTab('link');
      setShareUrl(null);
      setCopied(false);
      setExpiresInDays(null);
      setExpiresAt(null);
      setLinkError(null);
      setSelectedFriends(new Set());
      setMessage('');
      setQ('');
      setEmailAddresses('');
      setEmailMessage('');
      setEmailError(null);
      setEmailSuccess(false);
      setShowEmailPreview(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'friends') return;
    setFriendsLoading(true);
    axios.get(route('friends.list'))
      .then(res => setFriends(res.data.data || []))
      .finally(() => setFriendsLoading(false));
  }, [isOpen, activeTab]);

  const filteredFriends = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return friends;
    return friends.filter(f => f.name.toLowerCase().includes(term) || f.email.toLowerCase().includes(term));
  }, [friends, q]);

  const toggleFriend = (id: number) => {
    const s = new Set(selectedFriends);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelectedFriends(s);
  };

  const handleCreateLink = async () => {
    if (photoIds.length === 0) return;
    if (photoIds.length > 1) {
      setLinkError('Chỉ có thể tạo link cho 1 ảnh. Vui lòng chọn 1 ảnh để tạo link.');
      return;
    }
    
    setLoading(true);
    setLinkError(null);
    try {
      const payload: any = { type: 'photo', id: photoIds[0] };
      if (expiresInDays !== null && expiresInDays > 0) {
        payload.expires_in_days = expiresInDays;
      }
      const response = await axios.post('/share', payload);
      setShareUrl(response.data.url);
      setExpiresAt(response.data.expires_at || null);
    } catch (e: any) {
      setLinkError(e.response?.data?.message || e.message || 'Không thể tạo link chia sẻ');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareToFriends = () => {
    if (selectedFriends.size === 0) return;
    const payload: any = { friend_ids: Array.from(selectedFriends) };
    if (photoIds.length > 0) payload.photo_ids = photoIds;
    if (message.trim()) payload.message = message.trim();

    router.post(route('friends.share'), payload, {
      preserveScroll: true,
      onSuccess: () => {
        onClose();
      }
    });
  };

  const handleShareViaEmail = async () => {
    if (!emailAddresses.trim()) {
      setEmailError('Vui lòng nhập ít nhất một địa chỉ email');
      return;
    }
    
    const emails = emailAddresses.split(',').map(e => e.trim()).filter(e => e);
    if (emails.length === 0) {
      setEmailError('Vui lòng nhập ít nhất một địa chỉ email hợp lệ');
      return;
    }

    setEmailLoading(true);
    setEmailError(null);
    setEmailSuccess(false);
    
    try {
      await axios.post(route('photos.share-email'), {
        photo_ids: photoIds,
        emails: emails,
        message: emailMessage.trim() || null,
      });
      setEmailSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (e: any) {
      setEmailError(e.response?.data?.message || e.message || 'Không thể gửi email');
    } finally {
      setEmailLoading(false);
    }
  };

  const formatExpiryDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Chia sẻ {photoIds.length} ảnh
          </h3>
          <button 
            onClick={onClose} 
            className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Đóng"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b dark:border-gray-700">
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'link'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <LinkIcon className="h-4 w-4" />
              <span>Tạo link</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'friends'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className="h-4 w-4" />
              <span>Bạn bè</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'email'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Mail className="h-4 w-4" />
              <span>Email</span>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          {/* Link Tab */}
          {activeTab === 'link' && (
            <div className="space-y-4">
              {photoIds.length > 1 && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                  Chỉ có thể tạo link cho 1 ảnh. Vui lòng chọn 1 ảnh để tạo link.
                </div>
              )}
              
              {photoIds.length === 1 && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Thời hạn (tùy chọn)
                    </label>
                    <select
                      value={expiresInDays || ''}
                      onChange={(e) => setExpiresInDays(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    >
                      <option value="">Không hết hạn</option>
                      <option value="1">1 ngày</option>
                      <option value="7">7 ngày</option>
                      <option value="30">30 ngày</option>
                      <option value="90">90 ngày</option>
                      <option value="365">1 năm</option>
                    </select>
                  </div>

                  {!shareUrl ? (
                    <Button
                      onClick={handleCreateLink}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? 'Đang tạo...' : 'Tạo link chia sẻ'}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                        <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                          Link chia sẻ
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={shareUrl}
                            readOnly
                            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                            onFocus={e => e.target.select()}
                          />
                          <Button
                            variant="outline"
                            onClick={handleCopyLink}
                            className="flex items-center gap-2"
                          >
                            {copied ? (
                              <>
                                <Check className="h-4 w-4 text-green-600" />
                                Đã sao chép
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                                Sao chép
                              </>
                            )}
                          </Button>
                        </div>
                        {expiresAt && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="h-3 w-3" />
                            Hết hạn: {formatExpiryDate(expiresAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {linkError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                      {linkError}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Friends Tab */}
          {activeTab === 'friends' && (
            <div className="space-y-4">
              <div>
                <input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Tìm theo tên hoặc email"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              {friendsLoading ? (
                <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  Đang tải danh sách bạn bè...
                </div>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredFriends.length === 0 ? (
                    <li className="text-sm text-gray-500 dark:text-gray-400">
                      Không có bạn bè phù hợp.
                    </li>
                  ) : filteredFriends.map(f => (
                    <li key={f.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{f.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{f.email}</div>
                      </div>
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedFriends.has(f.id)}
                          onChange={() => toggleFriend(f.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-600 dark:text-gray-400">Chọn</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Lời nhắn (tùy chọn)
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="h-20 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Gửi lời nhắn cho bạn bè..."
                />
              </div>
            </div>
          )}

          {/* Email Tab */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Địa chỉ email <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={emailAddresses}
                  onChange={e => setEmailAddresses(e.target.value)}
                  placeholder="email1@example.com, email2@example.com"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Nhập nhiều email, cách nhau bởi dấu phẩy
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Lời nhắn (tùy chọn)
                </label>
                <textarea
                  value={emailMessage}
                  onChange={e => setEmailMessage(e.target.value)}
                  className="h-24 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Gửi lời nhắn kèm theo ảnh..."
                />
              </div>

              {emailError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                  {emailError}
                </div>
              )}

              {emailSuccess && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
                  Đã gửi email thành công!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t px-6 py-4 dark:border-gray-700">
          <Button onClick={onClose} variant="outline">
            Hủy
          </Button>
          {activeTab === 'link' && photoIds.length === 1 && !shareUrl && (
            <Button onClick={handleCreateLink} disabled={loading}>
              {loading ? 'Đang tạo...' : 'Tạo link'}
            </Button>
          )}
          {activeTab === 'friends' && (
            <Button
              onClick={handleShareToFriends}
              disabled={selectedFriends.size === 0}
            >
              Gửi ({selectedFriends.size})
            </Button>
          )}
          {activeTab === 'email' && (
            <Button
              onClick={handleShareViaEmail}
              disabled={emailLoading || !emailAddresses.trim() || emailSuccess}
            >
              {emailLoading ? 'Đang gửi...' : emailSuccess ? 'Đã gửi' : 'Gửi email'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}


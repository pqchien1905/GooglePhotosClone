import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { Button } from '@/Components/ui/button';
import { Share2, Copy, Check, Link as LinkIcon, Clock } from 'lucide-react';

interface ShareButtonProps {
  type: 'photo' | 'album';
  id: number;
  iconOnly?: boolean;
  className?: string;
  size?: 'icon' | 'default';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  asModal?: boolean; // open a modal instead of inline block
}

export default function ShareButton({ type, id, iconOnly = false, className = '', size, variant, asModal = false }: ShareButtonProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (!asModal) return;
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen, asModal]);

  const handleShare = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload: any = { type, id };
      if (expiresInDays !== null && expiresInDays > 0) {
        payload.expires_in_days = expiresInDays;
      }
      // Dùng axios (đã được cấu hình sẵn CSRF token trong Laravel)
      const response = await axios.post('/share', payload);
      setShareUrl(response.data.url);
      setExpiresAt(response.data.expires_at || null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const onClick = async () => {
    if (asModal) {
      setIsOpen(true);
      // Don't auto-create link, let user choose expiry first
    } else {
      await handleShare();
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

  return (
    <div className="space-y-3">
      <Button
        onClick={onClick}
        disabled={loading}
        size={size ?? (iconOnly ? 'icon' : undefined)}
        variant={variant}
        className={`flex items-center ${iconOnly ? 'justify-center p-0' : 'gap-2'} ${className}`}
        title="Chia sẻ"
        aria-label="Chia sẻ"
      >
        <Share2 className={`h-4 w-4`} />
        {!iconOnly && (loading ? 'Đang tạo...' : 'Chia sẻ')}
      </Button>

      {!asModal && shareUrl && (
        <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
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
              onClick={handleCopy}
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
        </div>
      )}

      {error && !asModal && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {asModal && isOpen && createPortal(
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          {/* Transparent backdrop to allow outside-click close without dark overlay */}
          <div className="absolute inset-0 bg-transparent" onClick={() => setIsOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Chia sẻ"
            className="relative z-10 w-full max-w-lg max-h-[80vh] overflow-auto rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-gray-900 dark:ring-white/10"
          >
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4 dark:border-gray-800">
              <Share2 className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Chia sẻ</h3>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {loading && !shareUrl ? (
                <div className="text-sm text-gray-600 dark:text-gray-400">Đang tạo link chia sẻ...</div>
              ) : !shareUrl ? (
                <>
                  {/* Expiry Settings - Only show before creating link */}
                  <div className="mb-4 space-y-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Clock className="h-4 w-4" />
                      Thời gian hết hạn (tùy chọn)
                    </label>
                    <div className="space-y-2">
                      <select
                        value={expiresInDays === null ? '' : expiresInDays}
                        onChange={(e) => setExpiresInDays(e.target.value === '' ? null : parseInt(e.target.value))}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      >
                        <option value="">Không hết hạn</option>
                        <option value="1">1 ngày</option>
                        <option value="7">7 ngày</option>
                        <option value="30">30 ngày</option>
                        <option value="90">90 ngày</option>
                        <option value="180">180 ngày</option>
                        <option value="365">365 ngày</option>
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Link sẽ tự động hết hạn sau thời gian đã chọn
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      onClick={handleShare}
                      disabled={loading}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {loading ? 'Đang tạo...' : 'Tạo link chia sẻ'}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">Link chia sẻ</label>
                  <div className="mb-2 flex items-stretch gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={shareUrl ?? ''}
                        readOnly
                        className="w-full rounded-lg border border-gray-300 bg-gray-50 pl-9 pr-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        onFocus={e => e.target.select()}
                      />
                    </div>
                    <Button
                      onClick={handleCopy}
                      className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 text-white" />
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
                    <div className="mb-2 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                      <Clock className="h-3 w-3" />
                      <span>Hết hạn: {formatExpiryDate(expiresAt)}</span>
                    </div>
                  )}
                  
                  {copied && (
                    <div className="text-xs text-green-600 dark:text-green-400">Đã sao chép vào clipboard.</div>
                  )}
                  {error && (
                    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                      {error}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-3 dark:border-gray-800">
              {shareUrl && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShareUrl(null);
                    setExpiresAt(null);
                    setExpiresInDays(null);
                  }}
                >
                  Tạo link mới
                </Button>
              )}
              <Button variant="ghost" onClick={() => {
                setIsOpen(false);
                if (!shareUrl) {
                  setExpiresInDays(null);
                }
              }}>Đóng</Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

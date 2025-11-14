import { useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';

interface Friend { id: number; name: string; email: string }

interface Props {
  isOpen: boolean;
  onClose: () => void;
  photoIds?: number[];
  albumId?: number | null;
  defaultMessage?: string;
}

export default function ShareToFriendsModal({ isOpen, onClose, photoIds = [], albumId = null, defaultMessage = '' }: Props) {
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState<string>(defaultMessage);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    axios.get(route('friends.list'))
      .then(res => setFriends(res.data.data || []))
      .finally(() => setLoading(false));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSelected(new Set());
      setMessage(defaultMessage || '');
      setQ('');
    }
  }, [isOpen, defaultMessage]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return friends;
    return friends.filter(f => f.name.toLowerCase().includes(term) || f.email.toLowerCase().includes(term));
  }, [friends, q]);

  const toggle = (id: number) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelected(s);
  };

  const submit = () => {
    if (selected.size === 0) return;
    const payload: any = { friend_ids: Array.from(selected) };
    if (photoIds.length > 0) payload.photo_ids = photoIds;
    if (albumId) payload.album_id = albumId;
    if (message.trim()) payload.message = message.trim();

    router.post(route('friends.share'), payload, {
      preserveScroll: true,
      onSuccess: () => {
        onClose();
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-base font-semibold">Chia sẻ với bạn bè</h3>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-4 py-3">
          <div className="mb-3">
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Tìm theo tên hoặc email" className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>

          {loading ? (
            <div className="py-6 text-center text-sm text-gray-500">Đang tải danh sách bạn bè...</div>
          ) : (
            <ul className="space-y-2">
              {filtered.length === 0 ? (
                <li className="text-sm text-gray-500">Không có bạn bè phù hợp.</li>
              ) : filtered.map(f => (
                <li key={f.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{f.name}</div>
                    <div className="text-xs text-gray-500">{f.email}</div>
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={selected.has(f.id)} onChange={()=>toggle(f.id)} />
                    Chọn
                  </label>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4">
            <label className="mb-1 block text-xs text-gray-500">Lời nhắn (tuỳ chọn)</label>
            <textarea value={message} onChange={e=>setMessage(e.target.value)} className="h-20 w-full rounded-lg border px-3 py-2 text-sm" placeholder="Gửi lời nhắn cho bạn bè..." />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Hủy</button>
          <button onClick={submit} disabled={selected.size===0} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:bg-blue-300">Gửi</button>
        </div>
      </div>
    </div>
  );
}

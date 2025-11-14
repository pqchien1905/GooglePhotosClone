import { Link, usePage } from '@inertiajs/react';
import * as React from 'react';
import Input from '@/Components/ui/input';
import Button from '@/Components/ui/button';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { url, props } = usePage() as any;
  const auth = props?.auth;
  const [query, setQuery] = React.useState('');
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [dark]);

  const isActive = (href: string) => (url || '').startsWith(href);

  return (
    <div className="flex h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-gray-200 p-4 dark:border-gray-800 md:block">
        <div className="flex h-full flex-col">
          <div className="mb-4 flex items-center gap-2 px-2">
            <div className="h-8 w-8 rounded bg-blue-600" />
            <span className="text-lg">Photos</span>
          </div>
          <nav className="space-y-1 px-1">
            <Link href="/photos" className={`flex items-center justify-between rounded-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-900 ${isActive('/photos') ? 'bg-gray-100 font-medium dark:bg-gray-900' : ''}`}>
              <span className="flex items-center gap-3">
                <SvgPhoto className="h-5 w-5" />
                All Photos
              </span>
            </Link>
            <Link href="/favorites" className={`flex items-center justify-between rounded-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-900 ${isActive('/favorites') ? 'bg-gray-100 font-medium dark:bg-gray-900' : ''}`}>
              <span className="flex items-center gap-3">
                <SvgHeart className="h-5 w-5" />
                Favorites
              </span>
            </Link>
            <Link href="/albums" className={`flex items-center justify-between rounded-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-900 ${isActive('/albums') ? 'bg-gray-100 font-medium dark:bg-gray-900' : ''}`}>
              <span className="flex items-center gap-3">
                <SvgFolder className="h-5 w-5" />
                Albums
              </span>
            </Link>
            <Link href="/friends" className={`flex items-center justify-between rounded-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-900 ${isActive('/friends') ? 'bg-gray-100 font-medium dark:bg-gray-900' : ''}`}>
              <span className="flex items-center gap-3">
                <SvgPeople className="h-5 w-5" />
                Bạn bè
              </span>
            </Link>
            <Link href="/shares/received" className={`flex items-center justify-between rounded-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-900 ${isActive('/shares') ? 'bg-gray-100 font-medium dark:bg-gray-900' : ''}`}>
              <span className="flex items-center gap-3">
                <SvgShare className="h-5 w-5" />
                Được chia sẻ
              </span>
            </Link>
            <Link href="/notifications" className={`flex items-center justify-between rounded-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-900 ${isActive('/notifications') ? 'bg-gray-100 font-medium dark:bg-gray-900' : ''}`}>
              <span className="flex items-center gap-3">
                <SvgBell className="h-5 w-5" />
                Thông báo
              </span>
            </Link>
            <Link href="/trash" className={`flex items-center justify-between rounded-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-900 ${isActive('/trash') ? 'bg-gray-100 font-medium dark:bg-gray-900' : ''}`}>
              <span className="flex items-center gap-3">
                <SvgTrash className="h-5 w-5" />
                Trash
              </span>
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-gray-200 px-4 dark:border-gray-800">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative w-full max-w-2xl">
              <SvgSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your photos" className="pl-9 dark:bg-gray-900" />
            </div>
          </div>
          <Button variant="secondary" size="icon" title="Toggle dark mode" onClick={() => setDark((v) => !v)}>
            {dark ? <SvgSun className="h-5 w-5" /> : <SvgMoon className="h-5 w-5" />}
          </Button>
          <Button className="hidden sm:inline-flex">
            <SvgUpload className="mr-2 h-4 w-4" /> Upload
          </Button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
            {auth?.user?.name?.[0]?.toUpperCase() || 'U'}
          </button>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4">{children}</main>
      </div>
    </div>
  );
}

function SvgHeart({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>
  );
}
function SvgUpload({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 5 17 10"/><line x1="12" y1="5" x2="12" y2="21"/></svg>
  );
}
function SvgSearch({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  );
}
function SvgSun({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
  );
}
function SvgMoon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
  );
}
function SvgTrash({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M15 6V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v2"/></svg>
  );
}
function SvgFolder({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h5l2 3h9a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>
  );
}
function SvgPhoto({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>
  );
}
function SvgPeople({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  );
}
function SvgShare({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
  );
}
function SvgBell({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
  );
}

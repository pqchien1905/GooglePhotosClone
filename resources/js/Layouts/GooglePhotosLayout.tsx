import { Link, usePage, router } from '@inertiajs/react';
import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/Components/ui/dropdown-menu';
import { Button } from '@/Components/ui/button';
import { Menu, Search, Sun, Moon, Image, Video, Heart, FolderOpen, Share2, Users, Bell, Trash2, X } from 'lucide-react';
import BrandLogo from '@/Components/BrandLogo';
import Toast from '@/Components/ui/toast';

function formatBytes(bytes: number, precision = 2): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    bytes = Math.max(bytes, 0);
    const pow = Math.floor((bytes ? Math.log(bytes) : 0) / Math.log(1024));
    const powClamped = Math.min(pow, units.length - 1);
    bytes /= Math.pow(1024, powClamped);
    return bytes.toFixed(precision) + ' ' + units[powClamped];
}

export default function GooglePhotosLayout({ children }: PropsWithChildren) {
    const { auth, flash, storage } = usePage().props as any;
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
    const [search, setSearch] = useState('');
    const searchRef = useRef<HTMLInputElement | null>(null);
    const { theme, toggleTheme } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    const navItemClasses = (active: boolean) =>
        `flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-normal transition-colors duration-150 ${
            active
                ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/50'
        }`;

    useEffect(() => {
        if (flash?.success) {
            setToast({ message: flash.success as string, type: 'success' });
        } else if (flash?.error) {
            setToast({ message: flash.error as string, type: 'error' });
        } else if (flash?.warning) {
            setToast({ message: flash.warning as string, type: 'warning' });
        } else if (flash?.info) {
            setToast({ message: flash.info as string, type: 'info' });
        }
    }, [flash]);

    // Global '/' to focus search
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === '/') {
                const target = e.target as HTMLElement;
                const tag = (target?.tagName || '').toLowerCase();
                if (tag !== 'input' && tag !== 'textarea' && !target?.isContentEditable) {
                    e.preventDefault();
                    searchRef.current?.focus();
                }
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    return (
        <div className="flex h-screen bg-white dark:bg-[#202124]">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-0 md:w-16'} fixed md:relative inset-y-0 left-0 z-50 md:z-auto flex-shrink-0 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-smooth bg-white dark:bg-[#202124] overflow-hidden`}>
                <div className="flex h-full flex-col">
                    {/* Logo */}
                    <div className="flex h-14 items-center px-4">
                        <Link href="/photos" className="group flex items-center gap-2">
                            {sidebarOpen && <BrandLogo size={32} showText className="opacity-90 group-hover:opacity-100 transition-opacity duration-200" />}
                        </Link>
                        {/* Mobile close button */}
                        {sidebarOpen && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSidebarOpen(false)}
                                className="md:hidden ml-auto h-8 w-8"
                                aria-label="Đóng menu"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-0.5 px-2 py-2">
                        <Link
                            href="/photos"
                            className={navItemClasses(currentPath.startsWith('/photos'))}
                        >
                            <Image className="h-5 w-5" />
                            {sidebarOpen && <span>Ảnh</span>}
                        </Link>

                        <Link
                            href="/videos"
                            className={navItemClasses(currentPath.startsWith('/videos'))}
                        >
                            <Video className="h-5 w-5" />
                            {sidebarOpen && <span>Video</span>}
                        </Link>

                        <Link
                            href="/favorites"
                            className={navItemClasses(currentPath.startsWith('/favorites'))}
                        >
                            <Heart className="h-5 w-5" />
                            {sidebarOpen && <span>Yêu thích</span>}
                        </Link>

                        <Link
                            href="/albums"
                            className={navItemClasses(currentPath.startsWith('/albums'))}
                        >
                            <FolderOpen className="h-5 w-5" />
                            {sidebarOpen && <span>Albums</span>}
                        </Link>

                        <Link
                            href="/shares/received"
                            className={navItemClasses(currentPath.startsWith('/shares'))}
                        >
                            <Share2 className="h-5 w-5" />
                            {sidebarOpen && <span>Chia sẻ</span>}
                        </Link>

                        <Link
                            href="/friends"
                            className={navItemClasses(currentPath.startsWith('/friends'))}
                        >
                            <Users className="h-5 w-5" />
                            {sidebarOpen && <span>Bạn bè</span>}
                        </Link>

                        <Link
                            href="/notifications"
                            className={navItemClasses(currentPath.startsWith('/notifications'))}
                        >
                            <Bell className="h-5 w-5" />
                            {sidebarOpen && <span>Thông báo</span>}
                        </Link>

                        <Link
                            href="/trash"
                            className={navItemClasses(currentPath.startsWith('/trash'))}
                        >
                            <Trash2 className="h-5 w-5" />
                            {sidebarOpen && <span>Thùng rác</span>}
                        </Link>
                    </nav>

                    {/* Storage info */}
                    {sidebarOpen && (
                        <div className="border-t border-gray-200 dark:border-gray-800 p-3">
                            <div className="text-xs">
                                {storage ? (
                                    <>
                                        <div className="mb-2 flex items-center justify-between text-gray-600 dark:text-gray-400">
                                            <span className="text-xs font-normal">Dung lượng</span>
                                            <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                                {(storage.used / (1024*1024*1024)).toFixed(2)} GB / {(storage.limit / (1024*1024*1024)).toFixed(0)} GB
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                            <div
                                                className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-500 ease-out rounded-full"
                                                style={{ width: `${Math.min(100, (storage.used / storage.limit) * 100).toFixed(2)}%` }}
                                            />
                                        </div>
                                        <div className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                            {((storage.used / storage.limit) * 100).toFixed(1)}% đã sử dụng
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="mb-2 flex items-center justify-between text-gray-600 dark:text-gray-400">
                                            <span className="text-xs font-normal">Dung lượng</span>
                                            <span className="text-xs font-medium text-gray-900 dark:text-gray-100">-- / 15 GB</span>
                                        </div>
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                            <div className="h-full w-0 bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"></div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top Bar */}
                <header className="flex h-14 sm:h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#202124] px-3 sm:px-4 sticky top-0 z-40">
                    <div className="flex flex-1 items-center space-x-2 sm:space-x-3">
                        {/* Sidebar toggle (mobile/compact) */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen((s) => !s)}
                            title={sidebarOpen ? 'Thu gọn thanh bên' : 'Mở thanh bên'}
                            aria-label={sidebarOpen ? 'Thu gọn thanh bên' : 'Mở thanh bên'}
                            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        
                        {/* Search */}
                        <div className="flex-1 max-w-2xl">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                                <input
                                    type="text"
                                    ref={searchRef}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            router.get(route('photos.index'), { q: search }, { preserveScroll: true });
                                        }
                                    }}
                                    placeholder="Tìm kiếm (/ để tìm)"
                                    aria-label="Tìm kiếm ảnh và video"
                                    aria-describedby="search-hint"
                                    className="w-full rounded-full bg-gray-100 dark:bg-gray-800 py-2 pl-10 pr-4 text-sm text-gray-900 dark:text-gray-100 border-0 outline-none focus:bg-white dark:focus:bg-gray-700 focus:shadow-md transition-all duration-150 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                />
                                <span id="search-hint" className="sr-only">Nhấn Enter để tìm kiếm hoặc / để focus vào ô tìm kiếm</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        {/* Dark Mode Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleTheme}
                            title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
                            className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            {theme === 'dark' ? (
                                <Sun className="h-5 w-5" />
                            ) : (
                                <Moon className="h-5 w-5" />
                            )}
                        </Button>

                        {/* User Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 hover:bg-gray-100 dark:hover:bg-gray-800">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={auth.user.avatar_path ? `/storage/${auth.user.avatar_path}` : undefined} alt={auth.user.name} />
                                        <AvatarFallback className="bg-blue-600 dark:bg-blue-500 text-white text-sm font-medium">
                                            {auth.user.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-0.5">
                                        <p className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100">{auth.user.name}</p>
                                        <p className="text-xs leading-none text-gray-500 dark:text-gray-400">{auth.user.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                
                                {/* Storage Info */}
                                {(auth.user as any).storage_used !== undefined && (
                                    <>
                                        <div className="px-2 py-2">
                                            <div className="mb-1.5 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                                                <span className="font-normal">Dung lượng đã dùng</span>
                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                    {((auth.user as any).storage_percentage ?? 0).toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="mb-1.5 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
                                                    style={{ width: `${Math.min((auth.user as any).storage_percentage ?? 0, 100)}%` }}
                                                />
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {formatBytes((auth.user as any).storage_used ?? 0)} / {formatBytes((auth.user as any).storage_quota ?? 0)}
                                            </div>
                                        </div>
                                        <DropdownMenuSeparator />
                                    </>
                                )}
                                
                                <DropdownMenuItem asChild>
                                    <Link href="/profile" className="cursor-pointer">
                                        Quản lý tài khoản
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/logout" method="post" as="button" className="w-full cursor-pointer text-red-600 dark:text-red-400">
                                        Đăng xuất
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto bg-white dark:bg-[#202124]">
                    <div className="p-2">{children}</div>
                </main>

                       {/* Toast */}
                       {toast && (
                           <Toast
                               message={toast.message}
                               type={toast.type}
                               onClose={() => setToast(null)}
                           />
                       )}

                       {/* ARIA Live Region for Screen Readers */}
                       <div
                           aria-live="polite"
                           aria-atomic="true"
                           className="sr-only"
                       >
                           {toast && toast.message}
                       </div>
                   </div>
               </div>
           );
       }

import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState } from 'react';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const user = usePage().props.auth.user;
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const navItems = [
        {
            name: 'Ảnh',
            href: route('photos.index'),
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
            active: route().current('photos.index'),
        },
        {
            name: 'Album',
            href: route('albums.index'),
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
            active: route().current('albums.*'),
        },
        {
            name: 'Thùng rác',
            href: route('trash.index'),
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            ),
            active: route().current('trash.index'),
        },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-white">
            {/* Sidebar */}
            <aside
                className={`${
                    sidebarOpen ? 'w-64' : 'w-20'
                } border-r border-gray-200 bg-white transition-all duration-300 ease-in-out`}
            >
                <div className="flex h-full flex-col">
                    {/* Logo & Menu Toggle */}
                    <div className="flex h-16 items-center justify-between px-4">
                        <Link href="/" className="flex items-center space-x-2">
                            <svg className="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                            </svg>
                            {sidebarOpen && (
                                <span className="text-xl font-normal text-gray-700">Google Photos</span>
                            )}
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="rounded-full p-2 hover:bg-gray-100"
                        >
                            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1 px-2 py-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center space-x-3 rounded-full px-4 py-3 text-sm font-medium transition-colors ${
                                    item.active
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <span className={item.active ? 'text-blue-600' : 'text-gray-600'}>
                                    {item.icon}
                                </span>
                                {sidebarOpen && <span>{item.name}</span>}
                            </Link>
                        ))}
                    </nav>

                    {/* Storage Info */}
                    {sidebarOpen && (
                        <div className="border-t border-gray-200 p-4">
                            <div className="text-xs text-gray-600">
                                <div className="mb-2">Bộ nhớ đã dùng</div>
                                <div className="mb-1 h-1 w-full rounded-full bg-gray-200">
                                    <div className="h-1 w-1/4 rounded-full bg-blue-600"></div>
                                </div>
                                <div className="text-gray-500">0.5 GB / 15 GB</div>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top Bar */}
                <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
                    {/* Search Bar */}
                    <div className="flex flex-1 items-center">
                        <div className="relative w-full max-w-2xl">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Tìm kiếm ảnh của bạn"
                                className="w-full rounded-lg border-0 bg-gray-100 py-2 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center space-x-3">
                        <button className="rounded-full p-2 text-gray-600 hover:bg-gray-100">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>

                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="flex items-center space-x-2 rounded-full p-1 hover:bg-gray-100">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                </button>
                            </Dropdown.Trigger>

                            <Dropdown.Content align="right" width="48">
                                <div className="px-4 py-3 border-b border-gray-100">
                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                    <div className="text-xs text-gray-500">{user.email}</div>
                                </div>
                                <Dropdown.Link href={route('profile.edit')}>Hồ sơ</Dropdown.Link>
                                <Dropdown.Link href={route('logout')} method="post" as="button">
                                    Đăng xuất
                                </Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-white">
                    {header && (
                        <div className="border-b border-gray-200 bg-white px-6 py-4">
                            {header}
                        </div>
                    )}
                    <div className="px-6 py-4">{children}</div>
                </main>
            </div>
        </div>
    );
}

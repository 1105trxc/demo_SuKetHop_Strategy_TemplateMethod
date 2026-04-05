import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, BookOpenText, Users, CreditCard,
    LogOut, Tag, BadgePercent, UserCheck
} from 'lucide-react';

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const menuItems = [
        { path: '/admin',                    icon: LayoutDashboard, label: 'Tổng quan',      end: true },
        { path: '/admin/courses',            icon: BookOpenText,    label: 'Khóa học' },
        { path: '/admin/instructor-requests',icon: UserCheck,       label: 'Giảng viên' },
        { path: '/admin/refunds',            icon: CreditCard,      label: 'Hoàn tiền' },
        { path: '/admin/coupons',            icon: BadgePercent,    label: 'Mã giảm giá' },
        { path: '/admin/categories',         icon: Tag,             label: 'Danh mục' },
        { path: '/admin/users',              icon: Users,           label: 'Người dùng' },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user?.roles?.includes('ROLE_ADMIN')) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 flex-col gap-4">
                <div className="text-xl font-bold">403 Lỗi</div>
                <p>Bạn không có quyền truy cập khu vực này.</p>
                <button onClick={() => navigate('/')} className="text-violet-600 underline">Về trang chủ</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 sticky top-0 h-screen">
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-sm shadow-lg text-white font-black">E</span>
                        Admin Panel
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">Quản trị hệ thống</p>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {menuItems.map(item => (
                        <NavLink
                            key={item.path}
                            end={item.end}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                                    isActive
                                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/50'
                                        : 'hover:bg-slate-800 hover:text-white text-slate-400'
                                }`
                            }
                        >
                            <item.icon size={17} /> {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* User Info + Logout */}
                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 mb-3 px-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center font-black text-white text-sm shrink-0">
                            {user.fullName?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-bold text-sm text-white truncate">{user.fullName}</p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition"
                    >
                        <LogOut size={15} /> Đăng xuất
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto h-screen bg-slate-50/50">
                <div className="p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

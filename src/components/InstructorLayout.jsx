import { Outlet, Navigate, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, BookOpen, PlusCircle, LogOut, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InstructorLayout() {
    const { user, logout } = useAuth();

    if (!user || !user?.roles?.includes('ROLE_INSTRUCTOR')) {
        return <Navigate to="/" replace />;
    }

    const menuItems = [
        { path: '/instructor', icon: LayoutDashboard, label: 'Thống kê Tổng quan', end: true },
        { path: '/instructor/courses', icon: BookOpen, label: 'Khóa học của tôi', end: false },
        { path: '/instructor/courses/create', icon: PlusCircle, label: 'Tạo khóa học mới', end: false },
    ];

    const handleLogout = () => {
        logout();
        toast.success("Đã đăng xuất");
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 z-10">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-violet-600">
                        <GraduationCap size={32} />
                        <span className="text-xl font-black tracking-tight">Hub<span className="text-slate-800">Mới</span></span>
                    </Link>
                </div>
                
                <div className="py-2 px-4 mb-2">
                    <div className="bg-violet-50 text-violet-700 px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-violet-600"></div> Instructor Center
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    {menuItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition duration-200 ${
                                    isActive 
                                    ? 'bg-violet-600 text-white shadow-md shadow-violet-200' 
                                    : 'text-slate-500 hover:bg-slate-100'
                                }`
                            }
                        >
                            <item.icon size={20} strokeWidth={2.5} />
                            {item.label}
                        </NavLink>
                    ))}
                </div>

                <div className="p-4 border-t border-slate-100">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold w-full text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                    >
                        <LogOut size={20} strokeWidth={2.5} />
                        Đăng xuất
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 ml-64 p-8">
                <div className="max-w-6xl mx-auto">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

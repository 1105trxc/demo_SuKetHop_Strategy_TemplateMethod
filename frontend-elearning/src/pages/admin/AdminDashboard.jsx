import { useState, useEffect } from 'react';
import { BookOpenText, Users, CreditCard, Activity, UserCheck, BadgePercent } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        axiosClient.get('/admin/stats').then(res => setStats(res.data)).catch(() => {});
    }, []);

    const statCards = [
        {
            label: 'Khóa học chờ duyệt',
            value: stats?.pendingCourses ?? '--',
            icon: BookOpenText,
            color: 'from-amber-500 to-orange-500',
            shadow: 'shadow-amber-500/20'
        },
        {
            label: 'Tổng người dùng',
            value: stats?.totalUsers ?? '--',
            icon: Users,
            color: 'from-indigo-500 to-violet-500',
            shadow: 'shadow-indigo-500/20'
        },
        {
            label: 'Yêu cầu Giảng viên',
            value: stats?.pendingInstructorRequests ?? '--',
            icon: UserCheck,
            color: 'from-emerald-500 to-teal-500',
            shadow: 'shadow-emerald-500/20'
        },
        {
            label: 'Hoàn tiền chờ duyệt',
            value: stats?.pendingRefunds ?? '--',
            icon: CreditCard,
            color: 'from-rose-500 to-pink-500',
            shadow: 'shadow-rose-500/20'
        },
        {
            label: 'Tổng khóa học',
            value: stats?.totalCourses ?? '--',
            icon: Activity,
            color: 'from-blue-500 to-cyan-500',
            shadow: 'shadow-blue-500/20'
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900">Tổng quan hệ thống</h1>
                <p className="text-slate-500 mt-1 text-sm">Theo dõi số liệu thống kê và trạng thái hiện tại.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {statCards.map(s => (
                    <div
                        key={s.label}
                        className={`bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-md ${s.shadow}`}
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br ${s.color} shrink-0`}>
                            <s.icon size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-tight">{s.label}</p>
                            <p className="text-2xl font-black text-slate-800 mt-0.5">{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-black text-slate-800 mb-1 flex items-center gap-2">
                        <BookOpenText size={18} className="text-violet-500" /> Hướng dẫn nhanh
                    </h3>
                    <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
                        <li className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                            Vào <strong>Khóa học</strong> để phê duyệt hoặc từ chối các bài đăng của giảng viên.
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                            Vào <strong>Giảng viên</strong> để xét duyệt đơn đăng ký của học viên.
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                            Vào <strong>Hoàn tiền</strong> để xử lý yêu cầu và cộng tiền vào ví học viên.
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">4</span>
                            Quản lý <strong>Mã giảm giá</strong> và <strong>Danh mục</strong> từ menu bên trái.
                        </li>
                    </ul>
                </div>

                <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-6 rounded-2xl text-white shadow-lg shadow-violet-500/30">
                    <BadgePercent size={28} className="mb-3 opacity-80" />
                    <h3 className="font-black text-lg mb-1">Quản lý nhanh</h3>
                    <p className="text-violet-200 text-sm mb-4">Thực hiện các hành động phổ biến.</p>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { label: 'Duyệt khóa học', href: '/admin/courses' },
                            { label: 'Duyệt giảng viên', href: '/admin/instructor-requests' },
                            { label: 'Xử lý hoàn tiền', href: '/admin/refunds' },
                            { label: 'Thêm danh mục', href: '/admin/categories' },
                        ].map(link => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 text-sm font-medium transition text-center"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { Users, DollarSign, BookOpen, UserPlus, TrendingUp } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

export default function InstructorDashboard() {
    const [stats, setStats] = useState({
        totalCourses: 0,
        publishedCourses: 0,
        pendingCourses: 0,
        totalRevenue: 0,
        totalStudents: 0,
        totalEnrollments: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axiosClient.get('/instructor/stats');
                setStats(res.data);
            } catch (err) {
                toast.error('Không thể tải thống kê bảng điều khiển.');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const statCards = [
        {
            title: 'Tổng Doanh Thu',
            value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalRevenue),
            icon: DollarSign,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100'
        },
        {
            title: 'Tổng Số Học Viên',
            value: stats.totalStudents,
            icon: Users,
            color: 'text-violet-600',
            bg: 'bg-violet-100'
        },
        {
            title: 'Lượt Đăng Ký',
            value: stats.totalEnrollments,
            icon: UserPlus,
            color: 'text-blue-600',
            bg: 'bg-blue-100'
        },
        {
            title: 'Khóa học Xuất bản',
            value: `${stats.publishedCourses} / ${stats.totalCourses}`,
            icon: BookOpen,
            color: 'text-amber-600',
            bg: 'bg-amber-100'
        }
    ];

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 mb-2">Bảng Điều Khiển Giảng Viên</h1>
                <p className="text-slate-500">Xem tổng quan về hiệu suất và sự phát triển của các khóa học của bạn.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((card, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${card.bg} ${card.color}`}>
                            <card.icon size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 mb-1">{card.title}</p>
                            <h3 className="text-2xl font-black text-slate-900">{card.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center text-slate-500 flex flex-col items-center justify-center min-h-[300px]">
                <TrendingUp size={48} className="text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Biểu đồ sự phát triển (Sắp tới)</h3>
                <p>Nền tảng của chúng tôi đang thu thập dữ liệu về hiệu suất của bạn.</p>
            </div>
        </div>
    );
}

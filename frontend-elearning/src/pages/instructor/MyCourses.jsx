import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, BookOpen, Eye, Loader2, AlertTriangle,
    Pencil, Trash2, Send, CheckCircle2, Clock, EyeOff
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
    DRAFT:            { text: 'Nháp',       cls: 'bg-slate-100 text-slate-600 border border-slate-200', icon: <Pencil size={11}/> },
    PENDING_APPROVAL: { text: 'Chờ duyệt',  cls: 'bg-amber-100 text-amber-700 border border-amber-200', icon: <Clock size={11}/> },
    PUBLISHED:        { text: 'Đang bán',   cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200', icon: <CheckCircle2 size={11}/> },
    HIDDEN:           { text: 'Đã ẩn',      cls: 'bg-red-100 text-red-500 border border-red-200', icon: <EyeOff size={11}/> },
};

export default function MyCourses() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState(null); // courseId đang confirm xóa

    useEffect(() => {
        axiosClient.get('/courses/my-courses')
            .then(res => setCourses(res.data))
            .catch(() => toast.error('Không thể tải danh sách khóa học.'))
            .finally(() => setLoading(false));
    }, []);

    const handleSubmitApproval = async (courseId) => {
        const id = toast.loading('Đang gửi kiểm duyệt...');
        try {
            await axiosClient.patch(`/courses/${courseId}/submit-approval`);
            toast.dismiss(id);
            toast.success('Đã gửi yêu cầu kiểm duyệt!');
            setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: 'PENDING_APPROVAL' } : c));
        } catch (err) {
            toast.dismiss(id);
            toast.error(err.response?.data?.message || 'Lỗi khi gửi kiểm duyệt');
        }
    };

    const handleDelete = async (courseId) => {
        const id = toast.loading('Đang xóa...');
        try {
            await axiosClient.delete(`/courses/${courseId}`);
            toast.dismiss(id);
            toast.success('Đã xóa khóa học!');
            setCourses(prev => prev.filter(c => c.id !== courseId));
            setDeleteConfirm(null);
        } catch (err) {
            toast.dismiss(id);
            toast.error(err.response?.data?.message || 'Không thể xóa khóa học này!');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50/30 py-10 px-4">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Khóa học của tôi</h1>
                        <p className="text-slate-500 text-sm mt-1">{courses.length} khoá học • Quản lý và theo dõi tiến trình phê duyệt</p>
                    </div>
                    <button
                        onClick={() => navigate('/instructor/courses/create')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 hover:from-violet-700 hover:to-indigo-700 transition hover:-translate-y-0.5"
                    >
                        <Plus size={18} /> Tạo khóa học mới
                    </button>
                </div>

                {/* Delete Confirmation Modal */}
                {deleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 text-center mb-2">Xóa khóa học?</h3>
                            <p className="text-slate-500 text-sm text-center mb-6">
                                Hành động này không thể hoàn tác. Tất cả chương và bài học sẽ bị xóa.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
                                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition"
                                >
                                    Xóa
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {courses.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-16 text-center">
                        <BookOpen className="w-14 h-14 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-500 mb-2">Chưa có khóa học nào</h3>
                        <p className="text-slate-400 text-sm mb-6">Bắt đầu tạo khóa học đầu tiên của bạn!</p>
                        <button
                            onClick={() => navigate('/instructor/courses/create')}
                            className="px-6 py-2.5 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition"
                        >
                            Tạo ngay
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {courses.map(course => {
                            const statusCfg = STATUS_CONFIG[course.status] ?? STATUS_CONFIG.DRAFT;
                            const isDraft = course.status === 'DRAFT';
                            return (
                                <div
                                    key={course.id}
                                    className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition group overflow-hidden flex flex-col"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative h-40 bg-slate-100 overflow-hidden shrink-0">
                                        {course.thumbnailUrl ? (
                                            <img
                                                src={course.thumbnailUrl}
                                                alt={course.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <AlertTriangle size={28} className="text-slate-300" />
                                            </div>
                                        )}
                                        <span className={`absolute top-2 right-2 text-[11px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${statusCfg.cls}`}>
                                            {statusCfg.icon} {statusCfg.text}
                                        </span>
                                    </div>

                                    {/* Info */}
                                    <div className="p-4 flex flex-col flex-1">
                                        <h3 className="font-bold text-slate-900 text-sm line-clamp-2 mb-1">{course.title}</h3>
                                        <p className="text-violet-600 font-bold text-sm mb-2">
                                            {course.price
                                                ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price)
                                                : 'Miễn phí'
                                            }
                                        </p>

                                        {/* Rejection reason */}
                                        {isDraft && course.rejectReason && (
                                            <div className="mb-3 text-[11px] text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100 font-medium">
                                                ⛔ Bị từ chối: {course.rejectReason}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="mt-auto pt-3 border-t border-slate-50 flex items-center gap-2 flex-wrap">
                                            <button
                                                onClick={() => navigate(`/courses/${course.id}`)}
                                                title="Xem trang khóa học"
                                                className="flex items-center gap-1 text-xs text-slate-500 hover:text-violet-600 transition font-medium px-2 py-1.5 rounded-lg hover:bg-violet-50"
                                            >
                                                <Eye size={13} /> Xem
                                            </button>

                                            {isDraft && (
                                                <>
                                                    <button
                                                        onClick={() => navigate(`/instructor/courses/${course.id}/edit`)}
                                                        title="Chỉnh sửa"
                                                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 transition font-medium px-2 py-1.5 rounded-lg hover:bg-indigo-50"
                                                    >
                                                        <Pencil size={13} /> Sửa
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(course.id)}
                                                        title="Xóa"
                                                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 transition font-medium px-2 py-1.5 rounded-lg hover:bg-red-50"
                                                    >
                                                        <Trash2 size={13} /> Xóa
                                                    </button>
                                                    <button
                                                        onClick={() => handleSubmitApproval(course.id)}
                                                        className="ml-auto flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white rounded-lg transition-colors"
                                                    >
                                                        <Send size={11} /> Gửi duyệt
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

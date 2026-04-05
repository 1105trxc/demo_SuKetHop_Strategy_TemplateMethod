import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Eye, EyeOff, Loader2, Clock, Filter } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

const STATUS_CFG = {
    PENDING_APPROVAL: { text: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-700 border border-amber-200' },
    PUBLISHED:        { text: 'Đang bán',  cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
    DRAFT:            { text: 'Nháp',      cls: 'bg-slate-100 text-slate-600' },
    HIDDEN:           { text: 'Đã ẩn',    cls: 'bg-red-100 text-red-500' },
};

export default function AdminCourses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('PENDING_APPROVAL');
    const [rejectModal, setRejectModal] = useState(null); // courseId
    const [rejectReason, setRejectReason] = useState('');
    const navigate = useNavigate();

    const fetchCourses = () => {
        setLoading(true);
        const url = filter === 'ALL' ? '/admin/courses/all' : '/admin/courses/pending';
        axiosClient.get(url)
            .then(res => setCourses(res.data))
            .catch(() => toast.error('Không thể tải danh sách khóa học.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchCourses(); }, [filter]); // eslint-disable-line

    const handleApprove = async (id) => {
        const t = toast.loading('Đang duyệt...');
        try {
            await axiosClient.patch(`/admin/courses/${id}/approve`);
            toast.dismiss(t); toast.success('Đã phê duyệt khóa học!');
            fetchCourses();
        } catch (e) { toast.dismiss(t); toast.error(e.response?.data?.message || 'Lỗi!'); }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) return toast.error('Vui lòng nhập lý do từ chối.');
        const t = toast.loading('Đang từ chối...');
        try {
            await axiosClient.patch(`/admin/courses/${rejectModal}/reject`, { reason: rejectReason });
            toast.dismiss(t); toast.success('Đã từ chối khóa học.');
            setRejectModal(null); setRejectReason('');
            fetchCourses();
        } catch (e) { toast.dismiss(t); toast.error(e.response?.data?.message || 'Lỗi!'); }
    };

    const handleHide = async (id) => {
        const t = toast.loading('Đang thu hồi...');
        try {
            await axiosClient.patch(`/admin/courses/${id}/hide`);
            toast.dismiss(t); toast.success('Đã thu hồi khóa học.');
            fetchCourses();
        } catch (e) { toast.dismiss(t); toast.error(e.response?.data?.message || 'Lỗi!'); }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Kiểm duyệt Khóa học</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Phê duyệt hoặc từ chối khóa học từ giảng viên.</p>
                </div>
                <div className="flex gap-2 items-center">
                    <Filter size={16} className="text-slate-400" />
                    {['PENDING_APPROVAL', 'ALL'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${filter === f ? 'bg-violet-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-violet-300'}`}
                        >
                            {f === 'PENDING_APPROVAL' ? 'Chờ duyệt' : 'Tất cả'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Reject Modal */}
            {rejectModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="font-black text-slate-900 mb-4">Lý do từ chối</h3>
                        <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            rows={4} placeholder="Nhập lý do cụ thể để giảng viên có thể cải thiện..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none resize-none text-sm"
                        />
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => { setRejectModal(null); setRejectReason(''); }}
                                className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition">
                                Hủy
                            </button>
                            <button onClick={handleReject}
                                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition">
                                Từ chối
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></div>
            ) : courses.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
                    <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-bold">Không có khóa học nào cần xử lý</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Khóa học</th>
                                <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Giảng viên</th>
                                <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Giá</th>
                                <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {courses.map(c => {
                                const s = STATUS_CFG[c.status] ?? STATUS_CFG.DRAFT;
                                return (
                                    <tr key={c.id} className="hover:bg-slate-50/50 transition">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                {c.thumbnailUrl && (
                                                    <img src={c.thumbnailUrl} alt="" className="w-12 h-9 object-cover rounded-lg shrink-0" />
                                                )}
                                                <span className="font-semibold text-slate-900 text-sm line-clamp-2 max-w-xs">{c.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-600">{c.instructorName}</td>
                                        <td className="px-5 py-4 text-sm font-bold text-violet-600">
                                            {c.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c.price) : 'Free'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${s.cls}`}>{s.text}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => navigate(`/courses/${c.id}`)}
                                                    title="Xem chi tiết"
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition">
                                                    <Eye size={15} />
                                                </button>
                                                {c.status === 'PENDING_APPROVAL' && (
                                                    <>
                                                        <button onClick={() => handleApprove(c.id)}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white font-bold text-xs transition">
                                                            <CheckCircle2 size={13} /> Duyệt
                                                        </button>
                                                        <button onClick={() => setRejectModal(c.id)}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white font-bold text-xs transition">
                                                            <XCircle size={13} /> Từ chối
                                                        </button>
                                                    </>
                                                )}
                                                {c.status === 'PUBLISHED' && (
                                                    <button onClick={() => handleHide(c.id)}
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-600 hover:text-white font-bold text-xs transition">
                                                        <EyeOff size={13} /> Thu hồi
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

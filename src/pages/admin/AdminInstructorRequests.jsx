import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2, UserCheck, Clock } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

const STATUS_CFG = {
    PENDING:  { text: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-700 border border-amber-200' },
    APPROVED: { text: 'Đã duyệt',  cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
    REJECTED: { text: 'Từ chối',   cls: 'bg-red-100 text-red-500 border border-red-200' },
};

export default function AdminInstructorRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('PENDING');

    const fetchRequests = () => {
        setLoading(true);
        const url = filter === 'ALL' ? '/admin/instructor-requests' : '/admin/instructor-requests/pending';
        axiosClient.get(url)
            .then(res => setRequests(res.data))
            .catch(() => toast.error('Không thể tải danh sách.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchRequests(); }, [filter]); // eslint-disable-line

    const handleApprove = async (id) => {
        const t = toast.loading('Đang duyệt...');
        try {
            await axiosClient.put(`/admin/instructor-requests/${id}/approve`);
            toast.dismiss(t); toast.success('Đã phê duyệt giảng viên!');
            fetchRequests();
        } catch (e) { toast.dismiss(t); toast.error(e.response?.data?.message || 'Lỗi!'); }
    };

    const handleReject = async (id) => {
        const t = toast.loading('Đang từ chối...');
        try {
            await axiosClient.put(`/admin/instructor-requests/${id}/reject`);
            toast.dismiss(t); toast.success('Đã từ chối yêu cầu.');
            fetchRequests();
        } catch (e) { toast.dismiss(t); toast.error(e.response?.data?.message || 'Lỗi!'); }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Duyệt Giảng viên</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Xét duyệt đơn đăng ký trở thành giảng viên.</p>
                </div>
                <div className="flex gap-2">
                    {['PENDING', 'ALL'].map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${filter === f ? 'bg-violet-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-violet-300'}`}>
                            {f === 'PENDING' ? 'Chờ duyệt' : 'Tất cả'}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></div>
            ) : requests.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
                    <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-bold">Không có yêu cầu nào cần xử lý</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                {['Ứng viên', 'Chuyên môn', 'Hồ sơ', 'Ngày nộp', 'Trạng thái', 'Hành động'].map(h => (
                                    <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {requests.map(req => {
                                const s = STATUS_CFG[req.status] ?? STATUS_CFG.PENDING;
                                return (
                                    <tr key={req.id} className="hover:bg-slate-50/50 transition">
                                        <td className="px-5 py-4">
                                            <div>
                                                <p className="font-semibold text-slate-900 text-sm">{req.userFullName}</p>
                                                <p className="text-xs text-slate-400">{req.userEmail}</p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-600">{req.expertise}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col gap-1">
                                                {req.portfolioUrl && (
                                                    <a href={req.portfolioUrl} target="_blank" rel="noreferrer"
                                                        className="text-xs text-violet-600 hover:underline font-medium">Portfolio ↗</a>
                                                )}
                                                {req.cvFileUrl && (
                                                    <a href={req.cvFileUrl} target="_blank" rel="noreferrer"
                                                        className="text-xs text-violet-600 hover:underline font-medium">CV ↗</a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-xs text-slate-400">
                                            {req.createdAt ? new Date(req.createdAt).toLocaleDateString('vi-VN') : '--'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${s.cls}`}>{s.text}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            {req.status === 'PENDING' && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleApprove(req.id)}
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white font-bold text-xs transition">
                                                        <CheckCircle2 size={13} /> Duyệt
                                                    </button>
                                                    <button onClick={() => handleReject(req.id)}
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white font-bold text-xs transition">
                                                        <XCircle size={13} /> Từ chối
                                                    </button>
                                                </div>
                                            )}
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

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PackageSearch, Clock, CheckCircle2, Ticket, XCircle, Search, AlertCircle, ChevronRight, CornerDownRight } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';

export default function OrderHistory() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refundModal, setRefundModal] = useState(null); // orderItemId
    const [refundReason, setRefundReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchOrders = () => {
        setLoading(true);
        axiosClient.get('/orders/my-orders')
            .then(res => setOrders(res.data))
            .catch(() => toast.error('Không thể tải lịch sử đơn hàng.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleRequestRefund = async (e) => {
        e.preventDefault();
        if (!refundReason.trim()) return toast.error('Vui lòng nhập lý do hoàn tiền.');
        setSubmitting(true);
        try {
            await axiosClient.post('/refunds', {
                orderItemId: refundModal,
                reason: refundReason
            });
            toast.success('Yêu cầu hoàn tiền đã được gửi. Quản trị viên sẽ xem xét.');
            setRefundModal(null);
            setRefundReason('');
            fetchOrders();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra.');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'COMPLETED':
            case 'PAID': return 'bg-emerald-100 text-emerald-700';
            case 'PENDING': return 'bg-amber-100 text-amber-700';
            case 'CANCELLED':
            case 'FAILED': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-black text-slate-900 mb-2">Lịch sử Đơn hàng</h1>
            <p className="text-slate-500 mb-8">Kiểm tra các khóa học bạn đã mua và yêu cầu hỗ trợ nếu cần.</p>

            {orders.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-16 text-center">
                    <PackageSearch className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Chưa có đơn hàng nào</h3>
                    <p className="text-slate-500 mb-6">Bạn chưa thực hiện giao dịch nào trên hệ thống.</p>
                    <Link to="/courses" className="px-6 py-2.5 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition">
                        Khám phá khóa học
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {orders.map(order => (
                        <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            {/* Header Don hang */}
                            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-6">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ngày mua</p>
                                        <p className="font-semibold text-slate-800">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tổng tiền</p>
                                        <p className="font-black text-violet-600">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.finalPrice)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mã đơn</p>
                                        <p className="font-mono text-sm text-slate-600 uppercase">{order.id.split('-')[0]}</p>
                                    </div>
                                </div>
                                <div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>

                            {/* Chi tiet Items */}
                            <div className="p-6">
                                <div className="space-y-4">
                                    {order.items.map(item => (
                                        <div key={item.id} className="flex gap-4">
                                            <img src={item.courseThumbnailUrl} alt={item.courseTitle} className="w-32 h-20 object-cover rounded-xl shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-900 mb-1 truncate">{item.courseTitle}</h4>
                                                <p className="text-sm font-semibold text-slate-600">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.priceAtPurchase)}
                                                </p>
                                                
                                                {/* Actions / Status */}
                                                <div className="mt-3 flex items-center justify-between">
                                                    <div>
                                                        {item.refundStatus ? (
                                                            <div className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 inline-flex">
                                                                <AlertCircle size={14} /> Hoàn tiền: {item.refundStatus}
                                                            </div>
                                                        ) : (
                                                            <Link to={`/learning/${item.courseId}`} className="text-sm font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1">
                                                                Đến lớp học <ChevronRight size={16} />
                                                            </Link>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Hien thi nut hoan tien neu Order la thanh cong va chua Refund */}
                                                    {(order.status === 'COMPLETED' || order.status === 'PAID') && !item.refundStatus && (
                                                        <button 
                                                            onClick={() => setRefundModal(item.id)}
                                                            className="text-sm flex items-center gap-1.5 font-semibold text-slate-500 hover:text-rose-500 transition"
                                                        >
                                                            <CornerDownRight size={16} /> Yêu cầu hoàn tiền
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Refund Modal */}
            {refundModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-black text-slate-900 mb-2">Yêu cầu hoàn tiền</h3>
                        <p className="text-slate-500 text-sm mb-6">Xin lưu ý: Sau khi hoàn tiền, bạn sẽ mất quyền truy cập vào khóa học này. Thời gian xử lý từ 1-3 ngày làm việc.</p>
                        
                        <form onSubmit={handleRequestRefund}>
                            <textarea
                                value={refundReason}
                                onChange={e => setRefundReason(e.target.value)}
                                placeholder="Hãy cho chúng tôi biết lý do bạn muốn hoàn tiền..."
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 outline-none resize-none text-sm mb-6"
                            />
                            
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setRefundModal(null); setRefundReason(''); }}
                                    className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 disabled:opacity-50 transition flex items-center justify-center gap-2"
                                >
                                    {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

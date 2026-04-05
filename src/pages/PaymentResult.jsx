import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, BookOpen } from 'lucide-react';
import { useCart } from '../context/CartContext';
import axiosClient from '../api/axiosClient';

export default function PaymentResult() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { removeMultipleFromCart } = useCart();

    const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
    const [message, setMessage] = useState('Đang đối soát giao dịch với Server...');

    useEffect(() => {
        let pollingTimer = null;
        let isPolling = true;

        const verifyPayment = async () => {
            let provider = searchParams.get('provider');
            if (!provider && searchParams.get('partnerCode') === 'MOMO') {
                provider = 'MOMO'; // Nhận diện MoMo API Sandbox
            }

            if (!provider) {
                setStatus('error');
                setMessage('Không tìm thấy thông tin cổng thanh toán.');
                return;
            }

            // 1. Lấy mã Order từ URL
            let orderRef = '';
            if (provider === 'VNPAY') {
                orderRef = searchParams.get('vnp_TxnRef');
            } else if (provider === 'MOMO') {
                orderRef = searchParams.get('orderId') || searchParams.get('momo_OrderRef');
            } else if (provider === 'SEPAY') {
                orderRef = searchParams.get('orderRef');
            }

            if (provider !== 'SEPAY') {
                await new Promise(r => setTimeout(r, 1500)); // Delay cho VNPAY/MOMO
            }

            if (!isPolling) return;

            // 3. Call DB kiểm tra Trạng thái Đơn Hàng THỰC SỰ
            try {
                const res = await axiosClient.get(`/orders/${orderRef}`);
                const orderData = res.data?.data || res.data;

                if (orderData.status === 'PAID' || orderData.status === 'COMPLETED') {
                    isPolling = false;
                    setStatus('success');
                    setMessage(`Thanh toán THÀNH CÔNG qua ${provider}! Hệ thống đã ghi nhận.`);
                    
                    // Xoá giỏ hàng an toàn
                    const pendingCheckoutStr = sessionStorage.getItem('pending_checkout');
                    if (pendingCheckoutStr) {
                        try {
                            const pendingIds = JSON.parse(pendingCheckoutStr);
                            removeMultipleFromCart(pendingIds);
                            sessionStorage.removeItem('pending_checkout');
                        } catch (e) {
                            console.error('Lỗi khi parse pending_checkout:', e);
                        }
                    }
                } else {
                    if (provider === 'SEPAY') {
                        // Chuyển khoản: Vẫn chờ quét ảnh QR, tiếp tục lặp
                        setStatus('sepay_waiting');
                        setMessage('Vui lòng quét mã QR bên dưới, hệ thống sẽ tự động xác nhận trong 5s sau khi bạn chuyển tiền.');
                        if (isPolling) {
                            pollingTimer = setTimeout(verifyPayment, 3000); // Polling mỗi 3 giây
                        }
                    } else {
                        isPolling = false;
                        setStatus('error');
                        setMessage(`Giao dịch ${provider} chưa hoàn tất hoặc đã bị huỷ (Status: ${orderData.status}).`);
                    }
                }
            } catch (err) {
                console.error("Lỗi xác minh order status:", err);
                if (provider === 'SEPAY') { // Nếu sepay, lỗi kết nối thì cứ thử lại
                   pollingTimer = setTimeout(verifyPayment, 3000);
                } else {
                   setStatus('error');
                   setMessage('Không thể xác minh đơn hàng từ Hệ thống DB. Giao dịch không hợp lệ.');
                }
            }
        };

        if (searchParams.toString()) {
            verifyPayment();
        } else {
            setStatus('error');
            setMessage('Không có dữ liệu giao dịch.');
        }

        return () => {
            isPolling = false;
            if (pollingTimer) clearTimeout(pollingTimer);
        };
    }, [searchParams, removeMultipleFromCart]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-xl w-full rounded-3xl shadow-xl p-10 text-center border border-slate-100">
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-20 h-20 text-violet-600 animate-spin mb-6" />
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Đang xử lý kết quả</h2>
                        <p className="text-slate-500 text-lg">Hệ thống đang kết nối Database đồng bộ dữ liệu giao dịch...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
                        <div className="w-28 h-28 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <CheckCircle className="w-16 h-16" />
                        </div>
                        <h2 className="text-4xl font-black text-slate-800 mb-4">Thành công!</h2>
                        <p className="text-slate-500 mb-8 font-medium text-lg">{message}</p>

                        <button onClick={() => navigate('/my-learning')} className="w-full flex items-center justify-center bg-violet-600 hover:bg-violet-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-1 mb-4">
                            <BookOpen className="mr-2" /> Tới phòng học ngay
                        </button>
                    </div>
                )}

                {status === 'sepay_waiting' && (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
                        <h2 className="text-3xl font-black text-slate-800 mb-3">Chuyển khoản để kích hoạt khóa học</h2>
                        <p className="text-slate-500 text-base mb-6 px-4">{message}</p>
                        
                        <div className="p-4 bg-emerald-50 rounded-3xl border-2 border-emerald-200 mb-6">
                            <img 
                                src={`https://img.vietqr.io/image/VietinBank-107885426583-compact2.png?amount=${searchParams.get('amount')}&addInfo=DH%20${searchParams.get('orderRef')}&accountName=NGUYEN%20THI%20KHUYEN`}
                                alt="VietQR" 
                                className="w-80 h-80 object-contain rounded-2xl bg-white p-3 shadow-sm"
                            />
                        </div>
                        
                        <div className="flex items-center text-emerald-600 bg-emerald-100/50 px-6 py-3 rounded-full text-base font-bold mb-6">
                            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                            Đang chờ nhận tiền... (Tự động tải lại)
                        </div>

                        <button onClick={() => navigate('/cart')} className="w-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-xl font-bold transition-all">
                            Quay lại giỏ hàng (Huỷ giao dịch)
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
                        <div className="w-28 h-28 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <XCircle className="w-16 h-16" />
                        </div>
                        <h2 className="text-4xl font-black text-slate-800 mb-4">Chưa hoàn tất!</h2>
                        <p className="text-slate-500 mb-8 font-medium text-lg">{message}</p>

                        <button onClick={() => navigate('/cart')} className="w-full flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-1">
                            Quay lại giỏ hàng
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
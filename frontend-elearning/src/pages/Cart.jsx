import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, CreditCard, ShoppingCart, ArrowRight, Loader2, Phone, X, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';

/* ─────────────────────────────── Modal SĐT ────────────────────────────────── */
function PhoneModal({ onSuccess, onClose }) {
    const [phone,   setPhone]   = useState('');
    const [saving,  setSaving]  = useState(false);
    const [error,   setError]   = useState('');

    const handleSave = async () => {
        if (!phone.trim() || phone.length < 9) {
            setError('Số điện thoại không hợp lệ (tối thiểu 9 ký tự).');
            return;
        }
        setSaving(true);
        try {
            await axiosClient.put('/users/me/phone', { phoneNumber: phone.trim() });
            toast.success('Cập nhật số điện thoại thành công!');
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể cập nhật. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    return (
        /* Backdrop */
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 relative">
                {/* Close */}
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition">
                    <X size={20} />
                </button>

                {/* Icon */}
                <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Phone className="w-7 h-7 text-violet-600" />
                </div>

                <h2 className="text-xl font-black text-slate-900 text-center mb-1">Bổ sung số điện thoại</h2>
                <p className="text-slate-500 text-sm text-center mb-6">
                    VNPAY yêu cầu số điện thoại để xử lý thanh toán. Chỉ cần nhập một lần.
                </p>

                <div className="relative mb-2">
                    <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                        type="tel"
                        value={phone}
                        onChange={e => { setPhone(e.target.value); setError(''); }}
                        placeholder="VD: 0912345678"
                        autoFocus
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-slate-900 focus:outline-none focus:ring-2 transition
                            ${error ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-violet-400 focus:ring-violet-100'}`}
                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                    />
                </div>
                {error && <p className="text-red-500 text-xs mb-4 font-medium">{error}</p>}

                <button onClick={handleSave} disabled={saving}
                    className="w-full flex items-center justify-center gap-2 py-3 mt-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-lg shadow-violet-500/30 hover:from-violet-700 hover:to-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed">
                    {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Đang lưu...</> : 'Lưu & Tiếp tục thanh toán'}
                </button>
            </div>
        </div>
    );
}

/* ─────────────────────────────── Cart Page ─────────────────────────────────── */
export default function Cart() {
    const { cart, removeFromCart } = useCart();
    const [isCheckingOut,    setIsCheckingOut]    = useState(false);
    const [showPhoneModal,   setShowPhoneModal]   = useState(false);
    const [paymentMethod,    setPaymentMethod]    = useState('VNPAY');
    
    // Logic chọn khoá học thanh toán
    const [selectedItems, setSelectedItems] = useState(() => cart.map(item => item.id));
    useEffect(() => {
        setSelectedItems(prev => prev.filter(id => cart.some(c => c.id === id)));
    }, [cart]);

    const toggleSelection = (id) => {
        setSelectedItems(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    // Logic mã giảm giá
    const [couponCode, setCouponCode] = useState('');
    const [discountData, setDiscountData] = useState(null);
    const [applyingCoupon, setApplyingCoupon] = useState(false);

    const applyCoupon = async () => {
        if (!couponCode.trim()) { setDiscountData(null); return; }
        setApplyingCoupon(true);
        try {
            const res = await axiosClient.get(`/coupons/validate?code=${couponCode}`);
            setDiscountData(res.data.data || res.data);
            toast.success('Áp dụng mã giảm giá thành công!');
        } catch (err) {
            setDiscountData(null);
            toast.error(err.response?.data?.message || 'Mã giảm giá không hợp lệ.');
        } finally {
            setApplyingCoupon(false);
        }
    };

    // Tính tiền chỉ cho khoá học được chọn
    const selectedCourses = cart.filter(c => selectedItems.includes(c.id));
    const subTotalPrice = selectedCourses.reduce((sum, course) => sum + (course.price || 0), 0);
    
    let finalPrice = subTotalPrice;
    let discountAmount = 0;
    if (discountData && subTotalPrice > 0) {
        // Cần đảm bảo discountData có thuộc tính discountPercent (vd API backend trả ra)
        discountAmount = (subTotalPrice * discountData.discountPercent) / 100;
        if (discountData.maxDiscountAmount && discountAmount > discountData.maxDiscountAmount) {
            discountAmount = discountData.maxDiscountAmount;
        }
        finalPrice -= discountAmount;
        if (finalPrice < 0) finalPrice = 0;
    }

    /* ── Hàm checkout chính ────────────────────────────────────────────────── */
    const handleCheckout = async () => {
        if (selectedItems.length === 0) {
            toast.error('Vui lòng chọn ít nhất một khóa học để thanh toán.');
            return;
        }
        
        setIsCheckingOut(true);
        const toastId = toast.loading('Đang khởi tạo đơn hàng...');

        try {
            const payload = {
                courseIds: selectedItems,
                paymentMethod: paymentMethod,
            };
            if (discountData) {
                payload.couponCode = discountData.code;
            }

            // Bước 1: Tạo Order
            const orderRes = await axiosClient.post('/orders', payload);
            const orderId = orderRes.data?.id ?? orderRes.data?.data?.id;
            if (!orderId) throw new Error('Không lấy được mã đơn hàng.');

            toast.loading('Đang kết nối cổng thanh toán VNPAY...', { id: toastId });

            // Bước 2: Lấy URL thanh toán
            const vnpRes = await axiosClient.get(`/payments/create-url/${orderId}`);
            const paymentUrl = vnpRes.data?.paymentUrl ?? vnpRes.data?.data?.paymentUrl;
            if (!paymentUrl) throw new Error('Lỗi tạo link thanh toán VNPAY.');

            // Bước 3: Redirect và lưu state (KHÔNG xoá giỏ ngay)
            sessionStorage.setItem('pending_checkout', JSON.stringify(selectedItems));
            
            if (paymentMethod === 'SEPAY') {
                // SePay: Chuyển thẳng về PaymentResult để hiển thị QR Code và Polling chờ (Không văng khỏi luồng FE)
                window.location.href = `/payment/result?provider=SEPAY&orderRef=${orderId}&amount=${finalPrice}`;
            } else {
                window.location.href = paymentUrl;
            }

        } catch (err) {
            const status  = err.response?.status;
            const rawMsg  = err.response?.data?.message || err.message || '';

            // ── Phân tích lỗi theo HTTP status + prefix từ Backend ────────────
            // 422 = IllegalStateException → PHONE_REQUIRED, COURSE_UNAVAILABLE
            // 400 = IllegalArgumentException → ALREADY_ENROLLED
            if (rawMsg.startsWith('PHONE_REQUIRED')) {
                toast.dismiss(toastId);
                setShowPhoneModal(true);
                return;
            }

            if (rawMsg.startsWith('ALREADY_ENROLLED')) {
                const namesPart = rawMsg
                    .replace('ALREADY_ENROLLED: Bạn đã sở hữu khóa học: ', '')
                    .replace('. Vui lòng xóa khỏi giỏ hàng.', '');
                const enrolledNames = namesPart.split(', ');

                enrolledNames.forEach(name => {
                    const match = cart.find(c => c.title === name.trim());
                    if (match) removeFromCart(match.id);
                });
                toast.error(
                    `Đã tự động xóa khóa học bạn đã sở hữu: ${enrolledNames.join(', ')}`,
                    { id: toastId, duration: 5000 }
                );
                return;
            }

            if (rawMsg.startsWith('COURSE_UNAVAILABLE')) {
                toast.error(
                    'Một số khoá học không còn mở bán. Đang làm mới giỏ hàng...',
                    { id: toastId }
                );
                setTimeout(() => window.location.reload(), 2000);
                return;
            }

            toast.error(rawMsg || 'Có lỗi xảy ra khi thanh toán!', { id: toastId });

        } finally {
            setIsCheckingOut(false);
        }
    };

    /* ── Callback khi lưu SĐT thành công → retry checkout ─────────────────── */
    const handlePhoneSaved = () => {
        setShowPhoneModal(false);
        handleCheckout();
    };

    /* ── Render: Giỏ trống ──────────────────────────────────────────────────── */
    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-violet-100 p-8 rounded-full mb-6">
                    <ShoppingCart className="w-16 h-16 text-violet-500" />
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-3">Giỏ hàng trống</h2>
                <p className="text-slate-500 mb-8 font-medium">Bạn chưa chọn khóa học nào. Khám phá ngay nhé!</p>
                <Link to="/courses"
                    className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-1">
                    Khám phá khóa học
                </Link>
            </div>
        );
    }

    /* ── Render: Giỏ hàng ───────────────────────────────────────────────────── */
    return (
        <>
            {showPhoneModal && (
                <PhoneModal
                    onSuccess={handlePhoneSaved}
                    onClose={() => setShowPhoneModal(false)}
                />
            )}

            <div className="min-h-screen bg-slate-50 py-12">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-black text-slate-900 mb-8">Giỏ hàng của bạn</h1>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Danh sách khoá học */}
                        <div className="lg:col-span-2 space-y-4">
                            {cart.map(course => (
                                <div key={course.id}
                                    className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex gap-4 items-center transition-all hover:shadow-md cursor-pointer"
                                    onClick={() => toggleSelection(course.id)}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedItems.includes(course.id)} 
                                        onChange={() => toggleSelection(course.id)} 
                                        className="w-5 h-5 text-violet-600 rounded border-slate-300 focus:ring-violet-500 cursor-pointer ml-3 flex-shrink-0" 
                                        onClick={e => e.stopPropagation()}
                                    />
                                    <img
                                        src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=200'}
                                        alt="Thumbnail"
                                        className="w-32 h-24 object-cover rounded-2xl flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-lg text-slate-900 line-clamp-1 mb-1">{course.title}</h3>
                                        <p className="text-sm font-medium text-slate-500 mb-2">
                                            Bởi: {course.instructorName || 'Giảng viên'}
                                        </p>
                                        <div className="font-black text-violet-600">
                                            {course.price
                                                ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price)
                                                : 'Miễn phí'}
                                        </div>
                                    </div>
                                    {/* Cần stopPropagation nếu click vào nút Xóa */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeFromCart(course.id); }}
                                        className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors mr-2 flex-shrink-0"
                                        title="Xóa khỏi giỏ hàng">
                                        <Trash2 size={22} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Khung thanh toán */}
                        <div className="bg-white p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 h-fit sticky top-24">
                            <h3 className="text-xl font-bold text-slate-900 mb-6">Tổng kết đơn hàng</h3>
                            
                            {/* Mã giảm giá */}
                            <div className="flex gap-2 mb-6">
                                <div className="relative flex-1">
                                    <Tag className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Nhập mã giảm giá..." 
                                        value={couponCode} 
                                        onChange={e => setCouponCode(e.target.value.toUpperCase())} 
                                        className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-violet-500 font-semibold" 
                                    />
                                </div>
                                <button 
                                    onClick={applyCoupon} 
                                    disabled={applyingCoupon || !couponCode.trim()} 
                                    className="px-5 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition">
                                    {applyingCoupon ? <Loader2 className="w-5 h-5 animate-spin mx-2" /> : 'Áp dụng'}
                                </button>
                            </div>

                            <div className="space-y-4 mb-6 pb-6 border-b border-slate-100 text-slate-600 font-medium tracking-wide">
                                <div className="flex justify-between">
                                    <span>Đã chọn:</span>
                                    <span><b className="text-slate-900">{selectedItems.length}</b> khóa học</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tạm tính:</span>
                                    <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(subTotalPrice)}</span>
                                </div>
                                {discountData && (
                                    <div className="flex justify-between text-emerald-500 bg-emerald-50 p-2 rounded-lg -mx-2 px-2 items-center">
                                        <div className="flex flex-col">
                                            <span>Giảm giá ({discountData.discountPercent}%):</span>
                                            {discountData.maxDiscountAmount && (
                                                <span className="text-xs opacity-80">(Tối đa {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountData.maxDiscountAmount)})</span>
                                            )}
                                        </div>
                                        <span className="font-bold">- {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountAmount)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Chọn phương thức thanh toán */}
                            <div className="mb-6">
                                <h4 className="text-sm font-bold text-slate-700 mb-3">Phương thức thanh toán:</h4>
                                <div className="space-y-3">
                                    <label className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'VNPAY' ? 'border-violet-500 bg-violet-50/50' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <input type="radio" name="paymentMethod" value="VNPAY" checked={paymentMethod === 'VNPAY'} onChange={() => setPaymentMethod('VNPAY')} className="w-4 h-4 text-violet-600 border-gray-300 focus:ring-violet-500" />
                                        <span className="ml-3 font-semibold text-slate-800 flex items-center gap-2">
                                            <span className="w-8 h-8 rounded shrink-0 bg-blue-100 flex justify-center items-center font-bold text-[10px] text-blue-700 border border-blue-200">VNPAY</span>
                                            Thanh toán qua VNPAY
                                        </span>
                                    </label>
                                    <label className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'MOMO' ? 'border-pink-500 bg-pink-50/50' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <input type="radio" name="paymentMethod" value="MOMO" checked={paymentMethod === 'MOMO'} onChange={() => setPaymentMethod('MOMO')} className="w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-500" />
                                        <span className="ml-3 font-semibold text-slate-800 flex items-center gap-2">
                                            <span className="w-8 h-8 rounded shrink-0 bg-pink-100 flex justify-center items-center font-bold text-[10px] text-pink-700 border border-pink-200">MoMo</span>
                                            Thanh toán qua Ví MoMo
                                        </span>
                                    </label>
                                    <label className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'SEPAY' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <input type="radio" name="paymentMethod" value="SEPAY" checked={paymentMethod === 'SEPAY'} onChange={() => setPaymentMethod('SEPAY')} className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500" />
                                        <span className="ml-3 font-semibold text-slate-800 flex items-center gap-2">
                                            <span className="w-8 h-8 rounded shrink-0 bg-emerald-100 flex justify-center items-center font-bold text-[10px] text-emerald-700 border border-emerald-200">QR</span>
                                            Chuyển khoản (SePay)
                                        </span>
                                    </label>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center mb-8">
                                <span className="text-slate-900 font-bold">Thành tiền:</span>
                                <span className="text-3xl font-black text-violet-600">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalPrice)}
                                </span>
                            </div>
                            <button
                                onClick={handleCheckout}
                                disabled={isCheckingOut}
                                className={`w-full flex items-center justify-center py-4 rounded-xl text-white font-bold text-lg shadow-xl transition-all
                                    ${isCheckingOut ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 hover:-translate-y-1 shadow-slate-900/20'}`}>
                                {isCheckingOut
                                    ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang xử lý...</>
                                    : <>Tiến hành thanh toán <ArrowRight className="ml-2 w-5 h-5" /></>
                                }
                            </button>
                            <div className="mt-6 flex items-center justify-center text-sm font-medium text-slate-500">
                                <CreditCard className="w-5 h-5 mr-2 text-slate-400" />
                                {paymentMethod === 'VNPAY' ? 'Thanh toán an toàn qua VNPAY' : paymentMethod === 'MOMO' ? 'Thanh toán tiện lợi qua Ví MoMo' : 'Chuyển khoản Tự động - 5s xác nhận'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
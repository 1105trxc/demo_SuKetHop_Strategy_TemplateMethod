import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosClient from '../api/axiosClient';
import { KeyRound, Mail, Lock, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

const STEP = { EMAIL: 1, OTP: 2, NEW_PASSWORD: 3 };
const OTP_EXPIRY_SECONDS = 300;

export default function ForgotPassword() {
    const navigate = useNavigate();

    // ─── State ─────────────────────────────────────────────────────────────────
    const [step, setStep]       = useState(STEP.EMAIL);
    const [loading, setLoading] = useState(false);
    const [email, setEmail]     = useState('');

    // Bước 2 — OTP
    const [otp, setOtp]         = useState(['', '', '', '', '', '']);
    const otpRefs               = useRef([]);
    const [countdown, setCountdown] = useState(OTP_EXPIRY_SECONDS);
    const [canResend, setCanResend] = useState(false);

    // Bước 3 — Mật khẩu mới
    const [newPassword, setNewPassword]         = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Countdown
    useEffect(() => {
        if (step !== STEP.OTP) return;
        setCountdown(OTP_EXPIRY_SECONDS);
        setCanResend(false);
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) { clearInterval(timer); setCanResend(true); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [step]);

    const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    // ─── Bước 1: Gửi email ────────────────────────────────────────────────────
    const handleSendEmail = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axiosClient.post('/auth/forgot-password', { email });
            toast.success('Mã OTP đã được gửi tới email của bạn!');
            setStep(STEP.OTP);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Email không tồn tại trong hệ thống!');
        } finally {
            setLoading(false);
        }
    };

    // ─── Bước 2: Nhập OTP ─────────────────────────────────────────────────────
    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        if (value && index < 5) otpRefs.current[index + 1]?.focus();
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newOtp = [...otp];
        text.split('').forEach((ch, i) => { newOtp[i] = ch; });
        setOtp(newOtp);
        otpRefs.current[Math.min(text.length, 5)]?.focus();
    };

    const handleVerifyOtp = () => {
        const otpCode = otp.join('');
        if (otpCode.length !== 6) { toast.error('Vui lòng nhập đủ 6 chữ số!'); return; }
        // Không gọi API — chỉ chuyển bước (API verify sẽ gọi ở bước 3 cùng với newPassword)
        setStep(STEP.NEW_PASSWORD);
    };

    const handleResendOtp = async () => {
        if (!canResend) return;
        setLoading(true);
        try {
            await axiosClient.post('/auth/forgot-password', { email });
            toast.success('Đã gửi lại mã OTP mới!');
            setOtp(['', '', '', '', '', '']);
            setStep(STEP.OTP);
        } catch {
            toast.error('Không thể gửi lại OTP. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    // ─── Bước 3: Đặt mật khẩu mới ─────────────────────────────────────────────
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp!');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Mật khẩu phải có ít nhất 6 ký tự!');
            return;
        }
        setLoading(true);
        try {
            await axiosClient.post('/auth/reset-password', {
                email,
                otp:         otp.join(''),
                newPassword,
            });
            toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập.');
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn!');
            // Quay lại bước OTP để nhập lại
            setOtp(['', '', '', '', '', '']);
            setStep(STEP.OTP);
        } finally {
            setLoading(false);
        }
    };

    // ─── Helpers ───────────────────────────────────────────────────────────────
    const stepLabels = ['Email', 'Mã OTP', 'Mật khẩu mới'];

    return (
        <div className="min-h-[85vh] flex items-center justify-center bg-slate-50 py-12 px-4">
            <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden">
                {/* Blur BG */}
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-red-200 rounded-full mix-blend-multiply blur-3xl opacity-40 pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-violet-200 rounded-full mix-blend-multiply blur-3xl opacity-40 pointer-events-none" />

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 mb-8 relative z-10">
                    {[STEP.EMAIL, STEP.OTP, STEP.NEW_PASSWORD].map((s, idx) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className="flex flex-col items-center gap-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                                    ${step > s ? 'bg-emerald-500 text-white' : step === s ? 'bg-violet-600 text-white ring-4 ring-violet-100' : 'bg-slate-100 text-slate-400'}`}>
                                    {step > s ? <CheckCircle2 size={14} /> : s}
                                </div>
                                <span className={`text-xs font-medium ${step >= s ? 'text-slate-700' : 'text-slate-400'}`}>
                                    {stepLabels[idx]}
                                </span>
                            </div>
                            {s < STEP.NEW_PASSWORD && (
                                <div className={`w-10 h-0.5 mb-4 ${step > s ? 'bg-emerald-500' : 'bg-slate-200'} transition-all duration-500`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* ═══ BƯỚC 1: NHẬP EMAIL ══════════════════════════════════════ */}
                {step === STEP.EMAIL && (
                    <div className="relative z-10">
                        <div className="text-center mb-6">
                            <div className="mx-auto w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mb-4">
                                <KeyRound className="w-8 h-8 text-violet-600" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900">Quên mật khẩu?</h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Nhập email đăng ký của bạn, chúng tôi sẽ gửi mã xác thực.
                            </p>
                        </div>
                        <form onSubmit={handleSendEmail} className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-slate-700">Email</label>
                                <div className="relative mt-1">
                                    <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email" required autoFocus
                                        placeholder="you@example.com"
                                        className="block w-full pl-11 pr-4 py-3 border border-slate-200 bg-slate-50 text-slate-900 rounded-xl focus:ring-2 focus:ring-violet-500 focus:bg-white focus:outline-none transition-all"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full flex justify-center items-center gap-2 py-3.5 font-bold rounded-xl text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Đang gửi...</> : 'Gửi mã xác thực'}
                            </button>
                            <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors mt-2">
                                <ArrowLeft size={14} /> Quay lại đăng nhập
                            </Link>
                        </form>
                    </div>
                )}

                {/* ═══ BƯỚC 2: NHẬP OTP ════════════════════════════════════════ */}
                {step === STEP.OTP && (
                    <div className="relative z-10">
                        <button onClick={() => setStep(STEP.EMAIL)}
                            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors">
                            <ArrowLeft size={16} /> Quay lại
                        </button>
                        <div className="text-center mb-6">
                            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
                                <Mail className="w-8 h-8 text-orange-500" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900">Nhập mã OTP</h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Mã 6 số đã gửi tới <span className="font-bold text-slate-700">{email}</span>
                            </p>
                        </div>

                        <div className="flex justify-center gap-3 mb-5" onPaste={handleOtpPaste}>
                            {otp.map((digit, idx) => (
                                <input key={idx}
                                    ref={el => otpRefs.current[idx] = el}
                                    type="text" inputMode="numeric" maxLength={1} value={digit}
                                    onChange={e => handleOtpChange(idx, e.target.value)}
                                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                                    className="w-12 h-14 text-center text-2xl font-black border-2 rounded-xl outline-none transition-all
                                        border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100
                                        bg-slate-50 focus:bg-white text-slate-900"
                                />
                            ))}
                        </div>

                        <div className="text-center mb-4">
                            {!canResend ? (
                                <p className="text-sm text-slate-500">
                                    Hết hạn sau{' '}
                                    <span className={`font-bold tabular-nums ${countdown <= 60 ? 'text-red-500' : 'text-orange-500'}`}>
                                        {formatTime(countdown)}
                                    </span>
                                </p>
                            ) : (
                                <p className="text-sm text-red-500 font-medium">Mã OTP đã hết hạn.</p>
                            )}
                        </div>

                        <button onClick={handleVerifyOtp} disabled={otp.join('').length !== 6}
                            className="w-full flex justify-center items-center gap-2 py-3.5 font-bold rounded-xl text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-3">
                            Tiếp tục →
                        </button>

                        <button onClick={handleResendOtp} disabled={!canResend || loading}
                            className="w-full py-2.5 text-sm font-semibold text-violet-600 hover:text-violet-800 hover:bg-violet-50 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                            {loading ? 'Đang gửi...' : 'Gửi lại mã OTP'}
                        </button>
                    </div>
                )}

                {/* ═══ BƯỚC 3: MẬT KHẨU MỚI ════════════════════════════════════ */}
                {step === STEP.NEW_PASSWORD && (
                    <div className="relative z-10">
                        <button onClick={() => setStep(STEP.OTP)}
                            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors">
                            <ArrowLeft size={16} /> Quay lại
                        </button>
                        <div className="text-center mb-6">
                            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                                <Lock className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900">Đặt mật khẩu mới</h2>
                            <p className="mt-2 text-sm text-slate-500">Chọn mật khẩu mới an toàn cho tài khoản.</p>
                        </div>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-slate-700">Mật khẩu mới</label>
                                <input type="password" required minLength={6}
                                    className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-700">Xác nhận mật khẩu mới</label>
                                <input type="password" required minLength={6}
                                    className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                />
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full flex justify-center items-center gap-2 py-3.5 font-bold rounded-xl text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Đang cập nhật...</> : '✓ Xác nhận đặt lại mật khẩu'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

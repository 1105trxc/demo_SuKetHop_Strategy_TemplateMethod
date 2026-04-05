import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Upload, Link2, FileText, CheckSquare, Loader2, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_TYPES    = ['.pdf', '.docx'];
const ALLOWED_MIMES    = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

function FieldError({ msg }) {
    if (!msg) return null;
    return (
        <p className="flex items-center gap-1 text-red-500 text-xs mt-1 font-medium">
            <AlertCircle size={12} /> {msg}
        </p>
    );
}

/* ─── Status banner ─────────────────────────────────────────────────────────── */
function StatusBanner({ status }) {
    const cfg = {
        PENDING: {
            icon: <Clock className="w-6 h-6 text-amber-500" />,
            title: 'Đơn đăng ký đang chờ xét duyệt',
            desc:  'Quản trị viên sẽ tiếp nhận và phản hồi trong vòng 3-5 ngày làm việc.',
            cls:   'bg-amber-50 border-amber-200 text-amber-800',
        },
        APPROVED: {
            icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
            title: 'Đơn đăng ký đã được duyệt!',
            desc:  'Bạn đã trở thành giảng viên trên UTE-Learn. Bắt đầu tạo khoá học ngay!',
            cls:   'bg-emerald-50 border-emerald-200 text-emerald-800',
        },
        REJECTED: {
            icon: <XCircle className="w-6 h-6 text-red-500" />,
            title: 'Đơn đăng ký bị từ chối',
            desc:  'Bạn có thể gửi lại đơn đăng ký với thông tin đầy đủ hơn.',
            cls:   'bg-red-50 border-red-200 text-red-800',
        },
    };
    const c = cfg[status];
    if (!c) return null;
    return (
        <div className={`flex items-start gap-4 p-5 rounded-2xl border ${c.cls} mb-6`}>
            {c.icon}
            <div>
                <p className="font-bold">{c.title}</p>
                <p className="text-sm opacity-80 mt-0.5">{c.desc}</p>
            </div>
        </div>
    );
}

/* ─── Main Component ─────────────────────────────────────────────────────────── */
export default function BecomeInstructor() {
    const navigate = useNavigate();
    const { user  } = useAuth();

    const [requestStatus, setRequestStatus] = useState(null); // 'NONE'|'PENDING'|'APPROVED'|'REJECTED'
    const [statusLoading, setStatusLoading] = useState(true);

    const [form, setForm] = useState({
        expertise:    '',
        portfolioUrl: '',
        agreed:       false,
    });
    const [cvFile,   setCvFile]   = useState(null);
    const [cvUrl,    setCvUrl]    = useState('');     // URL sau khi upload lên Cloudinary
    const [errors,   setErrors]   = useState({});
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fileInputRef = useRef(null);

    // ── Kiểm tra trạng thái đơn ──────────────────────────────────────────────
    useEffect(() => {
        axiosClient.get('/instructor-requests/my-status')
            .then(res => setRequestStatus(res.data.status))   // 'NONE'|'PENDING'|'APPROVED'|'REJECTED'
            .catch(() => setRequestStatus('NONE'))
            .finally(() => setStatusLoading(false));
    }, []);

    // ── Validate từng field ───────────────────────────────────────────────────
    const validate = (name, value) => {
        const errs = { ...errors };
        if (name === 'expertise') {
            if (!value.trim()) errs.expertise = 'Vui lòng nhập lĩnh vực chuyên môn.';
            else delete errs.expertise;
        }
        setErrors(errs);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newVal = type === 'checkbox' ? checked : value;
        setForm(prev => ({ ...prev, [name]: newVal }));
        if (name !== 'agreed') validate(name, newVal);
    };

    // ── Upload CV ─────────────────────────────────────────────────────────────
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate loại file
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!ALLOWED_TYPES.includes(ext) || !ALLOWED_MIMES.includes(file.type)) {
            setErrors(prev => ({ ...prev, cv: `Chỉ chấp nhận file ${ALLOWED_TYPES.join(', ')}.` }));
            return;
        }

        // Validate dung lượng
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            setErrors(prev => ({ ...prev, cv: `Dung lượng file không được vượt quá ${MAX_FILE_SIZE_MB}MB.` }));
            return;
        }

        setErrors(prev => { const e = { ...prev }; delete e.cv; return e; });
        setCvFile(file);

        // Upload lên Cloudinary qua Backend
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await axiosClient.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setCvUrl(res.data?.url || res.data);
            toast.success('Upload CV thành công!');
        } catch {
            toast.error('Upload CV thất bại. Vui lòng thử lại.');
            setCvFile(null);
        } finally {
            setUploading(false);
        }
    };

    // ── Validate toàn bộ trước submit ─────────────────────────────────────────
    const validateAll = () => {
        const errs = {};
        if (!form.expertise.trim()) errs.expertise = 'Vui lòng nhập lĩnh vực chuyên môn.';
        if (!cvUrl)                 errs.cv        = 'Vui lòng upload file CV.';
        if (!form.agreed)           errs.agreed    = 'Bạn phải đồng ý với điều khoản để tiếp tục.';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateAll()) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc!');
            return;
        }

        setSubmitting(true);
        try {
            await axiosClient.post('/instructor-requests', {
                expertise:    form.expertise,
                portfolioUrl: form.portfolioUrl || null,
                cvFileUrl:    cvUrl,
            });
            toast.success('Gửi đơn đăng ký thành công! Chúng tôi sẽ phản hồi sớm nhất.');
            setRequestStatus('PENDING');
        } catch (err) {
            const msg = err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    /* ── Loading ──────────────────────────────────────────────────────────────── */
    if (statusLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
        );
    }

    /* ── Render ───────────────────────────────────────────────────────────────── */
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/20 to-indigo-50/30 py-12 px-4">
            <div className="max-w-2xl mx-auto">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl shadow-xl shadow-violet-500/30 mb-4">
                        <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900">Trở thành Giảng viên</h1>
                    <p className="text-slate-500 mt-2 max-w-md mx-auto text-sm leading-relaxed">
                        Chia sẻ kiến thức của bạn với hàng nghìn học viên trên UTE-Learn.
                        Đăng ký để bắt đầu tạo khóa học ngay hôm nay.
                    </p>
                </div>

                {/* Nếu đã có đơn */}
                {requestStatus !== 'NONE' && requestStatus !== 'REJECTED' && (
                    <StatusBanner status={requestStatus} />
                )}

                {/* Hiện form nếu chưa có đơn PENDING */}
                {(requestStatus === 'NONE' || requestStatus === 'REJECTED') && (
                    <form onSubmit={handleSubmit}
                        className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 space-y-6">

                        {requestStatus === 'REJECTED' && (
                            <StatusBanner status="REJECTED" />
                        )}

                        {/* Thông tin tự điền từ context */}
                        <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thông tin tài khoản</p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-slate-400">Họ tên</p>
                                    <p className="font-semibold text-slate-800">{user?.fullName || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Email</p>
                                    <p className="font-semibold text-slate-800">{user?.email || '—'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Lĩnh vực chuyên môn */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-1.5">
                                <GraduationCap size={15} className="text-violet-500" />
                                Lĩnh vực chuyên môn <span className="text-red-500">*</span>
                            </label>
                            <input type="text" name="expertise"
                                value={form.expertise} onChange={handleChange}
                                placeholder="VD: Lập trình Java, Spring Boot, Microservices"
                                className={`w-full px-4 py-3 rounded-xl border text-slate-900 transition focus:outline-none focus:ring-2
                                    ${errors.expertise ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-violet-400 focus:ring-violet-100'}`}
                            />
                            <FieldError msg={errors.expertise} />
                        </div>

                        {/* Portfolio URL */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-1.5">
                                <Link2 size={15} className="text-violet-500" />
                                Link Portfolio / Github (tuỳ chọn)
                            </label>
                            <input type="url" name="portfolioUrl"
                                value={form.portfolioUrl} onChange={handleChange}
                                placeholder="https://github.com/yourusername"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 transition focus:outline-none focus:ring-2 focus:border-violet-400 focus:ring-violet-100"
                            />
                        </div>

                        {/* Upload CV */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-1.5">
                                <FileText size={15} className="text-violet-500" />
                                File CV <span className="text-red-500">*</span>
                                <span className="text-slate-400 font-normal text-xs">(.pdf, .docx — tối đa 5MB)</span>
                            </label>

                            <input ref={fileInputRef} type="file"
                                accept=".pdf,.docx" onChange={handleFileChange}
                                className="hidden" />

                            {cvFile ? (
                                <div className={`flex items-center gap-3 p-4 rounded-xl border-2 
                                    ${errors.cv ? 'border-red-300 bg-red-50' : 'border-emerald-300 bg-emerald-50'}`}>
                                    <FileText size={22} className={errors.cv ? 'text-red-500' : 'text-emerald-600'} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{cvFile.name}</p>
                                        <p className="text-xs text-slate-500">{(cvFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                    {uploading
                                        ? <Loader2 size={18} className="text-violet-500 animate-spin flex-shrink-0" />
                                        : <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                                    }
                                </div>
                            ) : (
                                <button type="button" onClick={() => fileInputRef.current?.click()}
                                    className={`w-full flex flex-col items-center gap-2 py-8 rounded-xl border-2 border-dashed transition
                                        ${errors.cv ? 'border-red-300 bg-red-50 hover:bg-red-100' : 'border-slate-300 bg-slate-50 hover:bg-violet-50 hover:border-violet-400'}`}>
                                    <Upload size={24} className={errors.cv ? 'text-red-400' : 'text-slate-400'} />
                                    <p className="text-sm font-semibold text-slate-600">Nhấn để chọn file CV</p>
                                    <p className="text-xs text-slate-400">PDF hoặc DOCX, tối đa 5MB</p>
                                </button>
                            )}

                            {cvFile && (
                                <button type="button" onClick={() => { setCvFile(null); setCvUrl(''); fileInputRef.current.value = ''; }}
                                    className="text-xs text-slate-400 hover:text-red-500 mt-1 transition">
                                    Xóa và chọn lại
                                </button>
                            )}
                            <FieldError msg={errors.cv} />
                        </div>

                        {/* Điều khoản */}
                        <div>
                            <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 transition
                                ${errors.agreed ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:border-violet-300 hover:bg-violet-50/50'}`}>
                                <input type="checkbox" name="agreed" checked={form.agreed} onChange={handleChange}
                                    className="w-5 h-5 rounded text-violet-600 accent-violet-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-slate-600 leading-relaxed">
                                    Tôi xác nhận thông tin cung cấp là chính xác và đồng ý với{' '}
                                    <span className="text-violet-600 font-semibold">Điều khoản giảng viên</span>{' '}
                                    của UTE-Learn. Tôi cam kết sẽ cung cấp nội dung giảng dạy chất lượng.
                                </span>
                            </label>
                            <FieldError msg={errors.agreed} />
                        </div>

                        {/* Submit */}
                        <button type="submit"
                            disabled={submitting || uploading}
                            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-base shadow-xl shadow-violet-500/30 hover:from-violet-700 hover:to-indigo-700 transition hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
                            {submitting
                                ? <><Loader2 className="w-5 h-5 animate-spin" /> Đang gửi đơn...</>
                                : <><GraduationCap size={20} /> Gửi đơn đăng ký</>
                            }
                        </button>
                    </form>
                )}

                {/* Nếu đã APPROVED → nút đi tạo khoá học */}
                {requestStatus === 'APPROVED' && (
                    <div className="text-center mt-6">
                        <button onClick={() => navigate('/instructor/courses/create')}
                            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg hover:from-emerald-600 hover:to-teal-600 transition">
                            Bắt đầu tạo khoá học ngay →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

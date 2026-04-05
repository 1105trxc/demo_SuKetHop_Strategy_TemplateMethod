import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookPlus, Loader2, AlertCircle, DollarSign, Image, AlignLeft, Tag, ChevronLeft, Plus, Play, Video, Link as LinkIcon, CheckCircle2, ChevronRight } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
const MAX_TITLE_LEN = 100;
const MAX_DESC_LEN  = 1000;

function FieldError({ msg }) {
    if (!msg) return null;
    return (
        <p className="flex items-center gap-1 text-red-500 text-xs mt-1 font-medium">
            <AlertCircle size={12} /> {msg}
        </p>
    );
}

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function CreateCourse() {
    const navigate = useNavigate();

    // -- App State --
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0); // for video uploads
    const [courseId, setCourseId] = useState(null);

    // -- Step 1 State --
    const [categories, setCategories] = useState([]);
    const [catLoading, setCatLoading] = useState(true);
    const [form1, setForm1] = useState({ title: '', description: '', price: '', categoryId: '', thumbnailUrl: '' });
    const [form1Errors, setForm1Errors] = useState({});
    const [thumbnailFile, setThumbnailFile] = useState(null);

    // -- Step 2 State --
    const [chapters, setChapters] = useState([]);
    const [form2, setForm2] = useState({ title: '', orderIndex: 1 });

    // -- Step 3 State --
    const [form3, setForm3] = useState({
        chapterId: '',
        title: '',
        videoUrl: '',
        durationSeconds: 0,
        orderIndex: 1,
        isFreePreview: false
    });
    const [videoUploadMethod, setVideoUploadMethod] = useState('upload'); // 'upload' | 'link'
    const [videoFile, setVideoFile] = useState(null);


    // ── Load Categories
    useEffect(() => {
        axiosClient.get('/categories')
            .then(res => setCategories(res.data))
            .catch(() => toast.error('Không thể tải danh mục.'))
            .finally(() => setCatLoading(false));
    }, []);

    // ─── Step 1 Logic ─────────────────────────────────────────────
    const handleForm1Change = (e) => {
        const { name, value } = e.target;
        setForm1(prev => ({ ...prev, [name]: value }));
    };

    const submitStep1 = async (e) => {
        e.preventDefault();
        
        let errs = {};
        if (!form1.title.trim()) errs.title = 'Tiêu đề trống.';
        if (form1.price === '') errs.price = 'Nhập giá bán.';
        if (!form1.categoryId) errs.categoryId = 'Chọn danh mục.';
        if (!thumbnailFile && !form1.thumbnailUrl) errs.thumbnailUrl = 'Chọn ảnh thumbnail.';
        setForm1Errors(errs);
        if (Object.keys(errs).length > 0) return toast.error('Kiểm tra lại thông tin.');

        setLoading(true);
        try {
            let finalThumbnailUrl = form1.thumbnailUrl;

            // Upload thumbnail if file selected
            if (thumbnailFile) {
                const formData = new FormData();
                formData.append('file', thumbnailFile);
                const uploadRes = await axiosClient.post('/files/upload?folder=course_thumbnails', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                finalThumbnailUrl = uploadRes.data;
            }

            // Create course
            const res = await axiosClient.post('/courses', {
                title: form1.title,
                description: form1.description,
                price: parseFloat(form1.price),
                categoryId: parseInt(form1.categoryId),
                thumbnailUrl: finalThumbnailUrl,
            });

            setCourseId(res.data.id);
            toast.success('Khởi tạo khóa học thành công!');
            setStep(2);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo khóa học.');
        } finally {
            setLoading(false);
        }
    };

    // ─── Step 2 Logic ─────────────────────────────────────────────
    const handleCreateChapter = async (e) => {
        e.preventDefault();
        if (!form2.title.trim()) return toast.error('Tên chương không được để trống!');
        
        setLoading(true);
        try {
            const res = await axiosClient.post('/chapters', {
                courseId: courseId,
                title: form2.title,
                orderIndex: parseInt(form2.orderIndex)
            });
            setChapters([...chapters, res.data]);
            toast.success('Thêm chương thành công!');
            setForm2({ title: '', orderIndex: chapters.length + 2 });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi tạo chương.');
        } finally {
            setLoading(false);
        }
    };

    // ─── Step 3 Logic ─────────────────────────────────────────────
    const handleCreateLesson = async (e) => {
        e.preventDefault();
        if (!form3.chapterId) return toast.error('Vui lòng chọn chương học!');
        if (!form3.title.trim()) return toast.error('Tiêu đề bài học trống!');
        if (videoUploadMethod === 'upload' && !videoFile) return toast.error('Vui lòng chọn file video!');
        if (videoUploadMethod === 'link' && !form3.videoUrl) return toast.error('Vui lòng nhập link video!');

        setLoading(true);
        setProgress(10);
        
        try {
            let finalVideoUrl = form3.videoUrl;

            if (videoUploadMethod === 'upload' && videoFile) {
                const formData = new FormData();
                formData.append('file', videoFile);
                
                const uploadRes = await axiosClient.post('/files/upload?folder=lesson_videos', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setProgress(Math.max(10, percentCompleted - 5)); // keep slightly behind 100 until backend resolves
                    }
                });
                finalVideoUrl = uploadRes.data;
            }

            setProgress(90);

            await axiosClient.post('/lessons', {
                chapterId: form3.chapterId,
                title: form3.title,
                videoUrl: finalVideoUrl,
                durationSeconds: parseInt(form3.durationSeconds) || 0,
                orderIndex: parseInt(form3.orderIndex),
                isFreePreview: form3.isFreePreview
            });

            setProgress(100);
            setTimeout(() => setProgress(0), 1000);
            toast.success('Đã thêm bài học thành công!');
            
            // Reset form for next lesson
            setVideoFile(null);
            setForm3(prev => ({ 
                ...prev, 
                title: '', 
                videoUrl: '', 
                orderIndex: parseInt(prev.orderIndex) + 1,
                videoFile: null
            }));
            // document input file reset requires a ref or key hack, simple way:
            document.getElementById('videoFileInput').value = "";

        } catch (error) {
            setProgress(0);
            toast.error(error.response?.data?.message || 'Lỗi khi tạo bài học. Đảm bảo file không quá dung lượng giới hạn.');
        } finally {
            setLoading(false);
        }
    };


    /* ── Render ─────────────────────────────────────────────────────────────── */
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50/30 py-10 px-4">
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => navigate('/instructor/courses')}
                        className="p-2 rounded-xl hover:bg-white hover:shadow-sm transition">
                        <ChevronLeft size={20} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Mở bán khóa học mới</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Xây dựng kiến trúc theo lộ trình.</p>
                    </div>
                </div>

                {/* Bước chỉ báo */}
                <div className="flex gap-2 mb-8 items-center bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                    {[
                        { num: 1, label: 'Thông tin' },
                        { num: 2, label: 'Chương học' },
                        { num: 3, label: 'Bài học' }
                    ].map(st => (
                        <div key={st.num} className={`flex-1 flex gap-2 items-center p-2 rounded-xl ${step === st.num ? 'bg-violet-50 border border-violet-100' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm 
                                ${step > st.num ? 'bg-emerald-500 text-white' : step === st.num ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                {step > st.num ? <CheckCircle2 size={16} /> : st.num}
                            </div>
                            <span className={`text-sm font-bold ${step === st.num ? 'text-violet-700' : 'text-slate-500'}`}>{st.label}</span>
                        </div>
                    ))}
                </div>

                {/* --- CHƯƠNG TRÌNH STEP 1 --- */}
                {step === 1 && (
                    <form onSubmit={submitStep1} className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
                            <BookPlus className="text-violet-500"/> Tổng quan
                        </h2>
                        
                        <div>
                            <label className="text-sm font-bold text-slate-700 mb-1.5 block">Tiêu đề khoá học <span className="text-red-500">*</span></label>
                            <input type="text" name="title" value={form1.title} onChange={handleForm1Change}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
                            <FieldError msg={form1Errors.title} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-bold text-slate-700 mb-1.5 block">Danh mục <span className="text-red-500">*</span></label>
                                <select name="categoryId" value={form1.categoryId} onChange={handleForm1Change} disabled={catLoading}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 bg-white">
                                    <option value="">-- Chọn danh mục --</option>
                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                                <FieldError msg={form1Errors.categoryId} />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-700 mb-1.5 block">Giá tiền (VNĐ) <span className="text-red-500">*</span></label>
                                <input type="number" name="price" value={form1.price} onChange={handleForm1Change} min={0} step={1000}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400" />
                                <FieldError msg={form1Errors.price} />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-bold text-slate-700 mb-1.5 block">Mô tả</label>
                            <textarea name="description" value={form1.description} onChange={handleForm1Change} rows={4}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 resize-none" />
                        </div>

                        <div>
                            <label className="text-sm font-bold text-slate-700 mb-1.5 block">Thumbnail (Ảnh bìa) <span className="text-red-500">*</span></label>
                            <div className="flex gap-4 items-center mb-2">
                                <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files[0])}
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 transition" />
                            </div>
                            <FieldError msg={form1Errors.thumbnailUrl} />
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                            <button type="submit" disabled={loading}
                                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 disabled:opacity-50">
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Tiếp tục <ChevronRight size={18} />
                            </button>
                        </div>
                    </form>
                )}

                {/* --- CHƯƠNG TRÌNH STEP 2 --- */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
                            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-1">
                                <AlignLeft className="text-violet-500"/> Xây dựng cấu trúc
                            </h2>
                            <p className="text-slate-500 text-sm mb-6">Thêm các chương học để phân loại bài giảng.</p>

                            <form onSubmit={handleCreateChapter} className="flex gap-3 mb-6 items-end">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Tên chương mới</label>
                                    <input type="text" required placeholder="VD: Chương 1: Mở đầu" value={form2.title} onChange={e => setForm2({...form2, title: e.target.value})}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200" />
                                </div>
                                <div className="w-24">
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Thứ tự</label>
                                    <input type="number" min={1} required value={form2.orderIndex} onChange={e => setForm2({...form2, orderIndex: e.target.value})}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-center" />
                                </div>
                                <button type="submit" disabled={loading} className="px-5 py-2.5 h-11 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800">
                                    <Plus size={20} />
                                </button>
                            </form>

                            {chapters.length > 0 && (
                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Các chương đã thêm</h4>
                                    {chapters.map(ch => (
                                        <div key={ch.id} className="flex justify-between items-center bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm">
                                            <span className="font-bold text-slate-700 text-sm">{ch.orderIndex}. {ch.title}</span>
                                            <span className="text-xs text-slate-400 font-medium">{ch.lessons?.length || 0} bài học</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end">
                            <button onClick={() => setStep(3)} disabled={chapters.length === 0}
                                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 disabled:opacity-50">
                                Sắp xếp bài học <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* --- CHƯƠNG TRÌNH STEP 3 --- */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
                            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-1">
                                <Play className="text-violet-500"/> Thêm Video Bài Học
                            </h2>
                            <p className="text-slate-500 text-sm mb-6">Bạn có thể ở lại trang này để thêm liên tục nhiều video.</p>

                            <form onSubmit={handleCreateLesson} className="space-y-5">
                                <div>
                                    <label className="text-sm font-bold text-slate-700 mb-1.5 block">Chọn Chương <span className="text-red-500">*</span></label>
                                    <select required value={form3.chapterId} onChange={e => setForm3({...form3, chapterId: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:border-violet-400">
                                        <option value="">-- Thuộc chương nào? --</option>
                                        {chapters.map(ch => <option key={ch.id} value={ch.id}>{ch.title}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-sm font-bold text-slate-700 mb-1.5 block">Tên bài học <span className="text-red-500">*</span></label>
                                        <input type="text" required value={form3.title} onChange={e => setForm3({...form3, title: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-slate-700 mb-1.5 block">Thời lượng (giây)</label>
                                        <input type="number" min={0} value={form3.durationSeconds} onChange={e => setForm3({...form3, durationSeconds: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400" />
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 py-2">
                                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                        <input type="checkbox" checked={form3.isFreePreview} onChange={e => setForm3({...form3, isFreePreview: e.target.checked})} className="w-4 h-4 rounded text-violet-600" />
                                        Cho phép học thử miễn phí (Preview)
                                    </label>
                                </div>

                                {/* Nguồn Video Picker */}
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="flex border-b border-slate-200 mb-4 pb-2">
                                        <button type="button" onClick={() => setVideoUploadMethod('upload')} className={`flex items-center gap-2 px-4 py-2 font-bold text-sm rounded-lg ${videoUploadMethod === 'upload' ? 'bg-violet-100 text-violet-700' : 'text-slate-500'}`}>
                                            <Video size={16} /> Tải file lên Cloudinary
                                        </button>
                                        <button type="button" onClick={() => setVideoUploadMethod('link')} className={`flex items-center gap-2 px-4 py-2 font-bold text-sm rounded-lg ${videoUploadMethod === 'link' ? 'bg-violet-100 text-violet-700' : 'text-slate-500'}`}>
                                            <LinkIcon size={16} /> Nhập link thủ công
                                        </button>
                                    </div>

                                    {videoUploadMethod === 'upload' ? (
                                        <div>
                                            <label className="text-sm font-bold text-slate-700 mb-2 block">Chọn File Video (.mp4)</label>
                                            <input type="file" id="videoFileInput" accept="video/mp4,video/x-m4v,video/*" onChange={e => setVideoFile(e.target.files[0])}
                                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-white file:text-violet-700 file:shadow-sm" />
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="text-sm font-bold text-slate-700 mb-2 block">Link Video (Youtube/Drive)</label>
                                            <input type="url" value={form3.videoUrl} onChange={e => setForm3({...form3, videoUrl: e.target.value})} placeholder="https://..."
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200" />
                                        </div>
                                    )}
                                </div>

                                {/* Progress Bar if uploading */}
                                {progress > 0 && (
                                    <div className="w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden">
                                        <div className="bg-violet-500 h-3 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <button type="submit" disabled={loading}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition disabled:opacity-50">
                                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Lưu Bài Học & Tiếp tục thêm
                                    </button>
                                </div>
                            </form>
                        </div>
                        
                        {/* Hành động hoàn tất điều hướng */}
                        <div className="flex justify-center mt-6">
                            <button onClick={() => navigate('/instructor/courses')}
                                className="px-8 py-3 rounded-xl bg-violet-100 text-violet-700 font-bold hover:bg-violet-200 transition shadow-sm border border-violet-200">
                                Hoàn tất & Quay lại danh sách
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft, CheckCircle2, XCircle, PlayCircle, Clock } from 'lucide-react';

export default function AdminCourseReview() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [previewVideo, setPreviewVideo] = useState(null);

    const renderVideo = (url) => {
        if (!url) return null;
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            let videoId = '';
            if (url.includes('v=')) videoId = url.split('v=')[1]?.split('&')[0];
            else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1]?.split('?')[0];
            return <iframe src={`https://www.youtube.com/embed/${videoId}?autoplay=1`} className="w-full h-full" allowFullScreen allow="autoplay" title="Video Preview" />
        }
        return <video src={url} controls autoPlay className="w-full h-full" />;
    };

    useEffect(() => {
        axiosClient.get(`/courses/${id}`)
            .then(res => setCourse(res.data))
            .catch(() => toast.error('Không tải được khóa học'))
            .finally(() => setLoading(false));
    }, [id]);

    const handleApprove = async () => {
        setActionLoading(true);
        try {
            await axiosClient.patch(`/admin/courses/${id}/approve`);
            toast.success('Đã phê duyệt khóa học!');
            navigate('/admin/courses');
        } catch (error) {
            toast.error('Lỗi khi phê duyệt');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) return toast.error('Vui lòng nhập lý do từ chối');
        setActionLoading(true);
        try {
            await axiosClient.patch(`/admin/courses/${id}/reject`, { reason: rejectReason });
            toast.success('Đã từ chối khóa học!');
            setShowRejectModal(false);
            navigate('/admin/courses');
        } catch (error) {
            toast.error('Lỗi khi từ chối');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-violet-500" /></div>;
    if (!course) return null;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <button onClick={() => navigate('/admin/courses')} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition">
                <ArrowLeft size={16} /> Quay lại danh sách chờ duyệt
            </button>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row">
                {/* Info */}
                <div className="flex-1 p-8">
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg uppercase tracking-wider mb-4 inline-block">Đang chờ duyệt</span>
                    <h1 className="text-3xl font-black text-slate-900 mb-2">{course.title}</h1>
                    <p className="text-slate-500 text-sm mb-6 max-w-2xl">{course.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Giảng viên</p>
                            <p className="font-bold text-slate-700">{course.instructorName}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Giá bán</p>
                            <p className="font-bold text-violet-600 text-lg">
                                {course.price === 0 ? 'Miễn phí' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Danh mục</p>
                            <p className="font-bold text-slate-700">{course.categoryName}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 border-t border-slate-100 pt-8">
                        <button onClick={handleApprove} disabled={actionLoading}
                            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition shadow-lg shadow-emerald-200">
                            <CheckCircle2 size={20} /> {actionLoading ? 'Đang xử lý...' : 'Phê duyệt & Xuất bản'}
                        </button>
                        <button onClick={() => setShowRejectModal(true)} disabled={actionLoading}
                            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition border border-red-200">
                            <XCircle size={20} /> Từ chối
                        </button>
                    </div>
                </div>

                {/* Thumbnail Preview */}
                <div className="md:w-1/3 bg-slate-100 p-6 flex flex-col justify-center border-l border-slate-100 items-center">
                    <p className="text-xs font-bold text-slate-400 uppercase text-center mb-3">Thông tin đa phương tiện</p>
                    <div 
                        className="w-full aspect-video bg-slate-200 rounded-xl overflow-hidden shadow-sm border border-slate-200/50 relative group cursor-pointer"
                        onClick={() => {
                            // Mở video bài giảng đầu tiên nếu có để Admin review nhanh
                            let firstVideo = null;
                            course.chapters?.forEach(c => {
                                if (!firstVideo) {
                                    const v = c.lessons?.find(l => l.videoUrl);
                                    if (v) firstVideo = v.videoUrl;
                                }
                            });
                            if (firstVideo) setPreviewVideo(firstVideo);
                            else toast.error("Khóa học không có video để xem trước.");
                        }}
                    >
                        {course.thumbnailUrl ? <img src={course.thumbnailUrl} className="w-full h-full object-cover group-hover:opacity-80 transition" /> : null}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                            <PlayCircle size={48} className="text-white" />
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 text-center">Bấm vào ảnh bìa để xem video bài 1</p>
                </div>
            </div>

            {/* Curriculum */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <h3 className="text-xl font-black text-slate-800 mb-6 border-b pb-4">Nội dung Khóa học ({course.chapters?.length || 0} chương)</h3>
                <div className="space-y-4">
                    {course.chapters?.map((ch, idx) => (
                        <div key={ch.id} className="border border-slate-200 rounded-2xl overflow-hidden">
                            <div className="bg-slate-50 px-5 py-4 font-bold text-slate-800 flex justify-between">
                                <span>Chương {idx + 1}: {ch.title}</span>
                                <span className="text-sm font-medium text-slate-500">{ch.lessons?.length || 0} bài</span>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {ch.lessons?.map(ls => (
                                    <div key={ls.id} className="px-5 py-3 flex justify-between items-center bg-white hover:bg-slate-50 transition">
                                        <div className="flex items-center gap-3">
                                            <PlayCircle size={16} className="text-violet-500" />
                                            <span className="text-sm font-medium text-slate-700">{ls.title} {ls.isFreePreview && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded ml-2">Preview</span>}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={12}/>{Math.floor(ls.durationSeconds/60)}:{(ls.durationSeconds%60).toString().padStart(2, '0')}</span>
                                            {ls.videoUrl && (
                                                <button 
                                                    onClick={() => setPreviewVideo(ls.videoUrl)}
                                                    className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition"
                                                >
                                                    Xem Video
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
                        <h3 className="text-xl font-black text-slate-900 mb-2">Từ chối khóa học</h3>
                        <p className="text-sm text-slate-500 mb-6">Bạn phải ghi rõ lý do để giảng viên biết đường cải thiện.</p>
                        
                        <textarea rows={4} autoFocus
                            placeholder="VD: Chất lượng video chưa tốt, thiếu thông tin mô tả chi tiết..."
                            value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none resize-none mb-6"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setShowRejectModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition">Hủy</button>
                            <button onClick={handleReject} disabled={actionLoading} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition flex items-center justify-center gap-2">
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Xác nhận từ chối'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PREVIEW VIDEO MODAL */}
            {previewVideo && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                    <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden aspect-video shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-800">
                        <button 
                            onClick={() => setPreviewVideo(null)} 
                            className="absolute top-4 right-4 z-10 text-white hover:text-red-500 bg-black/50 rounded-full p-2 transition"
                        >
                            <XCircle size={28} />
                        </button>
                        {renderVideo(previewVideo)}
                    </div>
                </div>
            )}
        </div>
    );
}

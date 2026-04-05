import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlayCircle, CheckCircle, Clock, Users, Star, ShoppingCart, Loader2, Heart, XCircle } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function CourseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { addToCart } = useCart();

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [wishlisted, setWishlisted] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
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
        const fetchCourseDetail = async () => {
            try {
                const response = await axiosClient.get(`/courses/${id}`);
                setCourse(response.data.data || response.data);
            } catch (error) {
                console.error("Lỗi:", error);
                toast.error('Không thể tải thông tin khóa học!');
            } finally {
                setLoading(false);
            }
        };
        fetchCourseDetail();
    }, [id]);

    // Kiểm tra trạng thái wishlist khi đã đăng nhập
    useEffect(() => {
        if (!isAuthenticated || !id) return;
        axiosClient.get(`/users/me/wishlist/${id}/status`)
            .then(res => setWishlisted(res.data.wishlisted))
            .catch(() => {}); // Bỏ qua lỗi nếu chưa đăng nhập
    }, [id, isAuthenticated]);

    const handleAddToCart = () => {
        if (!isAuthenticated) {
            toast.error("Vui lòng đăng nhập để mua khóa học!");
            navigate('/login');
            return;
        }
        addToCart(course);
    };

    const handleToggleWishlist = async () => {
        if (!isAuthenticated) {
            toast.error("Vui lòng đăng nhập để thêm vào danh sách yêu thích!");
            navigate('/login');
            return;
        }
        setWishlistLoading(true);
        try {
            if (wishlisted) {
                await axiosClient.delete(`/users/me/wishlist/${id}`);
                setWishlisted(false);
                toast.success('Đã xóa khỏi danh sách yêu thích');
            } else {
                await axiosClient.post(`/users/me/wishlist/${id}`);
                setWishlisted(true);
                toast.success('Đã thêm vào danh sách yêu thích ❤️');
            }
        } catch {
            toast.error('Có lỗi xảy ra, vui lòng thử lại!');
        } finally {
            setWishlistLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-12 h-12 text-violet-600 animate-spin" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <h2 className="text-2xl font-bold text-slate-700">Không tìm thấy khóa học</h2>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* HERO SECTION */}
            <div className="bg-slate-900 text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <span className="bg-violet-600/20 text-violet-300 font-bold px-3 py-1.5 rounded-lg text-sm mb-4 inline-block border border-violet-500/30">
                                {course.categoryName || "Lập trình"}
                            </span>
                            <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
                                {course.title}
                            </h1>
                            <p className="text-slate-300 text-lg mb-8 line-clamp-3">
                                {course.description || "Khóa học chất lượng cao giúp bạn làm chủ kỹ năng từ con số 0."}
                            </p>

                            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-slate-300">
                                <div className="flex items-center text-amber-400">
                                    <Star size={18} className="fill-amber-400 mr-1.5" /> 5.0 (99+ đánh giá)
                                </div>
                                <div className="flex items-center">
                                    <Users size={18} className="mr-1.5" /> 1,234 Học viên
                                </div>
                                <div className="flex items-center">
                                    <Clock size={18} className="mr-1.5" /> 24 Giờ học
                                </div>
                            </div>
                        </div>

                        {/* Card Mua hàng */}
                        <div className="lg:justify-self-end relative w-full max-w-md">
                            <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-2xl absolute lg:-top-20 right-0 w-full z-10 border border-slate-100">
                                <div 
                                    className="relative rounded-2xl overflow-hidden mb-6 group cursor-pointer"
                                    onClick={() => {
                                        // Tìm video preview đầu tiên
                                        let firstPreview = null;
                                        course.chapters?.forEach(c => {
                                            if (!firstPreview) {
                                                const freeLesson = c.lessons?.find(l => l.isFreePreview && l.videoUrl);
                                                if (freeLesson) firstPreview = freeLesson.videoUrl;
                                            }
                                        });
                                        if (firstPreview) setPreviewVideo(firstPreview);
                                        else toast.error("Khóa học chưa có video xem trước.");
                                    }}
                                >
                                    <img
                                        src={course.thumbnailUrl || "https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=800"}
                                        alt="Thumbnail"
                                        className="w-full h-56 object-cover"
                                    />
                                    <div className="absolute inset-0 bg-slate-900/40 flex flex-col items-center justify-center group-hover:bg-slate-900/50 transition-all">
                                        <PlayCircle className="text-white w-16 h-16 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all mb-2" />
                                        <span className="text-white font-bold text-sm bg-black/50 px-3 py-1 rounded-full">Xem giới thiệu</span>
                                    </div>
                                </div>

                                <div className="text-3xl font-black text-violet-600 mb-6">
                                    {course.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price) : 'Miễn phí'}
                                </div>

                                <button
                                    onClick={handleAddToCart}
                                    className="w-full flex items-center justify-center py-4 rounded-xl text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 font-bold text-lg shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-1 mb-3"
                                >
                                    <ShoppingCart className="mr-2" /> Thêm vào giỏ hàng
                                </button>

                                {/* Nút Wishlist */}
                                <button
                                    onClick={handleToggleWishlist}
                                    disabled={wishlistLoading}
                                    className={`w-full flex items-center justify-center py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                                        wishlisted
                                            ? 'border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100'
                                            : 'border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:text-rose-500 hover:bg-rose-50'
                                    }`}
                                >
                                    <Heart
                                        size={18}
                                        className={`mr-2 transition-all ${wishlisted ? 'fill-rose-500 text-rose-500' : ''}`}
                                    />
                                    {wishlisted ? 'Đã yêu thích' : 'Thêm vào yêu thích'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PHẦN NỘI DUNG */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 lg:mt-24">
                <div className="max-w-2xl">
                    <h2 className="text-2xl font-black text-slate-900 mb-6">Bạn sẽ học được gì?</h2>
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            "Nắm vững kiến thức thực chiến từ chuyên gia hàng đầu.",
                            "Xây dựng dự án thực tế để bổ sung portfolio.",
                            "Hiểu sâu các khái niệm cốt lõi và best practices.",
                            "Được hỗ trợ bởi cộng đồng học viên tích cực."
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-start">
                                <CheckCircle className="text-emerald-500 w-6 h-6 mr-3 shrink-0 mt-0.5" />
                                <span className="text-slate-600 font-medium">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CURRICULUM SECTION */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-12">
                <div className="max-w-2xl">
                    <h2 className="text-2xl font-black text-slate-900 mb-6">Nội dung khóa học</h2>
                    <div className="space-y-4">
                        {course.chapters?.map((ch, idx) => (
                            <div key={ch.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                                <div className="bg-slate-50 px-6 py-4 font-bold text-slate-800 flex justify-between border-b border-slate-100">
                                    <span>Chương {idx + 1}: {ch.title}</span>
                                    <span className="text-sm font-medium text-slate-500">{ch.lessons?.length || 0} bài</span>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {ch.lessons?.map((ls, lIdx) => (
                                        <div key={ls.id} className="px-6 py-4 flex justify-between items-center transition hover:bg-slate-50/50">
                                            <div className="flex items-center gap-3">
                                                <PlayCircle size={18} className="text-slate-400" />
                                                <span className="text-sm font-bold text-slate-700">
                                                    Bài {lIdx + 1}: {ls.title}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {ls.isFreePreview && ls.videoUrl && (
                                                    <button 
                                                        onClick={() => setPreviewVideo(ls.videoUrl)}
                                                        className="text-xs font-bold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-lg hover:bg-violet-100 transition"
                                                    >
                                                        Xem trước
                                                    </button>
                                                )}
                                                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                                    <Clock size={14}/>
                                                    {Math.floor(ls.durationSeconds/60)}:{(ls.durationSeconds%60).toString().padStart(2, '0')}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {(!course.chapters || course.chapters.length === 0) && (
                            <p className="text-slate-500 text-center py-8 bg-white border border-slate-200 rounded-2xl">Khóa học này chưa có nội dung.</p>
                        )}
                    </div>
                </div>
            </div>

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
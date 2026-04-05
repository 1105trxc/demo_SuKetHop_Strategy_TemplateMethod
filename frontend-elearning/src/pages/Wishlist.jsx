import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Heart, ShoppingCart, Star, Trash2, BookOpen,
    Loader2, ArrowRight
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';

export default function Wishlist() {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState(null);

    useEffect(() => {
        axiosClient.get('/users/me/wishlist')
            .then(res => setCourses(res.data))
            .catch(() => toast.error('Không thể tải danh sách yêu thích.'))
            .finally(() => setLoading(false));
    }, []);

    const handleRemove = async (courseId) => {
        setRemovingId(courseId);
        try {
            await axiosClient.delete(`/users/me/wishlist/${courseId}`);
            setCourses(prev => prev.filter(c => c.id !== courseId));
            toast.success('Đã xóa khỏi danh sách yêu thích');
        } catch {
            toast.error('Có lỗi xảy ra, vui lòng thử lại!');
        } finally {
            setRemovingId(null);
        }
    };

    const handleAddToCart = (course) => {
        addToCart(course);
        toast.success(`Đã thêm "${course.title}" vào giỏ hàng!`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-rose-50/30">
                <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50/20 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-600 to-pink-600 text-white py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                            <Heart className="w-7 h-7 fill-white text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">Danh sách yêu thích</h1>
                            <p className="text-rose-200 text-sm mt-0.5">{courses.length} khóa học đã lưu</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 -mt-6">
                {courses.length === 0 ? (
                    /* Empty State */
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-16 text-center mt-8">
                        <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-6">
                            <Heart className="w-10 h-10 text-rose-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-700 mb-2">Chưa có khóa học yêu thích</h3>
                        <p className="text-slate-400 mb-8 max-w-sm mx-auto">
                            Hãy duyệt qua các khóa học và nhấn ❤ để lưu lại những khóa học bạn quan tâm.
                        </p>
                        <Link
                            to="/courses"
                            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 hover:from-violet-700 hover:to-indigo-700 transition hover:-translate-y-0.5"
                        >
                            <BookOpen size={18} /> Khám phá khóa học
                        </Link>
                    </div>
                ) : (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {courses.map(course => (
                            <div
                                key={course.id}
                                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden"
                            >
                                {/* Thumbnail */}
                                <div className="relative h-44 overflow-hidden bg-slate-100">
                                    <img
                                        src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=800'}
                                        alt={course.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    {/* Quick remove button */}
                                    <button
                                        onClick={() => handleRemove(course.id)}
                                        disabled={removingId === course.id}
                                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-md opacity-0 group-hover:opacity-100"
                                        title="Xóa khỏi yêu thích"
                                    >
                                        {removingId === course.id
                                            ? <Loader2 size={14} className="animate-spin" />
                                            : <Trash2 size={14} />
                                        }
                                    </button>
                                    {/* Category badge */}
                                    {course.categoryName && (
                                        <span className="absolute bottom-3 left-3 text-[11px] font-bold px-2 py-1 bg-black/60 text-white rounded-lg backdrop-blur-sm">
                                            {course.categoryName}
                                        </span>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <h3 className="font-bold text-slate-900 line-clamp-2 mb-1 group-hover:text-violet-700 transition-colors">
                                        {course.title}
                                    </h3>
                                    <p className="text-xs text-slate-400 mb-3">
                                        {course.instructorName || 'Giảng viên'}
                                    </p>

                                    <div className="flex items-center gap-1 mb-4">
                                        <Star size={13} className="fill-amber-400 text-amber-400" />
                                        <span className="text-xs font-bold text-amber-600">5.0</span>
                                        <span className="text-xs text-slate-400 ml-1">(99+)</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-black text-violet-600">
                                            {course.price
                                                ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price)
                                                : 'Miễn phí'
                                            }
                                        </span>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="mt-4 flex gap-2">
                                        <button
                                            onClick={() => handleAddToCart(course)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm rounded-xl hover:from-violet-700 hover:to-indigo-700 transition shadow-md shadow-violet-500/20"
                                        >
                                            <ShoppingCart size={15} /> Thêm vào giỏ
                                        </button>
                                        <button
                                            onClick={() => navigate(`/courses/${course.id}`)}
                                            className="w-10 h-10 rounded-xl border-2 border-slate-200 flex items-center justify-center text-slate-500 hover:border-violet-500 hover:text-violet-600 transition flex-shrink-0"
                                            title="Xem chi tiết"
                                        >
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

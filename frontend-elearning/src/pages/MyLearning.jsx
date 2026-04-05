import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, PlayCircle, Trophy, Loader2, Search } from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function MyLearning() {
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyCourses = async () => {
            try {
                // Gọi API lấy danh sách khóa học đã ghi danh
                const response = await axiosClient.get('/enrollments/my-courses');
                // Lưu ý: Tùy vào cấu trúc DTO trả về, có thể là response.data hoặc response.data.data
                setEnrollments(response.data.data || response.data);
            } catch (error) {
                console.error("Lỗi tải khóa học:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyCourses();
    }, []);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header Section */}
            <div className="mb-10">
                <h1 className="text-4xl font-black text-slate-900 mb-2">Khóa học của tôi</h1>
                <p className="text-slate-500 font-medium">Tiếp tục hành trình chinh phục tri thức cùng UTE-Learn.</p>
            </div>

            {enrollments.length === 0 ? (
                /* Empty State */
                <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-slate-200">
                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <BookOpen className="text-slate-300 w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Bạn chưa sở hữu khóa học nào</h2>
                    <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                        Hãy khám phá kho tàng kiến thức của chúng tôi và chọn cho mình những kỹ năng mới nhất.
                    </p>
                    <Link to="/courses" className="inline-flex items-center px-8 py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition-all shadow-lg shadow-violet-200">
                        Khám phá khóa học ngay
                    </Link>
                </div>
            ) : (
                /* Grid Danh sách khóa học */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {enrollments.map((item) => {
                        // Backend trả về DTO lồng Course bên trong Enrollment
                        const course = item.course;
                        const progress = item.progressPercent || 0;

                        return (
                            <div key={item.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                                {/* Thumbnail */}
                                <div className="relative h-48 overflow-hidden">
                                    <img
                                        src={course.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800"}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        alt={course.title}
                                    />
                                    {progress === 100 && (
                                        <div className="absolute top-4 right-4 bg-emerald-500 text-white p-2 rounded-full shadow-lg">
                                            <Trophy size={16} />
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <span className="text-[10px] uppercase tracking-widest font-black text-violet-500 mb-2 block">
                                        {course.categoryName || "Lập trình"}
                                    </span>
                                    <h3 className="text-lg font-bold text-slate-900 mb-4 line-clamp-2 h-14">
                                        {course.title}
                                    </h3>

                                    {/* Progress Bar */}
                                    <div className="mb-6">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-xs font-bold text-slate-400">Tiến độ học tập</span>
                                            <span className="text-sm font-black text-violet-600">{progress}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-violet-500 to-indigo-600 transition-all duration-1000"
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <Link
                                        to={`/learning/${course.id}`}
                                        className="w-full flex items-center justify-center py-3.5 rounded-xl font-bold bg-slate-900 text-white hover:bg-violet-600 transition-colors group-hover:shadow-lg shadow-violet-200"
                                    >
                                        <PlayCircle className="mr-2" size={20} />
                                        {progress === 0 ? "Bắt đầu học" : progress === 100 ? "Học lại bài" : "Tiếp tục học"}
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
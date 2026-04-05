import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, Users, BookOpen, Loader2 } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';

export default function Courses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await axiosClient.get('/courses');

                // IN RA CONSOLE ĐỂ XEM BACKEND TRẢ VỀ CÁI GÌ
                console.log("Dữ liệu từ API /courses:", response.data);

                // Thuật toán "bọc thép": Dò tìm mảng khóa học trong mọi cấu trúc có thể có của Spring Boot
                let courseList = [];
                if (Array.isArray(response.data)) {
                    courseList = response.data; // Trường hợp trả về List thẳng
                } else if (response.data && Array.isArray(response.data.content)) {
                    courseList = response.data.content; // Trường hợp trả về Pageable của Spring Data
                } else if (response.data && Array.isArray(response.data.data)) {
                    courseList = response.data.data; // Trường hợp trả về custom ApiResponse { data: [...] }
                }

                setCourses(courseList);
            } catch (error) {
                console.error("Lỗi gọi API:", error);
                // Nếu bị lỗi 401 (Chưa đăng nhập) hoặc 403 (Cấm), vẫn cho courses là mảng rỗng để không bị crash
                setCourses([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    // Bọc thép thêm lần nữa: Đảm bảo courses luôn là MẢNG trước khi filter
    const safeCourses = Array.isArray(courses) ? courses : [];

    const filteredCourses = safeCourses.filter(course =>
        course.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header & Thanh tìm kiếm */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 space-y-6 md:space-y-0">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Khám phá Khóa học</h1>
                        <p className="mt-2 text-lg text-slate-500 font-medium">Học hỏi kỹ năng mới từ các chuyên gia hàng đầu</p>
                    </div>

                    <div className="relative w-full md:w-96">
                        <input
                            type="text"
                            placeholder="Tìm kiếm khóa học..."
                            className="w-full bg-white border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-700 shadow-sm transition-all outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-4 top-3.5 text-slate-400" size={22} />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-12 h-12 text-violet-600 animate-spin mb-4" />
                        <p className="text-slate-500 font-medium animate-pulse">Đang tải dữ liệu từ máy chủ...</p>
                    </div>
                ) : filteredCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredCourses.map((course) => (
                            <Link to={`/courses/${course.id}`} key={course.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-lg shadow-slate-200/40 hover:shadow-2xl hover:shadow-violet-500/20 transition-all duration-300 group flex flex-col hover:-translate-y-1">
                                <div className="relative h-56 overflow-hidden bg-slate-200">
                                    <img
                                        src={course.thumbnailUrl || "https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=800&auto=format&fit=crop"}
                                        alt={course.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-violet-700 text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm">
                                        {course.category?.name || "Lập trình"}
                                    </div>
                                </div>

                                <div className="p-6 flex flex-col flex-1">
                                    <h3 className="text-xl font-bold text-slate-900 leading-tight mb-3 group-hover:text-violet-600 transition-colors line-clamp-2">
                                        {course.title}
                                    </h3>

                                    <div className="flex items-center text-slate-500 text-sm font-medium mb-6">
                                        <BookOpen size={16} className="mr-2" />
                                        <span>Giảng viên: {course.instructor?.fullName || "Đang cập nhật"}</span>
                                    </div>

                                    <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-5">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex items-center text-amber-500 font-bold text-sm">
                                                <Star size={16} className="fill-amber-500 mr-1" /> 5.0
                                            </div>
                                            <div className="flex items-center text-slate-500 text-sm font-medium">
                                                <Users size={16} className="mr-1" /> {course.status === 'PUBLISHED' ? 'Đang mở' : course.status || "N/A"}
                                            </div>
                                        </div>
                                        <span className="text-2xl font-black text-violet-600">
                                            {course.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price) : 'Miễn phí'}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
                        <div className="bg-violet-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                            <BookOpen size={40} className="text-violet-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Chưa có khóa học nào</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            Hệ thống hiện tại chưa có khóa học nào hoặc không tìm thấy kết quả phù hợp với từ khóa của bạn.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
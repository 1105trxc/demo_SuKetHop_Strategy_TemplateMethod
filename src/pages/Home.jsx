import { ArrowRight, PlayCircle, Star, Users, Clock, ShieldCheck, Zap, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';

export default function Home() {
    const [topCourses, setTopCourses] = useState([]);

    useEffect(() => {
        // Lấy 3 khóa học mới nhất để hiển thị
        axiosClient.get('/courses').then(res => {
            const data = res.data.data || res.data;
            setTopCourses(data.slice(0, 3));
        }).catch(err => console.log(err));
    }, []);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* HERO SECTION */}
            <div className="relative bg-white pt-20 pb-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
                        <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-violet-100 text-violet-700 text-sm font-bold mb-6">
                                🚀 Chào mừng bạn đến với UTE-Learn
                            </span>
                            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] mb-8">
                                Học kỹ năng mới <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">Mở lối tương lai</span>
                            </h1>
                            <p className="text-lg text-slate-600 font-medium mb-10 leading-relaxed">
                                Nền tảng học trực tuyến chất lượng cao từ các chuyên gia.
                                Chúng tôi cung cấp lộ trình bài bản giúp bạn làm chủ công nghệ chỉ trong vài tháng.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link to="/courses" className="flex items-center justify-center px-8 py-4 bg-violet-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-violet-200 hover:bg-violet-700 transition-all">
                                    Bắt đầu học ngay <ArrowRight className="ml-2" />
                                </Link>
                                <Link to="/become-instructor" className="flex items-center justify-center px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-bold text-lg hover:border-violet-300 transition-all">
                                    Dạy học trên UTE-Learn
                                </Link>
                            </div>
                        </div>
                        <div className="mt-16 lg:mt-0 lg:col-span-6 relative">
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-8 border-white">
                                <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200" alt="Hero" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/20 to-transparent"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* STATS SECTION */}
            <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-20">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
                    {[
                        { label: 'Học viên', val: '10,000+', icon: Users, color: 'text-blue-500' },
                        { label: 'Khóa học', val: '500+', icon: PlayCircle, color: 'text-violet-500' },
                        { label: 'Giảng viên', val: '200+', icon: ShieldCheck, color: 'text-emerald-500' },
                        { label: 'Quốc gia', val: '15+', icon: Globe, color: 'text-amber-500' },
                    ].map((s, idx) => (
                        <div key={idx} className="text-center md:border-r last:border-0 border-slate-100 px-4">
                            <div className={`flex justify-center mb-2 ${s.color}`}><s.icon size={24} /></div>
                            <p className="text-2xl font-black text-slate-900">{s.val}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* FEATURED COURSES */}
            <div className="max-w-7xl mx-auto px-4 py-24">
                <div className="flex justify-between items-center mb-12">
                    <h2 className="text-3xl font-black text-slate-900">Khóa học mới nhất</h2>
                    <Link to="/courses" className="text-violet-600 font-bold flex items-center hover:underline">
                        Tất cả khóa học <ArrowRight size={18} className="ml-1" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {topCourses.map((course) => (
                        <Link to={`/courses/${course.id}`} key={course.id} className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                            <div className="h-48 overflow-hidden relative">
                                <img src={course.thumbnailUrl || "https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=800"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold shadow-sm">
                                    {course.categoryName || 'General'}
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-violet-600">{course.title}</h3>
                                <p className="text-sm text-slate-500 mb-4 font-medium">Giảng viên: {course.instructorName}</p>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <span className="text-xl font-black text-violet-600">
                                        {course.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price) : 'Miễn phí'}
                                    </span>
                                    <div className="flex items-center text-amber-500 font-bold text-sm">
                                        <Star size={14} className="fill-amber-500 mr-1" /> 5.0
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
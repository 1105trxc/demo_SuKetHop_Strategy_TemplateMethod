import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, Search, LayoutDashboard, PlusCircle, ShoppingCart, Heart, ChevronDown, PlayCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
    const navigate = useNavigate();
    const { isAuthenticated, user, logout } = useAuth();
    const { cart } = useCart();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const menuRef = useRef(null);

    // Đóng menu khi bấm ra ngoài
    useEffect(() => {
        const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
            setIsMenuOpen(false);
        }
    };

    const isInstructor = user?.roles?.includes('ROLE_INSTRUCTOR');
    const avatarLetter = user?.fullName?.charAt(0)?.toUpperCase() || '?';

    return (
        <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">

                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2 shrink-0">
                        <div className="bg-violet-600 text-white p-2 rounded-xl shadow-lg shadow-violet-200"><BookOpen size={24} /></div>
                        <span className="font-black text-xl text-slate-800 tracking-tight">UTE-Learn</span>
                    </Link>

                    {/* Search Bar */}
                    <div className="hidden md:flex flex-1 max-w-md mx-10">
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder="Tìm khóa học, kỹ năng..."
                                className="w-full bg-slate-100 border-none focus:ring-2 focus:ring-violet-200 rounded-full py-2.5 pl-11 text-sm transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearch}
                            />
                            <Search className="absolute left-4 top-3 text-slate-400" size={18} />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-5">
                        <Link to="/cart" className="relative text-slate-500 hover:text-violet-600 transition-colors">
                            <ShoppingCart size={22} />
                            {cart.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                                    {cart.length}
                                </span>
                            )}
                        </Link>

                        {isAuthenticated ? (
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-slate-100 transition"
                                >
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                                        {avatarLetter}
                                    </div>
                                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isMenuOpen && (
                                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2">
                                        <div className="px-5 py-4 border-b border-slate-50 mb-2">
                                            <p className="text-sm font-black text-slate-900">{user?.fullName}</p>
                                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                                        </div>

                                        <Link to="/my-learning" onClick={()=>setIsMenuOpen(false)} className="flex items-center px-5 py-3 text-sm text-slate-600 hover:bg-violet-50 hover:text-violet-600 font-medium">
                                            <PlayCircle size={18} className="mr-3 text-slate-400" /> Khóa học đã mua
                                        </Link>
                                        <Link to="/my-orders" onClick={()=>setIsMenuOpen(false)} className="flex items-center px-5 py-3 text-sm text-slate-600 hover:bg-violet-50 hover:text-violet-600 font-medium">
                                            <ShoppingCart size={18} className="mr-3 text-slate-400" /> Lịch sử đơn hàng
                                        </Link>
                                        <Link to="/wishlist" onClick={()=>setIsMenuOpen(false)} className="flex items-center px-5 py-3 text-sm text-slate-600 hover:bg-violet-50 hover:text-violet-600 font-medium border-slate-50">
                                            <Heart size={18} className="mr-3 text-slate-400" /> Danh sách yêu thích
                                        </Link>
                                        <Link to="/settings" onClick={()=>setIsMenuOpen(false)} className="flex items-center px-5 py-3 text-sm text-slate-600 hover:bg-violet-50 hover:text-violet-600 font-medium border-b border-slate-50 pb-4 mb-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-slate-400"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> Cài đặt thông tin
                                        </Link>

                                        {isInstructor ? (
                                            <Link to="/instructor" onClick={()=>setIsMenuOpen(false)} className="flex items-center px-5 py-3 text-sm text-indigo-600 bg-indigo-50/50 font-bold hover:bg-indigo-50">
                                                <LayoutDashboard size={18} className="mr-3" /> Dashboard Giảng viên
                                            </Link>
                                        ) : (
                                            <Link to="/become-instructor" onClick={()=>setIsMenuOpen(false)} className="flex items-center px-5 py-3 text-sm text-emerald-600 font-bold hover:bg-emerald-50">
                                                <PlusCircle size={18} className="mr-3" /> Trở thành giảng viên
                                            </Link>
                                        )}

                                        <button
                                            onClick={() => { setIsMenuOpen(false); logout(); navigate('/login'); }}
                                            className="w-full flex items-center px-5 py-3 text-sm text-rose-500 font-bold hover:bg-rose-50 mt-2 border-t border-slate-50"
                                        >
                                            <LogOut size={18} className="mr-3" /> Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/login" className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">Bắt đầu</Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
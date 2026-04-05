import { useState, useEffect } from 'react';
import { User as UserIcon, Phone, Save, Loader2 } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function ProfileSettings() {
    const { user, login } = useAuth(); // Assuming login or similar context function can update state, actually we'll just reload or rely on local state
    
    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                phoneNumber: user.phoneNumber || ''
            });
        }
    }, [user]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await axiosClient.put('/users/me', formData);
            toast.success(res.data?.message || 'Cập nhật thành công!');
            // Update auth state if possible (e.g. reload layout)
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể cập nhật hồ sơ. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-10 text-white text-center sm:text-left">
                        <h1 className="text-3xl font-black mb-2">Cài đặt Tài Khoản</h1>
                        <p className="text-violet-100 font-medium">Cập nhật thông tin cá nhân của bạn</p>
                    </div>

                    {/* Form */}
                    <div className="p-8 sm:p-10">
                        <form onSubmit={handleSave} className="space-y-8">
                            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                                {/* Name */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-bold text-slate-900">
                                        Họ và tên <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                        <input
                                            type="text"
                                            required
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium text-slate-900"
                                            placeholder="Nhập họ và tên..."
                                        />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-bold text-slate-900">
                                        Số điện thoại
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                        <input
                                            type="tel"
                                            value={formData.phoneNumber}
                                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium text-slate-900"
                                            placeholder="Nhập số điện thoại..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Email - Readonly */}
                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-slate-900">
                                    Email (Không thể thay đổi)
                                </label>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
                                />
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white shadow-xl shadow-violet-500/30 transition-all 
                                    ${saving ? 'bg-violet-400 cursor-not-allowed' : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 hover:-translate-y-1'}`}
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Lưu thay đổi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

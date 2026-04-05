import { useState, useEffect } from 'react';
import { Loader2, Users, Search } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

const ROLE_COLOR = {
    ROLE_ADMIN: 'bg-violet-100 text-violet-700',
    ROLE_INSTRUCTOR: 'bg-emerald-100 text-emerald-700',
    ROLE_STUDENT: 'bg-blue-100 text-blue-700',
};

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        axiosClient.get('/admin/users')
            .then(res => setUsers(res.data))
            .catch(() => toast.error('Không thể tải danh sách người dùng.'))
            .finally(() => setLoading(false));
    }, []);

    const filtered = users.filter(u =>
        u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Quản lý Người dùng</h1>
                    <p className="text-slate-500 text-sm mt-0.5">{users.length} tài khoản trong hệ thống.</p>
                </div>
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên hoặc email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-violet-400 outline-none text-sm w-64 bg-white"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-bold">Không tìm thấy người dùng</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                {['Người dùng', 'Email', 'SĐT', 'Quyền', 'Trạng thái'].map(h => (
                                    <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50/50 transition">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-black text-sm shrink-0">
                                                {u.fullName?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <span className="font-semibold text-slate-900 text-sm">{u.fullName}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-600">{u.email}</td>
                                    <td className="px-5 py-4 text-sm text-slate-600">{u.phoneNumber || '--'}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {(u.roles || []).map(role => (
                                                <span key={role} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLOR[role] || 'bg-slate-100 text-slate-500'}`}>
                                                    {role.replace('ROLE_', '')}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                            u.status === 'ACTIVE'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {u.status === 'ACTIVE' ? 'Hoạt động' : u.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

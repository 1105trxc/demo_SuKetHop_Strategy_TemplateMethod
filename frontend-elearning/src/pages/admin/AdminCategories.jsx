import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2, Tag, X, FolderOpen } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

export default function AdminCategories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null); // null | 'create' | categoryId
    const [form, setForm] = useState({ name: '', parentId: '' });
    const [saving, setSaving] = useState(false);

    const fetchCategories = () => {
        setLoading(true);
        axiosClient.get('/admin/categories')
            .then(res => setCategories(res.data))
            .catch(() => toast.error('Không thể tải danh mục.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchCategories(); }, []);

    const openCreate = () => { setForm({ name: '', parentId: '' }); setModal('create'); };
    const openEdit = (cat) => { setForm({ name: cat.name, parentId: '' }); setModal(cat.id); };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return toast.error('Tên danh mục không được để trống!');
        setSaving(true);
        try {
            const payload = {
                name: form.name,
                parentId: form.parentId || null
            };
            if (modal === 'create') {
                await axiosClient.post('/admin/categories', payload);
                toast.success('Đã tạo danh mục!');
            } else {
                await axiosClient.put(`/admin/categories/${modal}`, payload);
                toast.success('Đã cập nhật danh mục!');
            }
            setModal(null);
            fetchCategories();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Có lỗi xảy ra!');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Xóa danh mục này? Các khóa học thuộc danh mục sẽ không còn danh mục.')) return;
        const t = toast.loading('Đang xóa...');
        try {
            await axiosClient.delete(`/admin/categories/${id}`);
            toast.dismiss(t); toast.success('Đã xóa danh mục!');
            fetchCategories();
        } catch (e) { toast.dismiss(t); toast.error(e.response?.data?.message || 'Lỗi!'); }
    };

    // Nhóm danh mục theo parent
    const roots = categories.filter(c => !c.parentId);
    const childrenOf = (parentId) => categories.filter(c => c.parentId === parentId);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Quản lý Danh mục</h1>
                    <p className="text-slate-500 text-sm mt-0.5">{categories.length} danh mục trong hệ thống.</p>
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 hover:from-violet-700 hover:to-indigo-700 transition">
                    <Plus size={18} /> Thêm danh mục
                </button>
            </div>

            {/* Modal */}
            {modal !== null && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="font-black text-slate-900">
                                {modal === 'create' ? 'Thêm danh mục' : 'Sửa danh mục'}
                            </h3>
                            <button onClick={() => setModal(null)}><X size={18} className="text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tên danh mục *</label>
                                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="VD: Lập trình Web"
                                    className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-violet-400 outline-none text-sm" />
                            </div>
                            {modal === 'create' && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Danh mục cha (tùy chọn)</label>
                                    <select value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
                                        className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-violet-400 outline-none bg-white text-sm">
                                        <option value="">-- Không có --</option>
                                        {roots.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setModal(null)}
                                    className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition">Hủy</button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 disabled:opacity-50 transition">
                                    {saving ? 'Đang lưu...' : 'Lưu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></div>
            ) : categories.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
                    <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-bold">Chưa có danh mục nào</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roots.map(root => {
                        const children = childrenOf(root.id);
                        return (
                            <div key={root.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                {/* Parent category */}
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-violet-50/50 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <FolderOpen size={18} className="text-violet-500" />
                                        <span className="font-black text-slate-900">{root.name}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => openEdit(root)}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition">
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(root.id)}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                {/* Children */}
                                <div className="p-3 space-y-1">
                                    {children.length === 0 ? (
                                        <p className="text-xs text-slate-400 px-2 py-1 italic">Chưa có danh mục con</p>
                                    ) : children.map(child => (
                                        <div key={child.id} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 transition group">
                                            <div className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-violet-400 transition" />
                                                <span className="text-sm text-slate-700 font-medium">{child.name}</span>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                                <button onClick={() => openEdit(child)}
                                                    className="p-1 rounded text-slate-400 hover:text-violet-600 transition"><Pencil size={12} /></button>
                                                <button onClick={() => handleDelete(child.id)}
                                                    className="p-1 rounded text-slate-400 hover:text-red-500 transition"><Trash2 size={12} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

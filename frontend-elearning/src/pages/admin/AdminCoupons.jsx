import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2, BadgePercent, X } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

const emptyForm = { code: '', discountPercent: '', maxDiscountAmount: '', expiryDate: '' };

export default function AdminCoupons() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null); // null | 'create' | couponId
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const fetchCoupons = () => {
        setLoading(true);
        axiosClient.get('/admin/coupons')
            .then(res => setCoupons(res.data))
            .catch(() => toast.error('Không thể tải danh sách mã giảm giá.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchCoupons(); }, []);

    const openCreate = () => { setForm(emptyForm); setModal('create'); };
    const openEdit = (c) => {
        setForm({
            code: c.code || '',
            discountPercent: c.discountPercent || '',
            maxDiscountAmount: c.maxDiscountAmount || '',
            expiryDate: c.expiryDate ? c.expiryDate.slice(0, 16) : ''
        });
        setModal(c.id);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.code.trim()) return toast.error('Vui lòng nhập mã!');
        setSaving(true);
        try {
            const payload = {
                code: form.code.toUpperCase(),
                discountPercent: parseInt(form.discountPercent) || 0,
                maxDiscountAmount: form.maxDiscountAmount ? parseFloat(form.maxDiscountAmount) : null,
                expiryDate: form.expiryDate || null,
            };
            if (modal === 'create') {
                await axiosClient.post('/admin/coupons', payload);
                toast.success('Đã tạo mã giảm giá!');
            } else {
                await axiosClient.put(`/admin/coupons/${modal}`, payload);
                toast.success('Đã cập nhật mã giảm giá!');
            }
            setModal(null);
            fetchCoupons();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Có lỗi xảy ra!');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Xóa mã giảm giá này?')) return;
        const t = toast.loading('Đang xóa...');
        try {
            await axiosClient.delete(`/admin/coupons/${id}`);
            toast.dismiss(t); toast.success('Đã xóa!');
            fetchCoupons();
        } catch (e) { toast.dismiss(t); toast.error(e.response?.data?.message || 'Lỗi!'); }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Mã giảm giá</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Tạo và quản lý coupon cho hệ thống.</p>
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 hover:from-violet-700 hover:to-indigo-700 transition">
                    <Plus size={18} /> Tạo mã mới
                </button>
            </div>

            {/* Modal */}
            {modal !== null && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="font-black text-slate-900">
                                {modal === 'create' ? 'Tạo mã giảm giá mới' : 'Chỉnh sửa mã giảm giá'}
                            </h3>
                            <button onClick={() => setModal(null)} className="p-1 rounded-lg hover:bg-slate-100 transition">
                                <X size={18} className="text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mã coupon *</label>
                                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                                    placeholder="VD: SUMMER20"
                                    className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-violet-400 outline-none font-mono font-bold uppercase text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Giảm (%)</label>
                                    <input type="number" min={1} max={100} value={form.discountPercent}
                                        onChange={e => setForm(f => ({ ...f, discountPercent: e.target.value }))}
                                        className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-violet-400 outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tối đa (VNĐ)</label>
                                    <input type="number" min={0} value={form.maxDiscountAmount}
                                        onChange={e => setForm(f => ({ ...f, maxDiscountAmount: e.target.value }))}
                                        placeholder="Không giới hạn"
                                        className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-violet-400 outline-none text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày hết hạn</label>
                                <input type="datetime-local" value={form.expiryDate}
                                    onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                                    className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-violet-400 outline-none text-sm" />
                            </div>
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
            ) : coupons.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
                    <BadgePercent className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-bold">Chưa có mã giảm giá nào</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                {['Mã coupon', 'Giảm', 'Tối đa', 'Hết hạn', ''].map((h, i) => (
                                    <th key={i} className={`px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider ${i === 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {coupons.map(c => {
                                const expired = c.expiryDate && new Date(c.expiryDate) < new Date();
                                return (
                                    <tr key={c.id} className={`hover:bg-slate-50/50 transition ${expired ? 'opacity-50' : ''}`}>
                                        <td className="px-5 py-4">
                                            <span className="font-mono font-black text-slate-900 bg-violet-50 text-violet-700 px-3 py-1 rounded-lg text-sm">
                                                {c.code}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 font-bold text-emerald-600">{c.discountPercent}%</td>
                                        <td className="px-5 py-4 text-sm text-slate-600">
                                            {c.maxDiscountAmount
                                                ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c.maxDiscountAmount)
                                                : 'Không giới hạn'}
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-500">
                                            {c.expiryDate
                                                ? <span className={expired ? 'text-red-500 font-bold' : ''}>
                                                    {new Date(c.expiryDate).toLocaleDateString('vi-VN')}
                                                    {expired && ' (Hết hạn)'}
                                                  </span>
                                                : 'Không giới hạn'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openEdit(c)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition">
                                                    <Pencil size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(c.id)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

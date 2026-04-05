import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil, Loader2, ChevronLeft, AlertCircle, Save } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

function FieldError({ msg }) {
    if (!msg) return null;
    return (
        <p className="flex items-center gap-1 text-red-500 text-xs mt-1 font-medium">
            <AlertCircle size={12} /> {msg}
        </p>
    );
}

export default function EditCourse() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState([]);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [form, setForm] = useState({
        title: '', description: '', price: '', categoryId: '', thumbnailUrl: ''
    });
    const [errors, setErrors] = useState({});

    // Load course data + categories
    useEffect(() => {
        Promise.all([
            axiosClient.get(`/courses/${id}`),
            axiosClient.get('/categories')
        ])
        .then(([courseRes, catRes]) => {
            const course = courseRes.data;
            // Kiểm tra chỉ DRAFT mới được sửa
            if (course.status !== 'DRAFT') {
                toast.error('Chỉ có thể chỉnh sửa khóa học ở trạng thái Nháp!');
                navigate('/instructor/courses');
                return;
            }
            setForm({
                title: course.title || '',
                description: course.description || '',
                price: course.price || '',
                categoryId: course.categoryId || '',
                thumbnailUrl: course.thumbnailUrl || ''
            });
            setCategories(catRes.data);
        })
        .catch(() => {
            toast.error('Không thể tải thông tin khóa học.');
            navigate('/instructor/courses');
        })
        .finally(() => setLoading(false));
    }, [id, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        const errs = {};
        if (!form.title.trim()) errs.title = 'Tiêu đề không được để trống.';
        if (!form.price && form.price !== 0) errs.price = 'Vui lòng nhập giá.';
        if (!form.categoryId) errs.categoryId = 'Vui lòng chọn danh mục.';
        if (!form.thumbnailUrl && !thumbnailFile) errs.thumbnailUrl = 'Vui lòng chọn ảnh bìa.';
        return errs;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setSaving(true);
        try {
            let finalThumbnailUrl = form.thumbnailUrl;

            // Upload thumbnail mới nếu có
            if (thumbnailFile) {
                const fd = new FormData();
                fd.append('file', thumbnailFile);
                const uploadRes = await axiosClient.post('/files/upload?folder=course_thumbnails', fd, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                finalThumbnailUrl = uploadRes.data;
            }

            await axiosClient.put(`/courses/${id}`, {
                title: form.title,
                description: form.description,
                price: parseFloat(form.price),
                categoryId: parseInt(form.categoryId),
                thumbnailUrl: finalThumbnailUrl
            });

            toast.success('Cập nhật khóa học thành công!');
            navigate('/instructor/courses');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Có lỗi khi lưu.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50/30 py-10 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <button
                        onClick={() => navigate('/instructor/courses')}
                        className="p-2 rounded-xl hover:bg-white hover:shadow-sm transition"
                    >
                        <ChevronLeft size={20} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                            <Pencil className="text-violet-500" size={22} />
                            Chỉnh sửa khóa học
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">Chỉ khóa học ở trạng thái Nháp mới được chỉnh sửa.</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 space-y-6">

                    {/* Title */}
                    <div>
                        <label className="text-sm font-bold text-slate-700 mb-1.5 block">
                            Tiêu đề khoá học <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text" name="title" value={form.title} onChange={handleChange}
                            maxLength={100}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition"
                            placeholder="Nhập tiêu đề khóa học..."
                        />
                        <div className="flex justify-between">
                            <FieldError msg={errors.title} />
                            <span className="text-xs text-slate-400 mt-1">{form.title.length}/100</span>
                        </div>
                    </div>

                    {/* Category + Price */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-bold text-slate-700 mb-1.5 block">
                                Danh mục <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="categoryId" value={form.categoryId} onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 bg-white outline-none"
                            >
                                <option value="">-- Chọn danh mục --</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <FieldError msg={errors.categoryId} />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-700 mb-1.5 block">
                                Giá tiền (VNĐ) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number" name="price" value={form.price} onChange={handleChange}
                                min={0} step={1000}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 outline-none"
                                placeholder="0"
                            />
                            <FieldError msg={errors.price} />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-sm font-bold text-slate-700 mb-1.5 block">Mô tả khóa học</label>
                        <textarea
                            name="description" value={form.description} onChange={handleChange}
                            rows={4} maxLength={1000}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 resize-none outline-none transition"
                            placeholder="Mô tả nội dung, đối tượng phù hợp, lợi ích của khóa học..."
                        />
                        <span className="text-xs text-slate-400">{form.description.length}/1000</span>
                    </div>

                    {/* Thumbnail */}
                    <div>
                        <label className="text-sm font-bold text-slate-700 mb-1.5 block">
                            Ảnh bìa (Thumbnail) <span className="text-red-500">*</span>
                        </label>
                        {form.thumbnailUrl && !thumbnailFile && (
                            <div className="mb-3 rounded-xl overflow-hidden border border-slate-200 h-40">
                                <img src={form.thumbnailUrl} alt="Thumbnail hiện tại" className="w-full h-full object-cover" />
                            </div>
                        )}
                        {thumbnailFile && (
                            <div className="mb-3 rounded-xl overflow-hidden border border-violet-200 h-40">
                                <img
                                    src={URL.createObjectURL(thumbnailFile)}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <input
                            type="file" accept="image/*"
                            onChange={e => setThumbnailFile(e.target.files[0] || null)}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 transition"
                        />
                        <p className="text-xs text-slate-400 mt-1">Để trống nếu không muốn thay đổi ảnh bìa.</p>
                        <FieldError msg={errors.thumbnailUrl} />
                    </div>

                    {/* Submit */}
                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/instructor/courses')}
                            className="px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit" disabled={saving}
                            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 disabled:opacity-50 transition shadow-lg shadow-violet-500/30"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
                            Lưu thay đổi
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

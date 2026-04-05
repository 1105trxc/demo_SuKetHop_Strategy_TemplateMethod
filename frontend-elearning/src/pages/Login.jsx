import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { login as loginApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Loader2, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    const navigate = useNavigate();
    const { login } = useAuth();

    const onSubmit = async (data) => {
        try {
            const authData = await loginApi(data);
            console.log("LOGIN RESPONSE:", authData); // debug

            login(authData); // Truyền authData vào context
            toast.success('Đăng nhập thành công!');
            
            if (authData.roles && authData.roles.includes('ROLE_ADMIN')) {
                navigate('/admin');
            } else if (authData.roles && authData.roles.includes('ROLE_INSTRUCTOR')) {
                navigate('/instructor');
            } else {
                navigate('/');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-gray-900 via-indigo-950 to-blue-900 text-white relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 mb-4 shadow-lg">
                            <LogIn className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-white tracking-tight">
                            Welcome Back
                        </h2>
                        <p className="text-indigo-200 mt-2 text-sm">Sign in to continue your learning journey</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-indigo-100 ml-1">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-indigo-300" />
                                </div>
                                <input
                                    type="email"
                                    className={`w-full pl-10 pr-4 py-3 bg-black/20 border ${errors.email ? 'border-red-400' : 'border-white/10'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-indigo-300/50 transition-all`}
                                    placeholder="you@example.com"
                                    {...register('email', { 
                                        required: 'Email is required',
                                        pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' }
                                    })}
                                />
                            </div>
                            {errors.email && <p className="text-red-400 text-xs ml-1">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center justify-between ml-1 mr-1">
                                <label className="text-sm font-medium text-indigo-100">Password</label>
                                <Link to="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Quên mật khẩu?</Link>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-indigo-300" />
                                </div>
                                <input
                                    type="password"
                                    className={`w-full pl-10 pr-4 py-3 bg-black/20 border ${errors.password ? 'border-red-400' : 'border-white/10'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-indigo-300/50 transition-all`}
                                    placeholder="••••••••"
                                    {...register('password', { required: 'Password is required' })}
                                />
                            </div>
                            {errors.password && <p className="text-red-400 text-xs ml-1">{errors.password.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.4)] text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
                        >
                            {isSubmitting ? (
                                <Loader2 className="animate-spin h-5 w-5 text-white" />
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/10 text-center">
                        <p className="text-sm text-indigo-200">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                                Create one now
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
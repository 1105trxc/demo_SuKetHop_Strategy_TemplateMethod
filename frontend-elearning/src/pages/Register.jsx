import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { register, verifyRegisterOtp } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, KeyRound, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
    const { register: formRegister, handleSubmit, formState: { errors, isSubmitting }, getValues } = useForm();
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    
    const navigate = useNavigate();
    const { login } = useAuth();

    const onSubmit = async (data) => {
        try {
            const res = await register(data);
            toast.success(res.message || 'Verification email sent!');
            setShowOtpModal(true);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed. Try again.');
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otpCode) {
            toast.error('Please enter the OTP code');
            return;
        }

        setIsVerifying(true);
        try {
            const email = getValues('email');
            const res = await verifyRegisterOtp({ email, otp: otpCode });
            toast.success('Registration successful!');
            login(res);
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid OTP. Try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                            Create Account
                        </h2>
                        <p className="text-gray-300 mt-2 text-sm">Join our platform and start learning</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-300 ml-1">Full Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className={`w-full pl-10 pr-4 py-3 bg-white/5 border ${errors.fullName ? 'border-red-500' : 'border-white/10'} rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400 transition-all`}
                                    placeholder="John Doe"
                                    {...formRegister('fullName', { required: 'Full name is required' })}
                                />
                            </div>
                            {errors.fullName && <p className="text-red-400 text-xs ml-1">{errors.fullName.message}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-300 ml-1">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    className={`w-full pl-10 pr-4 py-3 bg-white/5 border ${errors.email ? 'border-red-500' : 'border-white/10'} rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400 transition-all`}
                                    placeholder="you@example.com"
                                    {...formRegister('email', { 
                                        required: 'Email is required',
                                        pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' }
                                    })}
                                />
                            </div>
                            {errors.email && <p className="text-red-400 text-xs ml-1">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    className={`w-full pl-10 pr-4 py-3 bg-white/5 border ${errors.password ? 'border-red-500' : 'border-white/10'} rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400 transition-all`}
                                    placeholder="••••••••"
                                    {...formRegister('password', { 
                                        required: 'Password is required',
                                        minLength: { value: 6, message: 'Minimum 6 characters' }
                                    })}
                                />
                            </div>
                            {errors.password && <p className="text-red-400 text-xs ml-1">{errors.password.message}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-300 ml-1">Confirm Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    className={`w-full pl-10 pr-4 py-3 bg-white/5 border ${errors.confirmPassword ? 'border-red-500' : 'border-white/10'} rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400 transition-all`}
                                    placeholder="••••••••"
                                    {...formRegister('confirmPassword', { 
                                        required: 'Please confirm password',
                                        validate: value => value === getValues('password') || 'Passwords do not match'
                                    })}
                                />
                            </div>
                            {errors.confirmPassword && <p className="text-red-400 text-xs ml-1">{errors.confirmPassword.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
                        >
                            {isSubmitting ? (
                                <Loader2 className="animate-spin h-5 w-5 text-white" />
                            ) : (
                                <>
                                    Create Account <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-400">
                            Already have an account?{' '}
                            <Link to="/login" className="font-semibold text-purple-400 hover:text-purple-300 transition-colors">
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* OTP Modal */}
            {showOtpModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl transform transition-all scale-100 opacity-100">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <KeyRound className="h-8 w-8 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Verify Your Email</h3>
                            <p className="text-sm text-gray-400 mt-2">
                                We've sent a 6-digit code to <br />
                                <span className="font-semibold text-purple-300">{getValues('email')}</span>
                            </p>
                        </div>

                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div>
                                <input
                                    type="text"
                                    maxLength="6"
                                    className="w-full text-center tracking-widest text-2xl font-mono py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white transition-all"
                                    placeholder="000000"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                    autoFocus
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isVerifying || otpCode.length !== 6}
                                className="w-full flex justify-center items-center py-3 border border-transparent rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {isVerifying ? <Loader2 className="animate-spin h-5 w-5" /> : 'Verify & Login'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
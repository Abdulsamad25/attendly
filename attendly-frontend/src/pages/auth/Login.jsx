import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import FormField from '../../components/ui/FormField';
import Spinner from '../../components/ui/Spinner';
import { loginSchema } from '../../lib/schemas';
import { loginApi } from '../../api/auth';
import { useAuth } from '../../lib/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError]   = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const res = await loginApi(data);
      const { user, accessToken, refreshToken } = res.data;
      login(user, accessToken, refreshToken);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Something went wrong. Try again.');
    }
  };

  return (
    <AuthLayout>
      <div>
        <h2 className="mb-1 font-bold text-gray-900 text-2xl">Welcome back</h2>
        <p className="mb-8 text-gray-500 text-sm">Access your HR dashboard and intelligence suite.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <FormField label="Email Address" error={errors.email?.message} required>
            <div className="relative">
              <Mail className="top-1/2 left-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2" />
              <input
                {...register('email')}
                type="email"
                placeholder="name@company.com"
                className="pl-10 input-base"
              />
            </div>
          </FormField>

          <FormField label="Password" error={errors.password?.message} required>
            <div className="relative">
              <Lock className="top-1/2 left-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2" />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pr-10 pl-10 input-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="top-1/2 right-3 absolute text-gray-400 hover:text-gray-600 -translate-y-1/2"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex justify-end mt-1">
              <Link to="/forgot-password" className="font-medium text-primary text-xs hover:underline">
                Forgot password?
              </Link>
            </div>
          </FormField>

          {serverError && (
            <div className="bg-red-50 px-4 py-3 border border-red-200 rounded-lg text-red-600 text-sm">
              {serverError}
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="mt-1 btn-primary">
            {isSubmitting ? <Spinner size="sm" /> : (
              <>Sign In to Dashboard <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
/* eslint-disable no-unused-vars */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, ShieldCheck, ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import FormField from '../../components/ui/FormField';
import Spinner from '../../components/ui/Spinner';
import { setPasswordSchema } from '../../lib/schemas';
import { setPasswordApi, resetPasswordApi } from '../../api/auth';

const PasswordRule = ({ passed, label }) => (
  <div className="flex items-center gap-2">
    {passed
      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
      : <Circle className="w-3.5 h-3.5 text-gray-300" />
    }
    <span className={`text-xs ${passed ? 'text-emerald-600' : 'text-gray-400'}`}>{label}</span>
  </div>
);

const SetPassword = () => {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const token           = searchParams.get('token');
  const isReset         = searchParams.get('mode') === 'reset';

  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [serverError, setServerError]     = useState('');
  const [watchedPassword, setWatchedPassword] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(setPasswordSchema) });

  const password = watch('password', '');

  const onSubmit = async (data) => {
    setServerError('');
    if (!token) {
      setServerError('Invalid or missing token. Please use the link from your email.');
      return;
    }
    try {
      const apiFn = isReset ? resetPasswordApi : setPasswordApi;
      await apiFn({ token, password: data.password });
      navigate('/login?activated=true', { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Something went wrong. Try again.');
    }
  };

  return (
    <AuthLayout>
      <div>
        <div className="flex items-center gap-2 mb-6">
          <div className="flex justify-center items-center bg-primary-light rounded-lg w-8 h-8">
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-primary text-xs uppercase tracking-widest">
            {isReset ? 'Password Reset' : 'Account Setup'}
          </span>
        </div>

        <h2 className="mb-1 font-bold text-gray-900 text-2xl">
          {isReset ? 'Set a new password' : 'Secure your Workforce ID'}
        </h2>
        <p className="mb-8 text-gray-500 text-sm">
          {isReset
            ? 'Choose a strong password to regain access to your account.'
            : 'Create a secure password to activate your account.'}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <FormField label="New Password" error={errors.password?.message} required>
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
          </FormField>

          <FormField label="Confirm Password" error={errors.confirmPassword?.message} required>
            <div className="relative">
              <Lock className="top-1/2 left-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2" />
              <input
                {...register('confirmPassword')}
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                className="pr-10 pl-10 input-base"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className="top-1/2 right-3 absolute text-gray-400 hover:text-gray-600 -translate-y-1/2"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </FormField>

          {/* Password strength rules */}
          <div className="flex flex-col gap-2 bg-gray-50 px-4 py-3 rounded-xl">
            <p className="mb-1 font-semibold text-gray-500 text-xs uppercase tracking-wide">
              Security Standards
            </p>
            <PasswordRule passed={password.length >= 8}   label="At least 8 characters" />
            <PasswordRule passed={/[0-9]/.test(password)} label="Contains a number" />
            <PasswordRule passed={/[^a-zA-Z0-9]/.test(password)} label="Contains a special character" />
          </div>

          {serverError && (
            <div className="bg-red-50 px-4 py-3 border border-red-200 rounded-lg text-red-600 text-sm">
              {serverError}
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="mt-1 btn-primary">
            {isSubmitting ? <Spinner size="sm" /> : (
              <>Activate Account <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-xs">
            Need help?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Contact your HR administrator
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default SetPassword;
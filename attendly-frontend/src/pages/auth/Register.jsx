import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, User, Building2, Lock, ArrowRight } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import FormField from '../../components/ui/FormField';
import Spinner from '../../components/ui/Spinner';
import { registerSchema } from '../../lib/schemas';
import { registerApi } from '../../api/auth';

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError]   = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      await registerApi(data);
      navigate('/awaiting-activation', { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed. Try again.');
    }
  };

  return (
    <AuthLayout>
      <div>
        <h2 className="mb-1 font-bold text-gray-900 text-2xl">Create your account</h2>
        <p className="mb-8 text-gray-500 text-sm">Start your journey with Attendly today.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <FormField label="Full Name" error={errors.name?.message} required>
            <div className="relative">
              <User className="top-1/2 left-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2" />
              <input
                {...register('name')}
                type="text"
                placeholder="John Doe"
                className="pl-10 input-base"
              />
            </div>
          </FormField>

          <FormField label="Work Email" error={errors.email?.message} required>
            <div className="relative">
              <Mail className="top-1/2 left-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2" />
              <input
                {...register('email')}
                type="email"
                placeholder="john@company.com"
                className="pl-10 input-base"
              />
            </div>
          </FormField>

          <FormField label="Company Name" error={errors.companyName?.message} required>
            <div className="relative">
              <Building2 className="top-1/2 left-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2" />
              <input
                {...register('companyName')}
                type="text"
                placeholder="Acme Corp"
                className="pl-10 input-base"
              />
            </div>
          </FormField>

          <FormField label="Department" error={errors.department?.message} required>
            <div className="relative">
              <Building2 className="top-1/2 left-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2" />
              <select {...register('department')} className="pl-10 appearance-none input-base">
                <option value="">Select department</option>
                <option value="Integration">Integration</option>
                <option value="Support">Support</option>
              </select>
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
          </FormField>

          {serverError && (
            <div className="bg-red-50 px-4 py-3 border border-red-200 rounded-lg text-red-600 text-sm">
              {serverError}
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="mt-1 btn-primary">
            {isSubmitting ? <Spinner size="sm" /> : (
              <>Get Started <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Register;
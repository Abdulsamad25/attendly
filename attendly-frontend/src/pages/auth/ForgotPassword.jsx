import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, MailCheck } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import FormField from '../../components/ui/FormField';
import Spinner from '../../components/ui/Spinner';
import { forgotPasswordSchema } from '../../lib/schemas';
import { forgotPasswordApi } from '../../api/auth';

const ForgotPassword = () => {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail]         = useState('');
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      await forgotPasswordApi(data);
      setEmail(data.email);
      setSubmitted(true);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Something went wrong. Try again.');
    }
  };

  return (
    <AuthLayout>
      {!submitted ? (
        <div>
          {/* Label */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex justify-center items-center border-2 border-primary rounded-full w-5 h-5">
              <div className="bg-primary rounded-full w-2 h-2" />
            </div>
            <span className="font-semibold text-primary text-xs uppercase tracking-widest">
              Account Recovery
            </span>
          </div>

          <h2 className="mb-1 font-bold text-gray-900 text-2xl">Reset your password</h2>
          <p className="mb-8 text-gray-500 text-sm">
            Enter the email address associated with your account and we'll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <FormField label="Work Email" error={errors.email?.message} required>
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

            {serverError && (
              <div className="bg-red-50 px-4 py-3 border border-red-200 rounded-lg text-red-600 text-sm">
                {serverError}
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? <Spinner size="sm" /> : (
                <>Send Reset Link <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-gray-500 hover:text-primary text-sm transition-colors">
              ← Back to login
            </Link>
          </div>
        </div>
      ) : (
        /* Success state */
        <div className="text-center">
          <div className="flex justify-center items-center bg-emerald-100 mx-auto mb-6 rounded-2xl w-16 h-16">
            <MailCheck className="w-8 h-8 text-emerald-600" />
          </div>

          <h2 className="mb-2 font-bold text-gray-900 text-2xl">Check your email</h2>
          <p className="mb-2 text-gray-500 text-sm">
            We've sent reset instructions to
          </p>
          <p className="mb-8 font-semibold text-gray-800 text-sm">{email}</p>

          <div className="mb-6 p-6 border border-gray-200 border-dashed rounded-xl text-left">
            <p className="mb-4 text-gray-500 text-xs">
              Didn't receive the email? Check your spam folder or resend below.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="font-semibold text-primary text-sm hover:underline"
            >
              Resend email
            </button>
          </div>

          <Link to="/login" className="text-gray-500 hover:text-primary text-sm transition-colors">
            ← Back to login
          </Link>
        </div>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
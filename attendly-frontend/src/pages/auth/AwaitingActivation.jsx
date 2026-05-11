import { Link } from 'react-router-dom';
import { ShieldCheck, Info } from 'lucide-react';

const AwaitingActivation = () => (
  <div className="flex flex-col justify-center items-center bg-surface p-6 min-h-screen">
    {/* Logo */}
    <div className="flex items-center gap-2 mb-10">
      <div className="flex justify-center items-center bg-primary rounded-xl w-10 h-10">
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <span className="font-bold text-primary-dark text-xl">Attendly</span>
    </div>

    <div className="p-8 w-full max-w-md text-center card">
      {/* Icon */}
      <div className="flex justify-center items-center bg-primary-light mx-auto mb-6 rounded-2xl w-16 h-16">
        <ShieldCheck className="w-8 h-8 text-primary" />
      </div>

      <h2 className="mb-2 font-bold text-gray-900 text-xl">Activation Pending</h2>
      <p className="mb-6 text-gray-500 text-sm leading-relaxed">
        Your account is pending activation. An admin will review your registration shortly.
      </p>

      {/* What's next card */}
      <div className="flex gap-3 bg-primary-light mb-8 px-4 py-4 rounded-xl text-left">
        <Info className="mt-0.5 w-4 h-4 text-primary shrink-0" />
        <div>
          <p className="mb-1 font-semibold text-primary text-xs uppercase tracking-wide">What's next?</p>
          <p className="text-gray-600 text-sm">
            You'll receive an email notification once your HR administrator has granted you access to the dashboard.
          </p>
        </div>
      </div>

      <Link
        to="/login"
        className="inline-flex items-center gap-1.5 font-semibold text-primary text-sm hover:underline"
      >
        ← Back to Login
      </Link>
    </div>

    <p className="mt-8 text-gray-400 text-xs">
      Need help?{' '}
      <a href="mailto:hr@attendly.com" className="text-primary hover:underline">
        Contact HR Support
      </a>
    </p>
  </div>
);

export default AwaitingActivation;
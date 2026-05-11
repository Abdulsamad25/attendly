const FormField = ({ label, error, children, required }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="font-semibold text-gray-500 text-xs uppercase tracking-wide">
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
    )}
    {children}
    {error && <p className="text-red-500 text-xs">{error}</p>}
  </div>
);

export default FormField;
export default function GradientBadge({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-4 py-1.5 rounded-full text-sm font-semibold text-brand-indigo ${className}`}>
      {children}
    </span>
  )
}

export default function GlassCard({ children, className = '', title, subtitle, action }) {
  return (
    <div className={`glass-card rounded-2xl p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && <h2 className="text-base font-bold text-slate-800 sm:text-lg">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

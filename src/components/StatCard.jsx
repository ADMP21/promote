export default function StatCard({ icon: Icon, label, value, variant = 'primary' }) {
  const iconStyles = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    green: 'bg-emerald-50 text-emerald-600',
  }

  return (
    <div className={`stat-card stat-card--${variant}`}>
      <div className="flex items-center gap-4">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconStyles[variant]}`}
        >
          <Icon className="h-7 w-7" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">{value}</p>
        </div>
      </div>
    </div>
  )
}

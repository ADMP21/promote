export default function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="toggle-row group flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/60 bg-white/50 p-4 transition-all hover:border-primary/20 hover:bg-white/80 hover:shadow-md hover:shadow-primary/5">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`toggle-switch relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ${
          checked ? 'bg-primary' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Images, CheckCircle, Calendar, Upload, Settings, Tv, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { th as thLocale } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import StatCard from '../components/StatCard'
import GlassCard from '../components/GlassCard'
import PageHeader from '../components/PageHeader'
import { th } from '../i18n/th'

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, active: 0, lastUpload: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const { data, error } = await supabase
        .from('images')
        .select('id, active, created_at')
        .order('created_at', { ascending: false })

      if (error) throw error

      setStats({
        total: data?.length ?? 0,
        active: data?.filter((img) => img.active).length ?? 0,
        lastUpload: data?.[0]?.created_at ?? null,
      })
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const lastUploadLabel = loading
    ? '—'
    : stats.lastUpload
      ? format(new Date(stats.lastUpload), 'd MMM yyyy', { locale: thLocale })
      : th.dashboard.noUpload

  return (
    <div className="space-y-8">
      <PageHeader title={th.dashboard.title} subtitle={th.dashboard.subtitle} />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Images}
          label={th.dashboard.totalImages}
          value={loading ? '—' : stats.total}
          variant="primary"
        />
        <StatCard
          icon={CheckCircle}
          label={th.dashboard.activeImages}
          value={loading ? '—' : stats.active}
          variant="green"
        />
        <StatCard
          icon={Calendar}
          label={th.dashboard.lastUpload}
          value={lastUploadLabel}
          variant="secondary"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard title={th.dashboard.quickActions} subtitle={th.dashboard.quickActionsDesc}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link to="/images" className="action-card group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 transition-transform group-hover:scale-110">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800">{th.dashboard.uploadImages}</p>
                <p className="text-xs text-slate-500">{th.dashboard.uploadImagesDesc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
            <Link to="/settings" className="action-card group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 transition-transform group-hover:scale-110">
                <Settings className="h-6 w-6 text-secondary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800">{th.dashboard.displaySettings}</p>
                <p className="text-xs text-slate-500">{th.dashboard.displaySettingsDesc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-secondary" />
            </Link>
          </div>
        </GlassCard>

        <GlassCard title={th.dashboard.tvDisplay} subtitle={th.dashboard.tvDisplayDesc}>
          <p className="mb-5 text-sm leading-relaxed text-slate-600">{th.dashboard.tvDisplayHint}</p>
          <a href="/display" target="_blank" rel="noopener noreferrer" className="btn-primary">
            <Tv className="h-4 w-4" />
            {th.dashboard.openDisplay}
          </a>
        </GlassCard>
      </div>
    </div>
  )
}

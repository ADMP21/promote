import { useEffect, useState } from 'react'
import { Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import GlassCard from '../components/GlassCard'
import PageHeader from '../components/PageHeader'
import Toggle from '../components/Toggle'
import { th } from '../i18n/th'

const TRANSITIONS = [
  { value: 'fade', label: th.settings.transitions.fade },
  { value: 'slide-left', label: th.settings.transitions['slide-left'] },
  { value: 'slide-right', label: th.settings.transitions['slide-right'] },
  { value: 'zoom', label: th.settings.transitions.zoom },
]

const DEFAULT_SETTINGS = {
  slide_interval: 10,
  transition_effect: 'fade',
  auto_refresh: true,
  fullscreen_mode: true,
  show_header_overlay: true,
  show_footer_ticker: true,
  ticker_text: th.settings.tickerPlaceholder,
  rooms: [
    { name: 'ห้องประชุมชั้นล่าง', status: 'free', topic: '', time_start: '', time_end: '' },
    { name: 'ห้องประชุมใหญ่', status: 'free', topic: '', time_start: '', time_end: '' },
    { name: 'ห้องประชุมเขียว', status: 'free', topic: '', time_start: '', time_end: '' },
    { name: 'ห้องปฐมนิเทศ', status: 'free', topic: '', time_start: '', time_end: '' },
  ],
}

export default function Settings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const { data, error } = await supabase.from('display_settings').select('*').single()
      if (error && error.code !== 'PGRST116') throw error
      if (data) {
        setSettings({
          slide_interval: data.slide_interval,
          transition_effect: data.transition_effect,
          auto_refresh: data.auto_refresh,
          fullscreen_mode: data.fullscreen_mode,
          show_header_overlay: data.show_header_overlay,
          show_footer_ticker: data.show_footer_ticker,
          ticker_text: data.ticker_text,
          rooms: data.rooms || [],
        })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const { data: existing } = await supabase.from('display_settings').select('id').single()

      if (existing) {
        const { error } = await supabase
          .from('display_settings')
          .update({ ...settings, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('display_settings').insert(settings)
        if (error) throw error
      }

      setMessage({ type: 'success', text: th.settings.saved })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const update = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }))

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-slate-500">{th.common.loading}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader title={th.settings.title} subtitle={th.settings.subtitle} />

      {message.text && (
        <div
          className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-red-50 text-red-600'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <GlassCard title={th.settings.slideshow} subtitle={th.settings.slideshowDesc}>
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <div className="mb-3 flex items-baseline justify-between">
                <label className="text-sm font-semibold text-slate-700">{th.settings.interval}</label>
                <span className="rounded-full bg-primary/10 px-3 py-0.5 text-sm font-bold text-primary">
                  {settings.slide_interval} {th.settings.seconds}
                </span>
              </div>
              <input
                type="range"
                min={3}
                max={60}
                value={settings.slide_interval}
                onChange={(e) => update('slide_interval', Number(e.target.value))}
                className="w-full"
              />
              <div className="mt-2 flex justify-between text-xs text-slate-400">
                <span>3 {th.settings.seconds}</span>
                <span>60 {th.settings.seconds}</span>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                {th.settings.transition}
              </label>
              <select
                value={settings.transition_effect}
                onChange={(e) => update('transition_effect', e.target.value)}
                className="input-field"
              >
                {TRANSITIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </GlassCard>

        <GlassCard title={th.settings.displayOptions} subtitle={th.settings.displayOptionsDesc}>
          <div className="space-y-3">
            <Toggle
              checked={settings.auto_refresh}
              onChange={(v) => update('auto_refresh', v)}
              label={th.settings.autoRefresh}
              description={th.settings.autoRefreshDesc}
            />
            <Toggle
              checked={settings.fullscreen_mode}
              onChange={(v) => update('fullscreen_mode', v)}
              label={th.settings.fullscreen}
              description={th.settings.fullscreenDesc}
            />
            <Toggle
              checked={settings.show_header_overlay}
              onChange={(v) => update('show_header_overlay', v)}
              label={th.settings.headerOverlay}
              description={th.settings.headerOverlayDesc}
            />
            <Toggle
              checked={settings.show_footer_ticker}
              onChange={(v) => update('show_footer_ticker', v)}
              label={th.settings.footerTicker}
              description={th.settings.footerTickerDesc}
            />
          </div>
        </GlassCard>

        <GlassCard title={th.settings.ticker} subtitle={th.settings.tickerDesc}>
          <textarea
            value={settings.ticker_text}
            onChange={(e) => update('ticker_text', e.target.value)}
            rows={3}
            className="input-field resize-none"
            placeholder={th.settings.tickerPlaceholder}
          />
        </GlassCard>

        <button type="submit" disabled={saving} className="btn-primary px-8 py-3">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {th.settings.saving}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {th.settings.save}
            </>
          )}
        </button>
      </form>

      <div className="space-y-6">
        <PageHeader title="สถานะห้องประชุม" subtitle="กำหนดสถานะและรายละเอียดการประชุมแต่ละห้อง" />

        <div className="grid gap-4 sm:grid-cols-2">
          {settings.rooms.map((room, index) => (
            <div key={index} className="rounded-2xl border border-white/80 bg-white/60 px-5 py-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">{room.name}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...settings.rooms]
                      updated[index] = { ...updated[index], status: 'free' }
                      update('rooms', updated)
                    }}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                      room.status === 'free'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'
                    }`}
                  >
                    ว่าง
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...settings.rooms]
                      updated[index] = { ...updated[index], status: 'busy' }
                      update('rooms', updated)
                    }}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                      room.status === 'busy'
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500'
                    }`}
                  >
                    ใช้อยู่
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={room.topic || ''}
                onChange={(e) => {
                  const updated = [...settings.rooms]
                  updated[index] = { ...updated[index], topic: e.target.value }
                  update('rooms', updated)
                }}
                placeholder="หัวข้อการประชุม"
                className="input-field py-1.5 text-xs"
              />
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-slate-500">เวลาเริ่ม</label>
                  <input
                    type="time"
                    value={room.time_start || ''}
                    onChange={(e) => {
                      const updated = [...settings.rooms]
                      updated[index] = { ...updated[index], time_start: e.target.value }
                      update('rooms', updated)
                    }}
                    className="input-field py-1.5 text-xs"
                  />
                </div>
                <span className="mt-5 text-slate-400">–</span>
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-slate-500">เวลาสิ้นสุด</label>
                  <input
                    type="time"
                    value={room.time_end || ''}
                    onChange={(e) => {
                      const updated = [...settings.rooms]
                      updated[index] = { ...updated[index], time_end: e.target.value }
                      update('rooms', updated)
                    }}
                    className="input-field py-1.5 text-xs"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={async () => {
            setSaving(true)
            setMessage({ type: '', text: '' })
            try {
              const { data: existing } = await supabase.from('display_settings').select('id').single()
              if (existing) {
                const { error } = await supabase
                  .from('display_settings')
                  .update({ rooms: settings.rooms, updated_at: new Date().toISOString() })
                  .eq('id', existing.id)
                if (error) throw error
              }
              setMessage({ type: 'success', text: th.settings.saved })
            } catch (err) {
              setMessage({ type: 'error', text: err.message })
            } finally {
              setSaving(false)
            }
          }}
          disabled={saving}
          className="btn-primary px-8 py-3"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {th.settings.saving}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              บันทึกสถานะห้องประชุม
            </>
          )}
        </button>
      </div>
    </div>
  )
}

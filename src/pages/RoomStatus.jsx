import { useEffect, useState } from 'react'
import { Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import { th } from '../i18n/th'

export default function RoomStatus() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchRooms()
  }, [])

  async function fetchRooms() {
    try {
      const { data, error } = await supabase.from('display_settings').select('rooms').single()
      if (error && error.code !== 'PGRST116') throw error
      if (data?.rooms) setRooms(data.rooms)
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const updateRoom = (index, field, value) => {
    const updated = [...rooms]
    updated[index] = { ...updated[index], [field]: value }
    setRooms(updated)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage({ type: '', text: '' })
    try {
      const { data: existing } = await supabase.from('display_settings').select('id').single()
      if (existing) {
        const { error } = await supabase
          .from('display_settings')
          .update({ rooms, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
        if (error) throw error
      }
      setMessage({ type: 'success', text: th.settings.saved })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

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
      <PageHeader title="สถานะห้องประชุม" subtitle="กำหนดสถานะและรายละเอียดการประชุมแต่ละห้อง" />

      {message.text && (
        <div
          className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {message.text}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {rooms.map((room, index) => (
          <div key={index} className="rounded-2xl border border-white/80 bg-white/60 px-5 py-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">{room.name}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateRoom(index, 'status', 'free')}
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
                  onClick={() => updateRoom(index, 'status', 'busy')}
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
              onChange={(e) => updateRoom(index, 'topic', e.target.value)}
              placeholder="หัวข้อการประชุม"
              className="input-field py-1.5 text-xs"
            />
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-slate-500">เวลาเริ่ม</label>
                <input
                  type="time"
                  value={room.time_start || ''}
                  onChange={(e) => updateRoom(index, 'time_start', e.target.value)}
                  className="input-field py-1.5 text-xs"
                />
              </div>
              <span className="mt-5 text-slate-400">–</span>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-slate-500">เวลาสิ้นสุด</label>
                <input
                  type="time"
                  value={room.time_end || ''}
                  onChange={(e) => updateRoom(index, 'time_end', e.target.value)}
                  className="input-field py-1.5 text-xs"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
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
  )
}

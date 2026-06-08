import { useCallback, useEffect, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { Search, Loader2, AlertCircle, X } from 'lucide-react'
import { supabase, STORAGE_BUCKET } from '../lib/supabase'
import GlassCard from '../components/GlassCard'
import UploadZone from '../components/UploadZone'
import ImageCard from '../components/ImageCard'
import PageHeader from '../components/PageHeader'
import { th } from '../i18n/th'

export default function Images() {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const fetchImages = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('images')
        .select('*')
        .order('display_order', { ascending: true })

      if (fetchError) throw fetchError
      setImages(data ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  const handleUpload = async (files) => {
    setUploading(true)
    setError('')
    try {
      const maxOrder = images.reduce((max, img) => Math.max(max, img.display_order), 0)

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const ext = file.name.split('.').pop()
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const title = file.name.replace(/\.[^/.]+$/, '')

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filename, file, { cacheControl: '3600', upsert: false })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename)

        const { error: insertError } = await supabase.from('images').insert({
          title,
          filename,
          image_url: urlData.publicUrl,
          active: true,
          display_order: maxOrder + i + 1,
        })

        if (insertError) throw insertError
      }

      await fetchImages()
    } catch (err) {
      setError(err.message || th.images.uploadFailed)
    } finally {
      setUploading(false)
    }
  }

  const handleToggle = async (image) => {
    const { error: updateError } = await supabase
      .from('images')
      .update({ active: !image.active })
      .eq('id', image.id)

    if (updateError) {
      setError(updateError.message)
      return
    }
    setImages((prev) =>
      prev.map((img) => (img.id === image.id ? { ...img, active: !img.active } : img))
    )
  }

  const handleDelete = async (image) => {
    if (!confirm(th.images.deleteConfirm(image.title))) return

    try {
      await supabase.storage.from(STORAGE_BUCKET).remove([image.filename])
      const { error: deleteError } = await supabase.from('images').delete().eq('id', image.id)
      if (deleteError) throw deleteError
      setImages((prev) => prev.filter((img) => img.id !== image.id))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = images.findIndex((img) => img.id === active.id)
    const newIndex = images.findIndex((img) => img.id === over.id)
    const reordered = arrayMove(images, oldIndex, newIndex)
    setImages(reordered)

    for (let i = 0; i < reordered.length; i++) {
      await supabase
        .from('images')
        .update({ display_order: i + 1 })
        .eq('id', reordered[i].id)
    }
  }

  const filtered = images.filter(
    (img) =>
      img.title.toLowerCase().includes(search.toLowerCase()) ||
      img.filename.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <PageHeader title={th.images.title} subtitle={th.images.subtitle} />

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="btn-icon text-red-400 hover:text-red-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <GlassCard title={th.images.upload} subtitle={th.images.uploadDesc}>
        <UploadZone onUpload={handleUpload} uploading={uploading} />
      </GlassCard>

      <GlassCard
        title={th.images.library}
        subtitle={th.images.total(images.length)}
        action={
          <div className="relative w-full sm:w-auto">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={th.images.search}
              className="input-field w-full pl-10 sm:w-56"
            />
          </div>
        }
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-slate-500">{th.common.loading}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <Search className="h-7 w-7 text-slate-300" />
            </div>
            <p className="text-sm text-slate-500">
              {search ? th.images.noMatch : th.images.empty}
            </p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filtered.map((img) => img.id)} strategy={rectSortingStrategy}>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((image) => (
                  <ImageCard
                    key={image.id}
                    image={image}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </GlassCard>
    </div>
  )
}

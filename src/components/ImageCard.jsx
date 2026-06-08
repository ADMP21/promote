import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, Eye, EyeOff } from 'lucide-react'
import { th } from '../i18n/th'

export default function ImageCard({ image, onToggle, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`image-card ${!image.active ? 'image-card--inactive' : ''}`}
    >
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        <img
          src={image.image_url}
          alt={image.title}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-2 left-2">
          <button
            {...attributes}
            {...listeners}
            className="glass-dark cursor-grab rounded-xl p-2 text-white active:cursor-grabbing"
            aria-label={th.images.dragReorder}
            title={th.images.dragReorder}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </div>
        {image.active && (
          <div className="absolute top-2 right-2">
            <span className="rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
              แสดงผล
            </span>
          </div>
        )}
        {!image.active && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px]">
            <span className="rounded-full bg-white/95 px-4 py-1.5 text-xs font-semibold text-slate-600 shadow">
              {th.images.disabled}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 p-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-800">{image.title}</p>
          <p className="truncate text-xs text-slate-400">{image.filename}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={() => onToggle(image)}
            className="btn-icon btn-icon-primary"
            title={image.active ? th.images.disable : th.images.enable}
          >
            {image.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          <button
            onClick={() => onDelete(image)}
            className="btn-icon btn-icon-danger"
            title={th.images.delete}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

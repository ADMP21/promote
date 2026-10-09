import { useCallback, useState } from 'react'
import { Upload, Loader2, ImagePlus } from 'lucide-react'
import { ALLOWED_IMAGE_TYPES } from '../lib/supabase'
import { IMAGE_UPLOAD_LIMITS } from '../lib/optimizeImage'
import { th } from '../i18n/th'

export default function UploadZone({ onUpload, uploading, remainingSlots }) {
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = useCallback(
    (files) => {
      const valid = Array.from(files).filter(
        (file) => ALLOWED_IMAGE_TYPES.includes(file.type)
          && file.size <= IMAGE_UPLOAD_LIMITS.maxSourceBytes
      )
      if (valid.length > 0) onUpload(valid)
    },
    [onUpload]
  )

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={`upload-zone ${
        dragOver ? 'upload-zone--active' : 'upload-zone--idle'
      }`}
    >
      <input
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="absolute inset-0 cursor-pointer opacity-0"
        disabled={uploading || remainingSlots <= 0}
      />
      <div className="pointer-events-none">
        <div className="upload-icon-wrap">
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : dragOver ? (
            <ImagePlus className="h-8 w-8 text-secondary" />
          ) : (
            <Upload className="h-8 w-8 text-primary" />
          )}
        </div>
        <p className="text-base font-semibold text-slate-700">
          {uploading ? th.images.uploading : th.images.dropHere}
        </p>
        <p className="mt-2 text-sm text-slate-500">{th.images.dropHint}</p>
        <p className="mt-1 text-xs text-slate-400">
          {remainingSlots > 0
            ? `ย่อไม่เกิน 1080 × 1920 และแปลงเป็น WebP อัตโนมัติ · เหลือ ${remainingSlots} รูป`
            : 'ครบจำนวนสูงสุด 10 รูปแล้ว กรุณาลบรูปเก่าก่อน'}
        </p>
      </div>
    </div>
  )
}

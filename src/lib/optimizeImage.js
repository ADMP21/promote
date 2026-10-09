const MAX_WIDTH = 1080
const MAX_HEIGHT = 1920
const WEBP_QUALITY = 0.86

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`ไม่สามารถอ่านไฟล์ ${file.name} ได้`))
    }
    image.src = url
  })
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('เบราว์เซอร์ไม่รองรับการแปลงรูปเป็น WebP')),
      'image/webp',
      WEBP_QUALITY
    )
  })
}

export async function optimizeImage(file) {
  const image = await loadImage(file)
  const scale = Math.min(1, MAX_WIDTH / image.naturalWidth, MAX_HEIGHT / image.naturalHeight)
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d', { alpha: true })
  if (!context) throw new Error('เบราว์เซอร์ไม่รองรับการปรับขนาดรูป')
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, width, height)

  const blob = await canvasToBlob(canvas)
  const baseName = file.name.replace(/\.[^/.]+$/, '')

  return new File([blob], `${baseName}.webp`, {
    type: 'image/webp',
    lastModified: Date.now(),
  })
}

export const IMAGE_UPLOAD_LIMITS = {
  maxImages: 10,
  maxSourceBytes: 20 * 1024 * 1024,
}

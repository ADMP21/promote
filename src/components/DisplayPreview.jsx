import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { th as thLocale } from 'date-fns/locale'
import { preloadImage } from '../lib/preloadImage'

export default function DisplayPreview({ settings, images }) {
  const [index, setIndex] = useState(0)
  const [previousIndex, setPreviousIndex] = useState(null)
  const [animating, setAnimating] = useState(false)
  const image = images[index % images.length]
  const previousImage = previousIndex === null ? null : images[previousIndex % images.length]

  useEffect(() => {
    if (images.length < 2) return
    let cancelled = false
    let pending = false
    const timer = setInterval(async () => {
      if (pending) return
      pending = true
      const nextIndex = (index + 1) % images.length
      const ready = await preloadImage(images[nextIndex].image_url)
      if (!cancelled && ready) {
        setPreviousIndex(index)
        setIndex(nextIndex)
        setAnimating(true)
      }
      pending = false
    }, settings.slide_interval * 1000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [images, index, settings.slide_interval])

  useEffect(() => {
    if (!animating) return
    const timer = setTimeout(() => {
      setAnimating(false)
      setPreviousIndex(null)
    }, 1000)
    return () => clearTimeout(timer)
  }, [animating, index])

  return (
    <aside className="glass-card rounded-3xl p-5 xl:sticky xl:top-32">
      <div className="mb-4">
        <h2 className="font-bold text-slate-800">ตัวอย่างจอแนวตั้ง 9:16</h2>
        <p className="text-sm text-slate-500">แสดงผลตามค่าที่เลือก ก่อนกดบันทึก</p>
      </div>
      <div className="settings-preview" style={{ '--display-overlay-opacity': settings.overlay_opacity }}>
        <img className="settings-preview-brand-background" src="/display-brand-bg.png" alt="" />
        {image ? (
          <>
            {animating && previousImage && (
              <img
                key={previousImage.id}
                className="settings-preview-image"
                src={previousImage.image_url}
                alt=""
                aria-hidden="true"
              />
            )}
            <img
              key={image.id}
              className={`settings-preview-image ${animating ? `settings-preview-image--${settings.transition_effect}` : ''}`}
              src={image.image_url}
              alt={image.title || 'ภาพโปสเตอร์ตัวอย่าง'}
            />
          </>
        ) : (
          <div className="settings-preview-empty">ยังไม่มีโปสเตอร์ที่เปิดใช้งาน</div>
        )}
        <div className="settings-preview-header">
          <img src="/cm-logo.png" alt="CM" />
          {settings.show_header_overlay && (
            <div className="settings-preview-clock">
              <span>{format(new Date(), 'EEE d MMM yyyy', { locale: thLocale })}</span>
              <strong>{format(new Date(), 'HH:mm')}</strong>
            </div>
          )}
        </div>
        <div className={`settings-preview-rooms ${settings.show_footer_ticker && settings.ticker_text ? 'settings-preview-rooms--ticker' : ''}`}>
          <div><span>ห้องประชุม</span><strong>● ว่าง</strong></div>
          <div><span>สถานะจากเว็บจอง</span><strong>● ว่าง</strong></div>
        </div>
        {settings.show_footer_ticker && settings.ticker_text && (
          <div className="settings-preview-ticker">
            <span>{settings.ticker_text}</span>
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-slate-500">ชื่อและสถานะห้องในภาพนี้เป็นตัวอย่าง จอจริงดึงข้อมูลจากเว็บจอง</p>
    </aside>
  )
}

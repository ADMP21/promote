import { useCallback, useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { th as thLocale } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { th } from '../i18n/th'

const DEFAULT_SETTINGS = {
  slide_interval: 10,
  transition_effect: 'fade',
  auto_refresh: true,
  fullscreen_mode: true,
  show_header_overlay: true,
  show_footer_ticker: true,
  ticker_text: 'ยินดีต้อนรับสู่ระบบ AOT Digital Signage',
  rooms: [],
}

export default function Display() {
  const [images, setImages] = useState([])
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [prevIndex, setPrevIndex] = useState(null)
  const [animating, setAnimating] = useState(false)
  const [clock, setClock] = useState(new Date())
  const intervalRef = useRef(null)
  const animationRef = useRef(null)

  const fetchData = useCallback(async () => {
    const [imagesRes, settingsRes] = await Promise.all([
      supabase
        .from('images')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true }),
      supabase.from('display_settings').select('*').single(),
    ])

    if (imagesRes.data) {
      setImages(imagesRes.data)
      setCurrentIndex(0)
      setPrevIndex(null)
    }
    if (settingsRes.data) {
      setSettings({
        slide_interval: settingsRes.data.slide_interval,
        transition_effect: settingsRes.data.transition_effect,
        auto_refresh: settingsRes.data.auto_refresh,
        fullscreen_mode: settingsRes.data.fullscreen_mode,
        show_header_overlay: settingsRes.data.show_header_overlay,
        show_footer_ticker: settingsRes.data.show_footer_ticker,
        ticker_text: settingsRes.data.ticker_text,
        rooms: settingsRes.data.rooms || [],
      })
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const imagesChannel = supabase
      .channel('display-images')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'images' }, () => {
        fetchData()
      })
      .subscribe()

    const settingsChannel = supabase
      .channel('display-settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'display_settings' }, () => {
        fetchData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(imagesChannel)
      supabase.removeChannel(settingsChannel)
    }
  }, [fetchData])

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (settings.fullscreen_mode) {
      const el = document.documentElement
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {})
      }
    }
  }, [settings.fullscreen_mode])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const goToNext = useCallback(() => {
    if (images.length <= 1 || animating) return
    setAnimating(true)
    setPrevIndex(currentIndex)
    setCurrentIndex((prev) => (prev + 1) % images.length)
    clearTimeout(animationRef.current)
    animationRef.current = setTimeout(() => {
      setAnimating(false)
      setPrevIndex(null)
    }, 800)
  }, [images.length, currentIndex, animating])

  useEffect(() => {
    if (images.length <= 1) return
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(goToNext, settings.slide_interval * 1000)
    return () => clearInterval(intervalRef.current)
  }, [images.length, settings.slide_interval, goToNext])

  const transitionClass = settings.transition_effect

  const renderSlide = (image, type) => {
    if (!image) return null
    const isEnter = type === 'enter'
    const isExit = type === 'exit'
    let className = 'absolute inset-0 flex items-center justify-center'

    if (transitionClass === 'fade') {
      className += isEnter ? ' slide-fade-enter-active' : isExit ? ' slide-fade-exit-active' : ''
      if (isEnter && animating) className = 'absolute inset-0 flex items-center justify-center slide-fade-enter'
      if (isExit) className = 'absolute inset-0 flex items-center justify-center slide-fade-exit'
    } else if (transitionClass === 'slide-left') {
      className += isEnter ? ' slide-left-enter-active' : isExit ? ' slide-left-exit-active' : ''
      if (isEnter && animating) className = 'absolute inset-0 flex items-center justify-center slide-left-enter'
      if (isExit) className = 'absolute inset-0 flex items-center justify-center slide-left-exit'
    } else if (transitionClass === 'slide-right') {
      className += isEnter ? ' slide-right-enter-active' : isExit ? ' slide-right-exit-active' : ''
      if (isEnter && animating) className = 'absolute inset-0 flex items-center justify-center slide-right-enter'
      if (isExit) className = 'absolute inset-0 flex items-center justify-center slide-right-exit'
    } else if (transitionClass === 'zoom') {
      className += isEnter ? ' zoom-enter-active' : isExit ? ' zoom-exit-active' : ''
      if (isEnter && animating) className = 'absolute inset-0 flex items-center justify-center zoom-enter'
      if (isExit) className = 'absolute inset-0 flex items-center justify-center zoom-exit'
    }

    return (
      <div key={`${image.id}-${type}`} className={className}>
        <img
          src={image.image_url}
          alt={image.title}
          className="display-slide-img"
          draggable={false}
        />
      </div>
    )
  }

  const currentImage = images[currentIndex]
  const previousImage = prevIndex !== null ? images[prevIndex] : null
  const hasTicker = settings.show_footer_ticker && settings.ticker_text

  return (
    <div
      className={`display-mode display-theme-red ${hasTicker ? 'display-has-ticker' : ''} ${
        settings.show_header_overlay ? 'display-has-header' : 'display-has-logo-only'
      }`}
    >
      {/* Logo — always top-left */}
      <div className="display-logo">
        <img src="/cm-logo.png" alt="CM Logo" className="display-logo-img" draggable={false} />
      </div>

      {/* Slideshow area */}
      <div className="display-stage">
        {images.length === 0 ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-6">
            <div className="display-empty-badge">{th.display.noContent}</div>
          </div>
        ) : (
          <div className="relative h-full w-full">
            {!animating && renderSlide(currentImage, 'static')}
            {animating && (
              <>
                {renderSlide(previousImage, 'exit')}
                {renderSlide(currentImage, 'enter')}
              </>
            )}
          </div>
        )}
      </div>

      {/* Date & time — top right */}
      {settings.show_header_overlay && (
        <div className="display-clock">
          <p className="display-clock-date">
            {format(clock, 'EEEE d MMMM yyyy', { locale: thLocale })}
          </p>
          <p className="display-clock-time">{format(clock, 'HH:mm:ss')}</p>
        </div>
      )}

      {/* Room status */}
      {settings.rooms && settings.rooms.length > 0 && (
        <div className="display-rooms">
          {settings.rooms.map((room, index) => (
            <div key={index} className="display-room-card">
              <div className="display-room-top">
                <p className="display-room-name">{room.name}</p>
                <div className="display-room-status">
                  <span className={`display-room-dot ${room.status === 'free' ? 'display-room-dot--free' : 'display-room-dot--busy'}`} />
                  <span className={`display-room-status-text ${room.status === 'free' ? 'display-room-status--free' : 'display-room-status--busy'}`}>
                    {room.status === 'free' ? 'ว่าง' : 'ใช้อยู่'}
                  </span>
                </div>
              </div>
              {room.topic && (
                <div className="display-room-detail-wrap">
                  <p className="display-room-topic">
                    <span className={room.topic.length > 20 ? 'display-room-marquee' : ''}>{room.topic}</span>
                  </p>
                </div>
              )}
              {room.time && (
                <p className="display-room-time">{room.time}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ticker */}
      {hasTicker && (
        <div className="display-ticker">
          <div className="display-ticker-track">
            <span>{settings.ticker_text}</span>
            <span className="display-ticker-dot">•</span>
            <span>{settings.ticker_text}</span>
          </div>
        </div>
      )}
    </div>
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { th as thLocale } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { supabaseBooking } from '../lib/supabaseBooking'
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

const normalizeName = (s) => (s || '').trim().normalize('NFC').replace(/\s+/g, '')

export default function Display() {
  const [images, setImages] = useState([])
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [prevIndex, setPrevIndex] = useState(null)
  const [animating, setAnimating] = useState(false)
  const [clock, setClock] = useState(new Date())
  const [bookings, setBookings] = useState([])
  const [rooms, setRooms] = useState([])
  const [roomStatusMap, setRoomStatusMap] = useState({})
  const intervalRef = useRef(null)
  const animationRef = useRef(null)

  const fetchRoomsFromBookingSystem = useCallback(async () => {
    const { data } = await supabaseBooking
      .from('rooms')
      .select('id, name, floor, location, color')
      .order('name')
    if (data) setRooms(data)
  }, [])

  const fetchBookingsFromBookingSystem = useCallback(async () => {
    const now = new Date()
    const bangkokDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now)

    const todayStartUTC = new Date(`${bangkokDate}T00:00:00+07:00`).toISOString()
    const todayEndUTC = new Date(`${bangkokDate}T23:59:59+07:00`).toISOString()

    const { data } = await supabaseBooking
      .from('bookings')
      .select('id, title, organizer, start_time, end_time, room_id')
      .gte('end_time', todayStartUTC)
      .lte('start_time', todayEndUTC)
      .order('start_time', { ascending: true })

    if (data) setBookings(data)
  }, [])

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

    await Promise.all([
      fetchBookingsFromBookingSystem(),
      fetchRoomsFromBookingSystem(),
    ])
  }, [fetchBookingsFromBookingSystem, fetchRoomsFromBookingSystem])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const imagesChannel = supabase
      .channel('display-images')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'images' }, () => fetchData())
      .subscribe()

    const settingsChannel = supabase
      .channel('display-settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'display_settings' }, () => fetchData())
      .subscribe()

    const bookingsChannel = supabaseBooking
      .channel('booking-system-bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchBookingsFromBookingSystem())
      .subscribe()

    const refreshInterval = setInterval(() => fetchBookingsFromBookingSystem(), 60_000)

    return () => {
      supabase.removeChannel(imagesChannel)
      supabase.removeChannel(settingsChannel)
      supabaseBooking.removeChannel(bookingsChannel)
      clearInterval(refreshInterval)
    }
  }, [fetchData, fetchBookingsFromBookingSystem])

  useEffect(() => {
    if (!settings.rooms?.length || !rooms.length) return

    const computeStatus = () => {
      const nowBangkok = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })
      )

      const map = {}
      settings.rooms.forEach((settingRoom) => {
        const room = rooms.find(
          (r) => normalizeName(r.name) === normalizeName(settingRoom.name)
        )
        if (!room) {
          map[settingRoom.name] = { isBusy: false, booking: null }
          return
        }

        const activeBooking = bookings.find((b) => {
          if (b.room_id !== room.id) return false
          const startBKK = new Date(new Date(b.start_time).toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
          const endBKK = new Date(new Date(b.end_time).toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
          return nowBangkok >= startBKK && nowBangkok <= endBKK
        })

        map[settingRoom.name] = {
          isBusy: !!activeBooking,
          booking: activeBooking
            ? {
                topic: activeBooking.title,
                booked_by: activeBooking.organizer,
                time_start: new Date(activeBooking.start_time).toLocaleTimeString('th-TH', {
                  timeZone: 'Asia/Bangkok',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                }),
                time_end: new Date(activeBooking.end_time).toLocaleTimeString('th-TH', {
                  timeZone: 'Asia/Bangkok',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                }),
              }
            : null,
        }
      })

      setRoomStatusMap(map)
    }

    computeStatus()
    const interval = setInterval(computeStatus, 60_000)
    return () => clearInterval(interval)
  }, [settings.rooms, rooms, bookings])

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (settings.fullscreen_mode) {
      const el = document.documentElement
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {})
    }
  }, [settings.fullscreen_mode])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
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
      if (isEnter && animating) className = 'absolute inset-0 flex items-center justify-center slide-fade-enter'
      else if (isEnter) className += ' slide-fade-enter-active'
      if (isExit) className = 'absolute inset-0 flex items-center justify-center slide-fade-exit'
    } else if (transitionClass === 'slide-left') {
      if (isEnter && animating) className = 'absolute inset-0 flex items-center justify-center slide-left-enter'
      else if (isEnter) className += ' slide-left-enter-active'
      if (isExit) className = 'absolute inset-0 flex items-center justify-center slide-left-exit'
    } else if (transitionClass === 'slide-right') {
      if (isEnter && animating) className = 'absolute inset-0 flex items-center justify-center slide-right-enter'
      else if (isEnter) className += ' slide-right-enter-active'
      if (isExit) className = 'absolute inset-0 flex items-center justify-center slide-right-exit'
    } else if (transitionClass === 'zoom') {
      if (isEnter && animating) className = 'absolute inset-0 flex items-center justify-center zoom-enter'
      else if (isEnter) className += ' zoom-enter-active'
      if (isExit) className = 'absolute inset-0 flex items-center justify-center zoom-exit'
    }

    return (
      <div key={`${image.id}-${type}`} className={className}>
        <img src={image.image_url} alt={image.title} className="display-slide-img" draggable={false} />
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
      {/* Neon CSS Animations */}
      <style>{`
        @keyframes neon-flicker-red {
          0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
            box-shadow:
              0 0 4px #ff3c3c,
              0 0 12px #ff3c3c,
              0 0 24px #ff3c3c,
              0 0 48px #ff0000;
          }
          20%, 24%, 55% {
            box-shadow: none;
          }
        }
        @keyframes neon-flicker-green {
          0%, 100% {
            box-shadow:
              0 0 4px #39ff14,
              0 0 12px #39ff14,
              0 0 24px #39ff14,
              0 0 48px #00cc00;
          }
          50% {
            box-shadow:
              0 0 2px #39ff14,
              0 0 6px #39ff14,
              0 0 12px #39ff14;
          }
        }
        @keyframes text-glow-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        .neon-card-busy {
          animation: neon-flicker-red 6s infinite;
        }
        .neon-card-free {
          animation: neon-flicker-green 4s infinite;
        }
        .neon-text-pulse {
          animation: text-glow-pulse 3s ease-in-out infinite;
        }
      `}</style>

      {/* Logo */}
      <div className="display-logo">
        <img src="/cm-logo.png" alt="CM Logo" className="display-logo-img" draggable={false} />
      </div>

      {/* Slideshow */}
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

      {/* Clock */}
      {settings.show_header_overlay && (
        <div className="display-clock">
          <p className="display-clock-date">{format(clock, 'EEEE d MMMM yyyy', { locale: thLocale })}</p>
          <p className="display-clock-time">{format(clock, 'HH:mm:ss')}</p>
        </div>
      )}

      {/* ── Room Status — Neon Glow ── */}
      {settings.rooms && settings.rooms.length > 0 && (
        <div className="display-rooms">
          {settings.rooms.map((room, index) => {
            const status = roomStatusMap[room.name] ?? { isBusy: false, booking: null }
            const { isBusy, booking } = status

            return (
              <div
                key={index}
                className={`display-room-card ${isBusy ? 'neon-card-busy' : 'neon-card-free'}`}
                style={{
                  background: '#000000',
                  border: `1.5px solid ${isBusy ? '#ff3c3c' : '#39ff14'}`,
                  borderRadius: '10px',
                  padding: '10px 12px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* ── Neon glow overlay พื้นหลัง ── */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '10px',
                  background: isBusy
                    ? 'radial-gradient(ellipse at top, rgba(255,60,60,0.08) 0%, transparent 70%)'
                    : 'radial-gradient(ellipse at top, rgba(57,255,20,0.06) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }} />

                {/* ── ชื่อห้อง ── */}
                <p
                  className="neon-text-pulse"
                  style={{
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.9em',
                    margin: '0 0 6px 0',
                    letterSpacing: '0.04em',
                    textShadow: '0 0 8px rgba(255,255,255,0.8), 0 0 20px rgba(255,255,255,0.4)',
                  }}
                >
                  {room.name}
                </p>

                {/* ── Badge สถานะ ── */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: `1px solid ${isBusy ? '#ff3c3c' : '#39ff14'}`,
                  borderRadius: '4px',
                  padding: '2px 8px',
                  marginBottom: isBusy ? '8px' : '0',
                  background: isBusy
                    ? 'rgba(255,60,60,0.12)'
                    : 'rgba(57,255,20,0.10)',
                }}>
                  {/* จุด Neon กระพริบ */}
                  <span style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: isBusy ? '#ff3c3c' : '#39ff14',
                    boxShadow: isBusy
                      ? '0 0 6px #ff3c3c, 0 0 12px #ff0000'
                      : '0 0 6px #39ff14, 0 0 12px #00cc00',
                    display: 'inline-block',
                    flexShrink: 0,
                  }} />
                  <span style={{
                    color: isBusy ? '#ff6b6b' : '#39ff14',
                    fontWeight: 700,
                    fontSize: '0.75em',
                    letterSpacing: '0.08em',
                    textShadow: isBusy
                      ? '0 0 8px #ff3c3c, 0 0 16px #ff0000'
                      : '0 0 8px #39ff14, 0 0 16px #00cc00',
                  }}>
                    {isBusy ? '● ใช้อยู่' : '● ว่าง'}
                  </span>
                </div>

                {/* ── เส้นคั่น Neon ── */}
                {isBusy && (
                  <div style={{
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(255,60,60,0.5), transparent)',
                    margin: '0 0 6px 0',
                  }} />
                )}

                {/* ── หัวข้อประชุม — เหลือง Neon ── */}
                {booking?.topic && (
                  <p style={{
                    color: '#ffe94d',
                    fontWeight: 600,
                    fontSize: '0.8em',
                    margin: '0 0 4px 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textShadow: '0 0 8px #ffe94d, 0 0 20px #ffcc00',
                    letterSpacing: '0.02em',
                  }}>
                    📋 {booking.topic}
                  </p>
                )}

                {/* ── ผู้จัด — ฟ้า Neon ── */}
                {booking?.booked_by && (
                  <p style={{
                    color: '#4dd9ff',
                    fontSize: '0.76em',
                    margin: '0 0 4px 0',
                    textShadow: '0 0 8px #4dd9ff, 0 0 16px #00aaff',
                    letterSpacing: '0.02em',
                  }}>
                    👤 {booking.booked_by}
                  </p>
                )}

                {/* ── เวลา — ม่วง Neon ── */}
                {(booking?.time_start || booking?.time_end) && (
                  <p style={{
                    color: '#cc88ff',
                    fontSize: '0.76em',
                    margin: '0',
                    textShadow: '0 0 8px #cc88ff, 0 0 16px #9900ff',
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '0.02em',
                  }}>
                    ⏰ {booking.time_start || ''}
                    {booking.time_start && booking.time_end ? ' – ' : ''}
                    {booking.time_end || ''}
                  </p>
                )}
              </div>
            )
          })}
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
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

      {/* ── Room Status — Corporate Executive Style (เป็นทางการ เหมาะกับบริษัท) ── */}
      {settings.rooms && settings.rooms.length > 0 && (
        <div className="display-rooms">
          {settings.rooms.map((room, index) => {
            const status = roomStatusMap[room.name] ?? { isBusy: false, booking: null }
            const { isBusy, booking } = status

            // ── สีและแสงแบบทางการระดับองค์กร (Corporate Palette & Soft Glow) ──
            const statusColor = isBusy ? '#ef4444' : '#10b981'
            const badgeTextColor = isBusy ? '#f87171' : '#34d399'
            const badgeBg = isBusy ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)'
            const badgeBorder = isBusy ? '1px solid rgba(239, 68, 68, 0.28)' : '1px solid rgba(16, 185, 129, 0.28)'
            const cardBorder = isBusy ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(16, 185, 129, 0.22)'
            const cardShadow = isBusy
              ? '0 4px 20px -2px rgba(0, 0, 0, 0.55), 0 0 14px -2px rgba(239, 68, 68, 0.12)'
              : '0 4px 20px -2px rgba(0, 0, 0, 0.55), 0 0 14px -2px rgba(16, 185, 129, 0.12)'
            const dotGlow = isBusy
              ? '0 0 6px rgba(239, 68, 68, 0.55)'
              : '0 0 6px rgba(16, 185, 129, 0.55)'

            return (
              <div
                key={index}
                className="display-room-card"
                style={{
                  background: 'linear-gradient(145deg, rgba(22, 27, 38, 0.94) 0%, rgba(13, 17, 24, 0.98) 100%)',
                  border: cardBorder,
                  borderRadius: '10px',
                  padding: '10px 14px',
                  boxShadow: cardShadow,
                  position: 'relative',
                  overflow: 'hidden',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {/* แถบแสงระบุสถานะด้านบน (Top accent status bar) */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2.5px',
                    background: isBusy
                      ? 'linear-gradient(90deg, #ef4444, rgba(239, 68, 68, 0.25))'
                      : 'linear-gradient(90deg, #10b981, rgba(16, 185, 129, 0.25))',
                  }}
                />

                {/* แสง Ambient Glow นุ่มนวลด้านหลังการ์ด */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '10px',
                    background: isBusy
                      ? 'radial-gradient(ellipse at 20% 0%, rgba(239, 68, 68, 0.07) 0%, transparent 65%)'
                      : 'radial-gradient(ellipse at 20% 0%, rgba(16, 185, 129, 0.06) 0%, transparent 65%)',
                    pointerEvents: 'none',
                  }}
                />

                {/* ── แถวบน: ชื่อห้อง + Badge สถานะ ── */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    position: 'relative',
                    marginBottom: isBusy && booking ? '6px' : '0',
                  }}
                >
                  <p
                    style={{
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.92em',
                      margin: 0,
                      letterSpacing: '0.02em',
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {room.name}
                  </p>

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: badgeBorder,
                      borderRadius: '5px',
                      padding: '2px 8px',
                      background: badgeBg,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: statusColor,
                        boxShadow: dotGlow,
                        display: 'inline-block',
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        color: badgeTextColor,
                        fontWeight: 600,
                        fontSize: '0.75em',
                        letterSpacing: '0.03em',
                      }}
                    >
                      {isBusy ? 'ใช้อยู่' : 'ว่าง'}
                    </span>
                  </div>
                </div>

                {/* ── สถานะเมื่อห้องว่าง ── */}
                {!isBusy && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      marginTop: '4px',
                      position: 'relative',
                    }}
                  >
                    <span style={{ color: '#10b981', fontSize: '0.72em' }}>●</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.75em', letterSpacing: '0.02em' }}>
                      พร้อมใช้งาน
                    </span>
                  </div>
                )}

                {/* ── เส้นคั่นเมื่อมีการประชุม ── */}
                {isBusy && booking && (
                  <div
                    style={{
                      height: '1px',
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent)',
                      margin: '6px 0 6px 0',
                      position: 'relative',
                    }}
                  />
                )}

                {/* ── หัวข้อประชุม — โทนขาวสว่างสุภาพ ── */}
                {isBusy && booking?.topic && (
                  <p
                    style={{
                      color: '#f1f5f9',
                      fontWeight: 600,
                      fontSize: '0.8em',
                      margin: '0 0 3px 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.01em',
                      position: 'relative',
                    }}
                  >
                    <span style={{ opacity: 0.8, marginRight: '4px' }}>📋</span>
                    {booking.topic}
                  </p>
                )}

                {/* ── ผู้จัด — โทนเทาสุภาพ ── */}
                {isBusy && booking?.booked_by && (
                  <p
                    style={{
                      color: '#94a3b8',
                      fontSize: '0.76em',
                      margin: '0 0 3px 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.01em',
                      position: 'relative',
                    }}
                  >
                    <span style={{ opacity: 0.8, marginRight: '4px' }}>👤</span>
                    {booking.booked_by}
                  </p>
                )}

                {/* ── เวลา — โทนฟ้าไอซ์บลูอ่านง่ายและเป็นระเบียบ ── */}
                {isBusy && (booking?.time_start || booking?.time_end) && (
                  <p
                    style={{
                      color: '#7dd3fc',
                      fontSize: '0.76em',
                      margin: '0',
                      fontVariantNumeric: 'tabular-nums',
                      letterSpacing: '0.02em',
                      position: 'relative',
                      fontWeight: 500,
                    }}
                  >
                    <span style={{ opacity: 0.8, marginRight: '4px' }}>⏰</span>
                    {booking.time_start || ''}
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
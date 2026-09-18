import { useCallback, useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { th as thLocale } from 'date-fns/locale'
import { Clock3, FileText, UserRound } from 'lucide-react'
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
  ticker_text: 'บริษัทเชียงใหม่โฟรเซ่นฟู้ดส์ จำกัด',
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

  const renderSlide = (image, type) => {
    if (!image) return null
    const transition = settings.transition_effect || 'fade'
    const stateClass = type === 'static' ? '' : `display-slide--${type}`

    return (
      <div
        key={`${image.id}-${type}`}
        className={`display-slide display-slide--${transition} ${stateClass}`}
      >
        <img src={image.image_url} alt={image.title} className="display-slide-img" draggable={false} />
      </div>
    )
  }

  const currentImage = images[currentIndex]
  const previousImage = prevIndex !== null ? images[prevIndex] : null
  const hasTicker = settings.show_footer_ticker && settings.ticker_text
  const hasRooms = settings.rooms?.length > 0

  return (
    <div className={`display-mode display-poster ${hasTicker ? 'display-has-ticker' : ''} ${hasRooms ? 'display-has-rooms' : ''}`}>
      <img className="display-brand-background" src="/display-brand-bg.png" alt="" aria-hidden="true" />

      <header className={`display-header ${settings.show_header_overlay ? '' : 'display-header--compact'}`}>
        <div className="display-brand">
          <img src="/cm-logo.png" alt="CM Logo" className="display-logo-img" draggable={false} />
        </div>

        {settings.show_header_overlay && (
          <div className="display-clock">
            <p className="display-clock-date">{format(clock, 'EEEE d MMMM yyyy', { locale: thLocale })}</p>
            <p className="display-clock-time">{format(clock, 'HH:mm')}</p>
          </div>
        )}
      </header>

      <main className="display-stage">
        {images.length === 0 ? (
          <div className="display-empty-state">
            <div className="display-empty-badge">{th.display.noContent}</div>
          </div>
        ) : (
          <div className="display-media-frame">
            {!animating && renderSlide(currentImage, 'static')}
            {animating && (
              <>
                {renderSlide(previousImage, 'exit')}
                {renderSlide(currentImage, 'enter')}
              </>
            )}
          </div>
        )}
      </main>

      {hasRooms && (
        <section className="display-rooms" aria-label="สถานะห้องประชุม">
          {settings.rooms.map((room) => {
            const status = roomStatusMap[room.name] ?? { isBusy: false, booking: null }
            const { isBusy, booking } = status

            return (
              <article
                key={room.id || room.name}
                className={`display-room-card ${isBusy ? 'display-room-card--busy' : 'display-room-card--free'}`}
              >
                <div className="display-room-heading">
                  <div className="display-room-title-wrap">
                    <h2 className="display-room-name">{room.name}</h2>
                    <div className={`display-room-status ${isBusy ? 'display-room-status--busy' : 'display-room-status--free'}`}>
                      <span className="display-room-dot" aria-hidden="true" />
                      <span>{isBusy ? 'ไม่ว่าง' : 'ว่าง'}</span>
                    </div>
                  </div>
                </div>

                {!isBusy && <p className="display-room-ready">พร้อมใช้งาน</p>}

                {isBusy && booking && (
                  <div className="display-room-details">
                    {booking.topic && (
                      <p><FileText aria-hidden="true" /><span>{booking.topic}</span></p>
                    )}
                    {booking.booked_by && (
                      <p><UserRound aria-hidden="true" /><span>{booking.booked_by}</span></p>
                    )}
                    {(booking.time_start || booking.time_end) && (
                      <p className="display-room-time">
                        <Clock3 aria-hidden="true" />
                        <span>{booking.time_start || ''}{booking.time_start && booking.time_end ? ' – ' : ''}{booking.time_end || ''}</span>
                      </p>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </section>
      )}

      {hasTicker && (
        <footer className="display-ticker">
          <div className="display-ticker-track">
            <span>{settings.ticker_text}</span>
            <span className="display-ticker-dot" aria-hidden="true">•</span>
            <span aria-hidden="true">{settings.ticker_text}</span>
          </div>
        </footer>
      )}
    </div>
  )
}

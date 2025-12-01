import { useState, useRef, useEffect } from 'react'
import './App.css'

function App() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const vinylRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [dataHash, setDataHash] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [showDownloadPage, setShowDownloadPage] = useState(false)
  const [showLyrics, setShowLyrics] = useState(false)
  const rotationRef = useRef(0)
  const animationRef = useRef<number | null>(null)



  const generateHash = () => {
    const chars = '0123456789abcdef'
    let hash = ''
    for (let i = 0; i < 24; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)]
    }
    return hash
  }

  const animateHash = (targetHash: string) => {
    let currentIndex = 0
    const interval = setInterval(() => {
      if (currentIndex <= targetHash.length) {
        setDataHash(targetHash.substring(0, currentIndex))
        currentIndex++
      } else {
        clearInterval(interval)
      }
    }, 30)
  }

  useEffect(() => {
    const hashInterval = setInterval(() => {
      const newHash = generateHash()
      animateHash(newHash)
    }, 5000)

    // Initial hash
    const initialHash = generateHash()
    animateHash(initialHash)

    return () => clearInterval(hashInterval)
  }, [])

  const handleDownload = async () => {
    setIsDownloading(true)
    setDownloadProgress(0)

    try {
      const response = await fetch('/music/pj.mp3')
      const reader = response.body?.getReader()
      const contentLength = +(response.headers.get('Content-Length') || 0)

      if (!reader) {
        throw new Error('Failed to get reader')
      }

      let receivedLength = 0
      const chunks: Uint8Array[] = []

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        chunks.push(value)
        receivedLength += value.length

        const progress = contentLength ? (receivedLength / contentLength) * 100 : 0
        setDownloadProgress(Math.round(progress))
      }

      const blob = new Blob(chunks as BlobPart[])
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'ป๋าเจโคตรเฟี้ยว.mp3'
      link.click()
      URL.revokeObjectURL(url)

      setTimeout(() => {
        setIsDownloading(false)
        setDownloadProgress(0)
      }, 500)
    } catch (error) {
      console.error('Download failed:', error)
      setIsDownloading(false)
      setDownloadProgress(0)
    }
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
    }
  }, [])

  useEffect(() => {
    const vinyl = vinylRef.current
    if (!vinyl) return

    if (isPlaying) {
      const animate = () => {
        rotationRef.current += 0.5
        vinyl.style.transform = `rotate(${rotationRef.current}deg)`
        animationRef.current = requestAnimationFrame(animate)
      }
      animationRef.current = requestAnimationFrame(animate)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = parseFloat(e.target.value)
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newVolume = parseFloat(e.target.value)
    audio.volume = newVolume
    setVolume(newVolume)
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const skipTime = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = Math.max(0, Math.min(audio.currentTime + seconds, duration))
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  if (showDownloadPage) {
    return (
      <div className="app">
        <div className="background-glow"></div>
        <div className="music-player download-page">
          <button className="back-btn" onClick={() => setShowDownloadPage(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            กลับ
          </button>

          <div className="download-header">
            <h2 className="download-title">ดาวน์โหลดเพลง</h2>
            <p className="download-subtitle">ป๋าเจโคตรเฟี้ยว - PJ</p>
          </div>

          <div className="hash-display-large">
            <div className="hash-label">DATA HASH</div>
            <div className="hash-value">{dataHash}</div>
          </div>

          <button className="download-btn-large" onClick={handleDownload} disabled={isDownloading}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{isDownloading ? `กำลังดาวน์โหลด ${downloadProgress}%` : 'ดาวน์โหลดเพลง'}</span>
          </button>

          {isDownloading && (
            <div className="download-progress-container">
              <div className="download-progress-bar">
                <div 
                  className="download-progress-fill" 
                  style={{ width: `${downloadProgress}%` }}
                ></div>
              </div>
              <div className="download-progress-text">{downloadProgress}%</div>
            </div>
          )}

          <div className="download-info">
            <div className="info-item">
              <span className="info-label">ชื่อไฟล์:</span>
              <span className="info-value">ป๋าเจโคตรเฟี้ยว.mp3</span>
            </div>
            <div className="info-item">
              <span className="info-label">ประเภท:</span>
              <span className="info-value">Thai Hip-Hop</span>
            </div>
            <div className="info-item">
              <span className="info-label">ศิลปิน:</span>
              <span className="info-value">PJ</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const fullLyrics = `ป๋าเจมาแล้วโว้ย ลงจากเบนซ์แบบแน่น
เงินไม่ใช่ประเด็น ใจมันเท่กว่านั้นแหละ
เดินเข้าผับที ไฟแทบดับเพราะสั่น
ทุกคนหันมามอง แบบว่าใครวะ… หล่อจัดเกินปกมันส์

(Pre-Chorus)
ลุคมันคูลแบบไม่ขออนุญาต
สไตล์จัดเต็มไม่เคยหยุดสตาร์ท
ป๋าเจตัวจริง ไม่มีสำเนา
เดินเข้ามาแบบเงา แต่โคตรพาวเวอร์เฮ้า

(Chorus)
โอ้ ป๋าเจ ป๋าเจ ตัวท็อปไม่ใช่เล่น
ใครเห็นก็ต้องเซ แค่เหล่มองก็ใจเต้น
โอ้ ป๋าเจ ป๋าเจ จังหวะชีวิตมันเท่
ใช้ชีวิตแบบจัดเต็ม ไม่มีเบรกนะเว้ย

(Verse 2)
นาฬิกาข้อมือวิบวับ แต่ใจยังดิบอยู่
เพื่อนโทรมาชวนปาร์ตี้ ป๋าก็จัดไปไม่รู้
ชีวิตมันต้องลุย ไม่มีถอยหรอก
เฟรนอยากบินก็แค่บิน ป๋าเจไม่เน้นทำเล่น

(Bridge)
โลกมันหมุน ป๋าเจก็หมุนตาม
แต่ไม่เคยยอมตามใคร มันต้องตามใจฉัน
ขับความฝันไปเรื่อยๆ แบบไม่มีวันพัง
เพราะป๋าเจโคตรดัง แม้ไม่ตั้งใจก็ตาม

(Chorus)
โอ้ ป๋าเจ ป๋าเจ ตัวท็อปไม่ใช่เล่น
ใครเห็นก็ต้องเซ แค่เหล่มองก็ใจเต้น
โอ้ ป๋าเจ ป๋าเจ จังหวะชีวิตมันเท่
ใช้ชีวิตแบบจัดเต็ม ไม่มีเบรกนะเว้ย`

  return (
    <div className="app">
      <div className="background-glow"></div>
      <div className={`main-container ${showLyrics ? 'lyrics-open' : ''}`}>
      <div className="music-player">
        <div className="player-header">
          <div className="logo"></div>
          <div className="status-indicator">
            <div className={`pulse-dot ${isPlaying ? 'active' : ''}`}></div>
            <span>{isPlaying ? 'กำลังเล่น' : 'หยุดชั่วคราว'}</span>
          </div>
        </div>

        <div className="album-art">
          <div className="vinyl-glow"></div>
          <div className="vinyl-record">
            <div ref={vinylRef} className="vinyl">
              <div className="vinyl-text">ป๋าเจโคตรเฟี้ยว</div>
              <div className="vinyl-center"></div>
            </div>
          </div>
        </div>

        <div className="song-info">
          <h1 className="song-title">ป๋าเจโคตรเฟี้ยว</h1>
          <p className="artist-name">PJ</p>
          <div className="genre-tag">Thai Hip-Hop</div>
        </div>

        <div className="progress-container">
          <span className="time">{formatTime(currentTime)}</span>
          <input
            type="range"
            className="progress-bar"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleProgressChange}
            style={{
              background: `linear-gradient(to right, #ff0000 0%, #cc0000 ${(currentTime / duration) * 100}%, #1a1a1a ${(currentTime / duration) * 100}%, #1a1a1a 100%)`
            }}
          />
          <span className="time">{formatTime(duration)}</span>
        </div>

        <div className="controls">
          <button className="control-btn" onClick={() => skipTime(-10)} title="ถอยหลัง 10 วินาที">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 3v5h5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <button className="play-btn" onClick={togglePlay}>
            {isPlaying ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/>
                <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
              </svg>
            )}
          </button>

          <button className="control-btn" onClick={() => skipTime(10)} title="กรอไปหน้า 10 วินาที">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 3v5h-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="volume-container">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M11 5L6 9H2V15H6L11 19V5Z" fill="currentColor"/>
            <path d="M15.54 8.46C16.4774 9.39764 17.0039 10.6692 17.0039 11.995C17.0039 13.3208 16.4774 14.5924 15.54 15.53" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="range"
            className="volume-bar"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            style={{
              background: `linear-gradient(to right, #ff0000 0%, #cc0000 ${volume * 100}%, #1a1a1a ${volume * 100}%, #1a1a1a 100%)`
            }}
          />
        </div>

        <button className="lyrics-toggle-btn" onClick={() => setShowLyrics(!showLyrics)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18V5l12-2v13M9 18c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm12-2c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {showLyrics ? 'ซ่อนเนื้อเพลง' : 'แสดงเนื้อเพลง'}
        </button>

        <button className="nav-download-btn" onClick={() => setShowDownloadPage(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          ดาวน์โหลดเพลง
        </button>

        <audio ref={audioRef} src="/music/pj.mp3" />
      </div>

      <div className={`lyrics-panel ${showLyrics ? 'open' : ''}`}>
        <div className="lyrics-panel-header">
          <h3>เนื้อเพลง</h3>
          <button className="close-lyrics-btn" onClick={() => setShowLyrics(false)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div className="lyrics-panel-content">
          {fullLyrics.split('\n').map((line, index) => (
            <p key={index} className="lyric-line">{line || '\u00A0'}</p>
          ))}
        </div>
      </div>
      </div>
    </div>
  )
}

export default App

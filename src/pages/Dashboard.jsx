import { useEffect, useRef, useState } from 'react'
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale,
  BarElement
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { subscribeProjects } from '../services/project.service'
import { buildDashboardSummary } from '../services/dashboard.logic'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const singkat = (n = 0) => {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1).replace('.', ',')} M`
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1).replace('.', ',')} Jt`
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)} Rb`
  return `Rp ${n}`
}

const rupiah = (n = 0) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

function useIsDark() {
  const [isDark, setIsDark] = useState(
    () => document.body.getAttribute('data-theme') === 'dark'
  )
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.body.getAttribute('data-theme') === 'dark')
    })
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])
  return isDark
}

// Warna vibrant per divisi/sub divisi — case insensitive via normalize()
const DIVISION_COLORS = {
  konsultan:   '#3b82f6',
  konstruksi:  '#22c55e',
  pengadaan:   '#f97316',
  perencanaan: '#06b6d4',
  pengawasan:  '#6366f1',
  jalan:       '#16a34a',
  jembatan:    '#8b5cf6',
  bangunan:    '#ef4444',
  drainase:    '#eab308',
  barang:      '#0ea5e9',
  jasa:        '#ec4899',
}

const getDivisionColor = (key = '') => DIVISION_COLORS[key.toLowerCase()] || '#64748b'

const COLORS = {
  blue:   '#3b82f6',
  green:  '#22c55e',
  orange: '#f97316',
  red:    '#ef4444',
  yellow: '#eab308',
  slate:  '#64748b',
}

// ── Custom Pill Bar Chart ──
function PillBarChart({ data }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data.map(d => d.value), 1)

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: 6, height: 200, paddingBottom: 4 }}>
      {data.map(({ label, value, color }) => {
        const heightPct = Math.max((value / max) * 100, 6)
        const subLabel = label.includes(' / ') ? label.split(' / ')[1] : label
        const parentLabel = label.includes(' / ') ? label.split(' / ')[0] : null

        return (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
            {/* Nilai di atas */}
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{value}</div>

            {/* Bar pill */}
            <div style={{ width: '100%', maxWidth: 32, height: 140, display: 'flex', alignItems: 'flex-end' }}>
              <div style={{
                width: '100%',
                height: `${heightPct}%`,
                minHeight: 16,
                background: color,
                borderRadius: 999,
                transition: 'height 0.4s ease, filter 0.15s ease, box-shadow 0.15s ease',
                cursor: 'pointer',
                boxShadow: `0 4px 14px ${color}55`,
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.filter = 'brightness(1.2)'
                  e.currentTarget.style.boxShadow = `0 8px 24px ${color}88`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.filter = ''
                  e.currentTarget.style.boxShadow = `0 4px 14px ${color}55`
                }}
              />
            </div>

            {/* Label sub divisi */}
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', wordBreak: 'break-word', lineHeight: 1.3, maxWidth: 56 }}>
              {subLabel}
            </div>

            {/* Label divisi parent */}
            {parentLabel && (
              <div style={{ fontSize: 9, color: 'var(--text-soft)', textAlign: 'center' }}>
                {parentLabel}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Dashboard({ goToProject, goToAddProject, goToPage }) {
  const [projects, setProjects] = useState([])
  const [exporting, setExporting] = useState(false)
  const dashboardRef = useRef(null)
  const attentionRef = useRef(null)
  const isDark = useIsDark()

  useEffect(() => { return subscribeProjects(setProjects) }, [])

  const {
    activeProjects, archivedProjects, totalNilaiAktif,
    avgProgress, butuhPerhatian, safeProjects,
    dangerProjects, doneProjects, lowestProgressProject, nearestDeadline
  } = buildDashboardSummary(projects)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tepatWaktu = activeProjects.filter(p => {
    const sisa = Math.ceil((new Date(p.tanggalSelesai) - today) / (1000 * 60 * 60 * 24))
    return sisa >= 7
  }).length

  const berisiko = activeProjects.filter(p => {
    const sisa = Math.ceil((new Date(p.tanggalSelesai) - today) / (1000 * 60 * 60 * 24))
    return sisa >= 0 && sisa < 7
  }).length

  const terlambat = activeProjects.filter(p => new Date(p.tanggalSelesai) < today).length
  const totalAktif = activeProjects.length || 1

  const keterlambatanHari = activeProjects
    .filter(p => new Date(p.tanggalSelesai) < today)
    .map(p => Math.ceil((today - new Date(p.tanggalSelesai)) / (1000 * 60 * 60 * 24)))

  const rataKeterlambatan = keterlambatanHari.length > 0
    ? Math.round(keterlambatanHari.reduce((a, b) => a + b, 0) / keterlambatanHari.length)
    : 0

  const labelColor = isDark ? '#b0bac7' : '#64748b'
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const tooltipBg = isDark ? '#1e293b' : '#ffffff'
  const tooltipColor = isDark ? '#e2e8f0' : '#0f172a'

  const donutKomposisi = {
    labels: ['Aktif', 'Arsip'],
    datasets: [{
      data: [activeProjects.length, archivedProjects.length],
      backgroundColor: [COLORS.blue, COLORS.green],
      borderWidth: 0, hoverOffset: 16
    }]
  }

  const donutStatus = {
    labels: ['Aman', 'Bahaya', 'Selesai'],
    datasets: [{
      data: [safeProjects.length, dangerProjects.length, doneProjects.length],
      backgroundColor: [COLORS.green, COLORS.red, COLORS.blue],
      borderWidth: 0, hoverOffset: 16
    }]
  }

  // Pill bar — grouping by divisi/sub divisi, case insensitive
  const divisiCount = {}
  activeProjects.forEach(p => {
    const div = p.division || p.divisi || ''
    const sub = p.subDivision || p.subDivisi || ''
    const key = sub ? `${div} / ${sub}` : (div || 'Lainnya')
    divisiCount[key] = (divisiCount[key] || 0) + 1
  })

  const pillData = Object.entries(divisiCount)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => {
      const parts = label.split(' / ')
      const colorKey = parts[1] || parts[0]
      return { label, value, color: getDivisionColor(colorKey) }
    })

  const allActive = activeProjects
  const BAR_ITEM_HEIGHT = 36
  const barChartHeight = Math.max(200, allActive.length * BAR_ITEM_HEIGHT)

  const barProgress = {
    labels: allActive.map(p => p.name.length > 24 ? p.name.slice(0, 24) + '…' : p.name),
    datasets: [{
      label: 'Progress (%)',
      data: allActive.map(p => p.progress || 0),
      backgroundColor: allActive.map(p =>
        (p.progress || 0) === 100 ? COLORS.green
        : (p.progress || 0) >= 50 ? COLORS.blue
        : COLORS.orange
      ),
      borderRadius: 6, borderSkipped: false, barThickness: 18,
    }]
  }

  const donutOptions = () => ({
    cutout: '70%',
    plugins: {
      legend: { position: 'bottom', labels: { color: labelColor, font: { size: 11 }, padding: 12, boxWidth: 10 } },
      tooltip: { backgroundColor: tooltipBg, titleColor: tooltipColor, bodyColor: labelColor, borderColor: gridColor, borderWidth: 1 }
    },
    animation: { animateRotate: true, duration: 600 }
  })

  const barOptions = {
    indexAxis: 'y', responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: tooltipBg, titleColor: tooltipColor, bodyColor: labelColor,
        borderColor: gridColor, borderWidth: 1,
        callbacks: { label: ctx => ` ${ctx.parsed.x}%` }
      }
    },
    scales: {
      x: { min: 0, max: 100, ticks: { color: labelColor, callback: v => `${v}%` }, grid: { color: gridColor } },
      y: { ticks: { color: labelColor, font: { size: 11 } }, grid: { display: false } }
    }
  }

  const SUMMARY = [
    { label: 'Proyek Aktif', value: activeProjects.length, sub: null, accent: COLORS.blue, onClick: () => goToPage('projects'), hint: 'Lihat semua proyek aktif' },
    { label: 'Total Nilai Aktif', value: singkat(totalNilaiAktif), sub: rupiah(totalNilaiAktif), accent: COLORS.green, onClick: null, hint: null },
    { label: 'Proyek Arsip', value: archivedProjects.length, sub: null, accent: '#8b5cf6', onClick: () => goToPage('archives'), hint: 'Lihat arsip proyek' },
    { label: 'Rata-rata Progress', value: `${avgProgress}%`, sub: null, accent: COLORS.orange, onClick: null, hint: null },
    { label: 'Perlu Perhatian', value: butuhPerhatian.length, sub: null, accent: COLORS.red, onClick: () => attentionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), hint: 'Lihat daftar perlu perhatian' },
    { label: 'Progress Terendah', value: lowestProgressProject ? `${lowestProgressProject.progress || 0}%` : '-', sub: lowestProgressProject?.name || null, accent: COLORS.slate, onClick: lowestProgressProject ? () => goToProject(lowestProgressProject.id) : null, hint: lowestProgressProject ? 'Lihat proyek ini' : null },
  ]

  const handleExport = async (format) => {
    if (!dashboardRef.current) return
    setExporting(true)
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2, useCORS: true,
        backgroundColor: isDark ? '#0f172a' : '#f8fafc'
      })
      const imgData = canvas.toDataURL('image/png')
      const fileName = `Dashboard_Proyek_${new Date().toISOString().slice(0, 10)}`
      if (format === 'png') {
        const a = document.createElement('a'); a.href = imgData; a.download = `${fileName}.png`; a.click()
      } else if (format === 'jpeg') {
        const jpegData = canvas.toDataURL('image/jpeg', 0.92)
        const a = document.createElement('a'); a.href = jpegData; a.download = `${fileName}.jpg`; a.click()
      } else if (format === 'pdf') {
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
        const imgWidth = 297
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
        pdf.save(`${fileName}.pdf`)
      }
    } catch (err) { console.error('Export error:', err) }
    setExporting(false)
  }

  const btnBase = {
    padding: '6px 12px', borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg-card-soft)',
    color: 'var(--text)', fontSize: 12,
    cursor: 'pointer', fontFamily: 'inherit'
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ margin: 0, color: 'var(--text)' }}>Dashboard</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={{ ...btnBase, background: '#2563eb', color: '#fff', border: '1px solid #2563eb', fontWeight: 600 }} onClick={goToAddProject}>
            + Tambah Proyek
          </button>
          <select style={btnBase} disabled={exporting} defaultValue=""
            onChange={e => { if (e.target.value) handleExport(e.target.value); e.target.value = '' }}>
            <option value="" disabled>{exporting ? 'Mengekspor...' : '⬇ Export'}</option>
            <option value="png">Export PNG</option>
            <option value="jpeg">Export JPEG</option>
            <option value="pdf">Export PDF</option>
          </select>
        </div>
      </div>

      <div ref={dashboardRef} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {SUMMARY.map(({ label, value, sub, accent, onClick, hint }) => (
            <div key={label} className="app-card"
              onClick={onClick || undefined} title={hint || undefined}
              style={{ padding: '14px 16px', borderLeft: `3px solid ${accent}`, cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
              onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)' }}}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.05em' }}>{label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', lineHeight: 1.1 }}>{value}</div>
              {sub && <div style={{ fontSize: 11, color: 'var(--text-soft)', marginTop: 4, wordBreak: 'break-word' }}>{sub}</div>}
              {onClick && <div style={{ fontSize: 10, color: accent, marginTop: 6, fontWeight: 600 }}>{hint} →</div>}
            </div>
          ))}
        </div>

        {/* Analisa Ketepatan Waktu */}
        <div className="app-card">
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>🎯 Analisa Ketepatan Waktu</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Tepat Waktu', value: tepatWaktu, pct: Math.round(tepatWaktu / totalAktif * 100), color: COLORS.green },
              { label: 'Berisiko', value: berisiko, pct: Math.round(berisiko / totalAktif * 100), color: COLORS.yellow },
              { label: 'Terlambat', value: terlambat, pct: Math.round(terlambat / totalAktif * 100), color: COLORS.red },
              { label: 'Rata-rata Keterlambatan', value: `${rataKeterlambatan} hari`, pct: null, color: COLORS.slate },
            ].map(({ label, value, pct, color }) => (
              <div key={label} style={{ textAlign: 'center', padding: '10px 8px', borderRadius: 10, background: 'var(--bg-card-soft)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
                {pct !== null && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{pct}% dari aktif</div>}
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', gap: 2 }}>
            <div style={{ width: `${Math.round(tepatWaktu / totalAktif * 100)}%`, background: COLORS.green, transition: 'width 0.4s ease' }} />
            <div style={{ width: `${Math.round(berisiko / totalAktif * 100)}%`, background: COLORS.yellow, transition: 'width 0.4s ease' }} />
            <div style={{ width: `${Math.round(terlambat / totalAktif * 100)}%`, background: COLORS.red, transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
            <span>🟢 Tepat Waktu</span><span>🟡 Berisiko</span><span>🔴 Terlambat</span>
          </div>
        </div>

        {/* Perlu Perhatian + Deadline */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          <div ref={attentionRef} className="app-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>⚠️ Perlu Perhatian</h3>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#fef2f2', color: '#991b1b', fontWeight: 600 }}>{butuhPerhatian.length} proyek</span>
            </div>
            {butuhPerhatian.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>✅ Semua proyek dalam kondisi baik</div>
            ) : (
              <div className="subtle-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
                {butuhPerhatian.map(p => (
                  <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.name}</span>
                      <button onClick={() => goToProject(p.id)}
                        style={{ fontSize: 11, color: COLORS.blue, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                        Lihat →
                      </button>
                    </div>
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${p.progress || 0}%`, background: (p.progress || 0) >= 50 ? COLORS.yellow : COLORS.red, borderRadius: 999 }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Progress: {p.progress || 0}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="app-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>📅 Deadline Terdekat</h3>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--bg-card-soft)', color: 'var(--text-muted)', fontWeight: 600, border: '1px solid var(--border)' }}>
                {nearestDeadline.length} proyek
              </span>
            </div>
            {nearestDeadline.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>Tidak ada deadline mendekat</div>
            ) : (
              <div className="subtle-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
                {nearestDeadline.map(p => {
                  const selesai = new Date(p.tanggalSelesai)
                  const sisaHari = Math.ceil((selesai - today) / (1000 * 60 * 60 * 24))
                  const isLate = sisaHari < 0
                  const isCritical = sisaHari >= 0 && sisaHari <= 7
                  return (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.tanggalSelesai}</div>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, flexShrink: 0,
                        background: isLate ? '#fef2f2' : isCritical ? '#fef3c7' : 'var(--bg-card-soft)',
                        color: isLate ? '#991b1b' : isCritical ? '#92400e' : 'var(--text-muted)'
                      }}>
                        {isLate ? `${Math.abs(sisaHari)}h terlambat` : `${sisaHari}h lagi`}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          <div className="app-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--text)', alignSelf: 'flex-start' }}>Komposisi Proyek</h3>
            <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto' }}>
              <Doughnut data={donutKomposisi} options={donutOptions()} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{projects.length}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Total</div>
              </div>
            </div>
          </div>

          <div className="app-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--text)', alignSelf: 'flex-start' }}>Status Proyek</h3>
            <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto' }}>
              <Doughnut data={donutStatus} options={donutOptions()} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{activeProjects.length}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Aktif</div>
              </div>
            </div>
          </div>

          {pillData.length > 0 && (
            <div className="app-card">
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Proyek per Divisi</h3>
              <PillBarChart data={pillData} />
            </div>
          )}

          {allActive.length > 0 && (
            <div className="app-card" style={{ gridColumn: '1 / -1' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                Progress Proyek Aktif
                <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>({allActive.length} proyek)</span>
              </h3>
              <div className="subtle-scroll" style={{ maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
                <div style={{ height: barChartHeight, minHeight: 200 }}>
                  <Bar data={barProgress} options={barOptions} />
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
import { calcProgress } from './project.utils'

export const hitungStatusWaktu = p => {
  if (!p?.tanggalSelesai || !p?.durasiHari) {
    return {
      label: '-',
      info: '',
      level: 'none'
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const end = new Date(p.tanggalSelesai)
  end.setHours(0, 0, 0, 0)

  const sisaHari = Math.ceil(
    (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Jika workflow selesai 100%
  if (calcProgress(p.workflow) >= 100) {
    return {
      label: '✅ Selesai',
      info: '',
      level: 'done'
    }
  }

  const batasKritis = Math.ceil(p.durasiHari * 0.2)

  if (sisaHari > batasKritis) {
    return {
      label: '🟢 Aman',
      info: `Sisa ${sisaHari} hari`,
      level: 'safe'
    }
  }

  if (sisaHari > 0) {
    return {
      label: '🟡 Kritis',
      info: `Sisa ${sisaHari} hari`,
      level: 'warning'
    }
  }

  return {
    label: '🔴 Terlambat',
    info: `Terlambat ${Math.abs(sisaHari)} hari`,
    level: 'danger'
  }
}

/**
 * Digunakan untuk export (hapus emoji agar Excel bersih)
 */
export const statusWaktuText = p => {
  const label = hitungStatusWaktu(p).label
  return label.replace(/[^\x00-\x7F]/g, '').trim()
}

import * as XLSX from 'xlsx-js-style'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatRupiah } from '../utils/currency'
import { safeWorkflow, calcProgress } from '../utils/project.utils'
import { statusWaktuText } from '../utils/timeStatus'

/**
 * Mapping warna status waktu (Excel)
 */
const STATUS_COLOR = {
  Aman: 'C6EFCE',        // hijau muda
  Kritis: 'FFEB9C',      // kuning
  Terlambat: 'FFC7CE',  // merah muda
  Selesai: 'BDD7EE'     // biru muda
}

const buildFileName = (title, extension) => {
  const today = new Date().toISOString().split('T')[0]

  const safeTitle = title
    .replace(/[^a-zA-Z0-9\s-]/g, '') // hapus karakter ilegal
    .trim()
    .replace(/\s+/g, '-') // spasi jadi dash

  return `${safeTitle}-${today}.${extension}`
}

const DATA_START_ROW = 3
/**
 * EXPORT EXCEL (FULL STYLE)
 */
export const exportExcel = (projects, title = 'Laporan Proyek') => {
  const rows = projects.map((p, i) => {
    const workflowText = safeWorkflow(p.workflow)
      .map(s => `${s.label}: ${s.progress}%`)
      .join(' | ')

    return {
      No: i + 1,
      NamaProyek: p.name,
      PIC: p.pic || '',
      NoKontrak: p.nomorKontrak || '',
      Instansi: p.instansi,
      Lokasi: p.lokasi,
      SumberDana: p.sumberDana,
      NilaiAnggaran: formatRupiah(p.nilaiAnggaran),
      TahunAnggaran: p.tahunAnggaran,
      Divisi: p.division,
      SubDivisi: p.subDivision || '-',
      TanggalMulai: p.tanggalMulai,
      DurasiHari: p.durasiHari,
      TanggalSelesai: p.tanggalSelesai,
      StatusWaktu: statusWaktuText(p),
      StatusPembayaran: p.paymentStatus || 'Belum Bayar',
      ProgressTotal: `${calcProgress(p.workflow)}%`,
      DetailTahapan: workflowText
    }
  })

  const ws = XLSX.utils.json_to_sheet(rows, { origin: 'A3' })

// Tambahkan judul di baris atas
ws['A1'] = {
  v: title,
  t: 's',
  s: {
    font: { bold: true, sz: 16 },
    alignment: { horizontal: 'center' }
  }
}

// Merge judul sampai kolom terakhir
const lastCol = Object.keys(rows[0]).length - 1
ws['!merges'] = [
  {
    s: { r: 0, c: 0 },
    e: { r: 0, c: lastCol }
  }
]

  // cari index kolom StatusWaktu
  const header = Object.keys(rows[0])
  const statusColIndex = header.indexOf('StatusWaktu')

  // apply warna ke cell StatusWaktu
  rows.forEach((row, rowIndex) => {
    const status = row.StatusWaktu
    const color = STATUS_COLOR[status]

    if (!color) return

    const cellRef = XLSX.utils.encode_cell({
      r: rowIndex + DATA_START_ROW,
      c: statusColIndex
    })

    if (!ws[cellRef]) return

    ws[cellRef].s = {
      fill: {
        patternType: 'solid',
        fgColor: { rgb: color }
      },
      font: {
        bold: true
      },
      alignment: {
        horizontal: 'center',
        vertical: 'center'
      }
    }
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Proyek')
  const fileName = buildFileName(title, 'xlsx')
XLSX.writeFile(wb, fileName)
}

/**
 * EXPORT PDF (GRID BERSIH)
 */
export const exportPDF = (projects, title = 'Laporan Proyek') => {
  const pdf = new jsPDF()
  pdf.setFontSize(16)
pdf.setFont(undefined, 'bold')
pdf.text(title, 14, 10)
pdf.setFont(undefined, 'normal')

  projects.forEach((p, idx) => {
    if (idx > 0) pdf.addPage()

    autoTable(pdf, {
      startY: 18,
      theme: 'grid',
      head: [['Informasi', 'Detail']],
      body: [
        ['Nama Proyek', p.name],
        ['PIC', p.pic || '-'],
        ['No. Kontrak', p.nomorKontrak || '-'],
        ['Instansi', p.instansi],
        ['Lokasi', p.lokasi],
        ['Sumber Dana', p.sumberDana],
        ['Nilai Anggaran', formatRupiah(p.nilaiAnggaran)],
        ['Tahun Anggaran', p.tahunAnggaran],
        ['Divisi', p.division],
        ['Sub Divisi', p.subDivision || '-'],
        ['Tanggal Mulai', p.tanggalMulai],
        ['Durasi (Hari)', p.durasiHari],
        ['Tanggal Selesai', p.tanggalSelesai],
        ['Status Waktu', statusWaktuText(p)],
        ['Status Pembayaran', p.paymentStatus || 'Belum Bayar'],
        ['Progress Total', `${calcProgress(p.workflow)}%`]
      ]
    })

    autoTable(pdf, {
      startY: pdf.lastAutoTable.finalY + 10,
      theme: 'grid',
      head: [['Tahapan', 'Progress']],
      body: safeWorkflow(p.workflow).map(s => [
        s.label,
        `${s.progress}%`
      ])
    })
  })

  const fileName = buildFileName(title, 'pdf')
pdf.save(fileName)
}

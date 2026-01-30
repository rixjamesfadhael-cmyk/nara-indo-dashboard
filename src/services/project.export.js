import * as XLSX from 'xlsx-js-style'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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

/**
 * EXPORT EXCEL (FULL STYLE)
 */
export const exportExcel = projects => {
  const rows = projects.map((p, i) => {
    const workflowText = safeWorkflow(p.workflow)
      .map(s => `${s.label}: ${s.progress}%`)
      .join(' | ')

    return {
      No: i + 1,
      NamaProyek: p.name,
      NoKontrak: p.noKontrak || '',
      Instansi: p.instansi,
      Lokasi: p.lokasi,
      SumberDana: p.sumberDana,
      NilaiAnggaran: p.nilaiAnggaran,
      TahunAnggaran: p.tahunAnggaran,
      Divisi: p.division,
      SubDivisi: p.subDivision || '-',
      TanggalMulai: p.tanggalMulai,
      DurasiHari: p.durasiHari,
      TanggalSelesai: p.tanggalSelesai,
      StatusWaktu: statusWaktuText(p),
      ProgressTotal: `${calcProgress(p.workflow)}%`,
      DetailTahapan: workflowText
    }
  })

  const ws = XLSX.utils.json_to_sheet(rows)

  // cari index kolom StatusWaktu
  const header = Object.keys(rows[0])
  const statusColIndex = header.indexOf('StatusWaktu')

  // apply warna ke cell StatusWaktu
  rows.forEach((row, rowIndex) => {
    const status = row.StatusWaktu
    const color = STATUS_COLOR[status]

    if (!color) return

    const cellRef = XLSX.utils.encode_cell({
      r: rowIndex + 1, // +1 karena header
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
  XLSX.writeFile(wb, 'daftar-proyek-lengkap.xlsx')
}

/**
 * EXPORT PDF (GRID BERSIH)
 */
export const exportPDF = projects => {
  const pdf = new jsPDF()

  projects.forEach((p, idx) => {
    if (idx > 0) pdf.addPage()

    autoTable(pdf, {
      startY: 14,
      theme: 'grid',
      head: [['Informasi', 'Detail']],
      body: [
        ['Nama Proyek', p.name],
        ['No. Kontrak', p.noKontrak || '-'],
        ['Instansi', p.instansi],
        ['Lokasi', p.lokasi],
        ['Sumber Dana', p.sumberDana],
        ['Nilai Anggaran', p.nilaiAnggaran],
        ['Tahun Anggaran', p.tahunAnggaran],
        ['Divisi', p.division],
        ['Sub Divisi', p.subDivision || '-'],
        ['Tanggal Mulai', p.tanggalMulai],
        ['Durasi (Hari)', p.durasiHari],
        ['Tanggal Selesai', p.tanggalSelesai],
        ['Status Waktu', statusWaktuText(p)],
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

  pdf.save('daftar-proyek-lengkap.pdf')
}

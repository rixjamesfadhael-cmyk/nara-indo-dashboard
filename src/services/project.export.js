import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import { safeWorkflow, calcProgress } from '../utils/project.utils'
import { statusWaktuText } from '../utils/timeStatus'

export const exportExcel = projects => {
  const rows = projects.map((p, i) => {
    const workflowText = safeWorkflow(p.workflow)
      .map(s => `${s.label}: ${s.progress}%`)
      .join(' | ')

    return {
      No: i + 1,
      NamaProyek: p.name,
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
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Proyek')
  XLSX.writeFile(wb, 'daftar-proyek-lengkap.xlsx')
}

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

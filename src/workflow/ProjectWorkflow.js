/**
 * PROJECT WORKFLOW
 * =================
 * Sumber konsep:
 * - Praktik proyek pemerintah
 * - Praktik proyek swasta
 *
 * File ini:
 * - TIDAK mengatur UI
 * - TIDAK menyentuh Firestore
 * - HANYA logika workflow & helper
 */

/* =========================
   DEFINISI WORKFLOW FINAL
   ========================= */

/**
 * KONSULTAN
 * - Sub: Perencanaan, Pengawasan
 * - Masing-masing punya tahapan sendiri
 */
export const WORKFLOW_KONSULTAN = {
  perencanaan: {
    label: 'Perencanaan',
    steps: [
      { key: 'survey', label: 'Survey & Pengumpulan Data', progress: 0 },
      { key: 'analisa', label: 'Analisa & Konsep', progress: 0 },
      { key: 'desain', label: 'Penyusunan Dokumen Desain', progress: 0 },
      { key: 'finalisasi', label: 'Finalisasi Dokumen', progress: 0 }
    ]
  },
  pengawasan: {
    label: 'Pengawasan',
    steps: [
      { key: 'monitoring', label: 'Monitoring Lapangan', progress: 0 },
      { key: 'evaluasi', label: 'Evaluasi & Laporan Berkala', progress: 0 },
      { key: 'rekomendasi', label: 'Rekomendasi Teknis', progress: 0 },
      { key: 'laporan_akhir', label: 'Laporan Akhir', progress: 0 }
    ]
  }
}

/**
 * KONSTRUKSI
 * - Fokus pelaksanaan
 * - Tahapan detail (bukan cuma 1 bar)
 */
export const WORKFLOW_KONSTRUKSI = {
  pelaksanaan: {
    label: 'Pelaksanaan Konstruksi',
    steps: [
      { key: 'mobilisasi', label: 'Mobilisasi', progress: 0 },
      { key: 'pekerjaan_awal', label: 'Pekerjaan Awal', progress: 0 },
      { key: 'pekerjaan_utama', label: 'Pekerjaan Utama', progress: 0 },
      { key: 'finishing', label: 'Finishing', progress: 0 },
      { key: 'uji_fungsi', label: 'Uji Fungsi & Serah Terima', progress: 0 }
    ]
  }
}

/**
 * PENGADAAN
 * - Bahasa disesuaikan regulasi
 */
export const WORKFLOW_PENGADAAN = {
  pengadaan: {
    label: 'Pengadaan',
    steps: [
      { key: 'perencanaan', label: 'Perencanaan Pengadaan', progress: 0 },
      { key: 'pemilihan', label: 'Pemilihan Penyedia', progress: 0 },
      { key: 'kontrak', label: 'Penandatanganan Kontrak', progress: 0 },
      { key: 'pelaksanaan', label: 'Pelaksanaan Kontrak', progress: 0 },
      { key: 'serah_terima', label: 'Serah Terima Hasil', progress: 0 }
    ]
  }
}

/* =========================
   TEMPLATE DEFAULT
   ========================= */

export const WORKFLOW_TEMPLATE = {
  konsultan: WORKFLOW_KONSULTAN,
  konstruksi: WORKFLOW_KONSTRUKSI,
  pengadaan: WORKFLOW_PENGADAAN
}

/* =========================
   HELPER FUNCTIONS
   ========================= */

/**
 * Hitung progress dari satu kelompok step
 */
export function hitungProgressSteps(steps = []) {
  if (!steps.length) return 0
  const total = steps.reduce((sum, s) => sum + Number(s.progress || 0), 0)
  return Math.round(total / steps.length)
}

/**
 * Hitung progress global project
 * - Konsultan: rata-rata perencanaan & pengawasan
 * - Konstruksi / Pengadaan: langsung dari step utama
 */
export function hitungProgressProject(workflow = {}) {
  const groups = Object.values(workflow)
  if (!groups.length) return 0

  const groupProgress = groups.map(g =>
    hitungProgressSteps(g.steps || [])
  )

  const total = groupProgress.reduce((a, b) => a + b, 0)
  return Math.round(total / groupProgress.length)
}

/**
 * Normalisasi project lama
 * - Supaya tidak putih
 * - Tidak mengubah database
 */
export function normalizeWorkflow(project = {}) {
  const category = project.category || 'konsultan'
  const workflow =
    project.workflow && Object.keys(project.workflow).length > 0
      ? project.workflow
      : WORKFLOW_TEMPLATE[category]

  return {
    ...project,
    category,
    workflow
  }
}

/**
 * Cek apakah project BOLEH DIARSIPKAN
 */
export function bolehArsip({
  workflow,
  paymentStatus
}) {
  const progress = hitungProgressProject(workflow)
  return progress === 100 && paymentStatus === 'Pelunasan'
}

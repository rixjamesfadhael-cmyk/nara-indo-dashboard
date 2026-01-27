export const WORKFLOW_CONFIG = {
  konsultan: {
    label: 'Konsultan',
    subs: {
      perencanaan: {
        label: 'Perencanaan',
        steps: [
          'Persiapan & Pengumpulan Data',
          'Survey & Investigasi Lapangan',
          'Analisis Teknis',
          'Penyusunan Dokumen Perencanaan',
          'Review & Revisi',
          'Penyerahan Dokumen Perencanaan'
        ]
      },
      pengawasan: {
        label: 'Pengawasan',
        steps: [
          'Persiapan Pengawasan',
          'Monitoring Pelaksanaan Pekerjaan',
          'Pelaporan Berkala',
          'Evaluasi & Rekomendasi',
          'Laporan Akhir Pengawasan'
        ]
      }
    }
  },

  konstruksi: {
    label: 'Konstruksi',
    subs: null,
    steps: [
      'Persiapan Pelaksanaan',
      'Pelaksanaan Pekerjaan Fisik',
      'Pengendalian Mutu & Waktu',
      'Penyelesaian Pekerjaan',
      'Serah Terima Pekerjaan (PHO/FHO)'
    ]
  },

  pengadaan: {
    label: 'Pengadaan',
    subs: null,
    steps: [
      'Persiapan Pengadaan',
      'Proses Pemilihan Penyedia',
      'Evaluasi & Penetapan',
      'Kontrak & Pelaksanaan',
      'Serah Terima Barang/Jasa'
    ]
  }
}

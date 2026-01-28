export const WORKFLOW_CONFIG = {
  konsultan: {
    label: 'Konsultan',
    subs: {
      perencanaan: {
        label: 'Perencanaan',
        steps: [
          'Survei & Pengumpulan Data',
          'Penyusunan KAK',
          'DED / Gambar Teknis',
          'RAB & Spesifikasi Teknis'
        ]
      },
      pengawasan: {
        label: 'Pengawasan',
        steps: [
          'Persiapan Pengawasan',
          'Pengawasan Pelaksanaan',
          'Pelaporan & Evaluasi',
          'Pengendalian & Koordinasi',
          'Serah Terima & Akhir Kontrak'
        ]
      }
    }
  },

  konstruksi: {
    label: 'Konstruksi',
    steps: [
      'Persiapan Pekerjaan',
      'Pelaksanaan Pekerjaan',
      'Pengendalian Proyek',
      'Penyelesaian Pekerjaan',
      'Serah Terima Pekerjaan'
    ]
  },

  pengadaan: {
    label: 'Pengadaan',
    subs: {
      barang: {
        label: 'Barang',
        steps: [
          'Perencanaan Pengadaan',
          'Pemilihan Penyedia',
          'Kontrak',
          'Pelaksanaan Pengadaan',
          'Serah Terima Barang'
        ]
      },
      jasa: {
        label: 'Jasa',
        steps: [
          'Perencanaan Pengadaan',
          'Pemilihan Penyedia',
          'Kontrak',
          'Pelaksanaan Jasa',
          'Serah Terima Jasa'
        ]
      }
    }
  }
}

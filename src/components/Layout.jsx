export default function Layout({ sidebar, header, children, theme }) {
  const isDark = theme === 'dark'

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: isDark ? '#020617' : '#f8fafc',
        color: isDark ? '#e5e7eb' : '#0f172a'
      }}
    >
      <aside
        style={{
          width: 220,
          background: isDark ? '#020617' : '#0f172a',
          color: '#fff'
        }}
      >
        {sidebar}
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {header}
        <div style={{ padding: 20, overflow: 'auto' }}>{children}</div>
      </main>
    </div>
  )
}

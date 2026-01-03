export default function Header({ title, theme, toggleTheme }) {
  const isDark = theme === 'dark'

  return (
    <div
      style={{
        padding: '12px 20px',
        background: isDark ? '#020617' : '#ffffff',
        borderBottom: isDark ? '1px solid #1e293b' : '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: 18,
          color: isDark ? '#e5e7eb' : '#0f172a'
        }}
      >
        {title}
      </h1>

      <button
        onClick={toggleTheme}
        style={{
          padding: '6px 12px',
          borderRadius: 6,
          border: 'none',
          cursor: 'pointer',
          background: isDark ? '#1e293b' : '#e5e7eb'
        }}
      >
        {isDark ? '☀️ Light' : '🌙 Dark'}
      </button>
    </div>
  )
}

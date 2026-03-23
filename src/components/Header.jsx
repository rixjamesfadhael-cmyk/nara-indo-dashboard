export default function Header({ title, theme, toggleTheme }) {
  return (
    <div className="app-header">
      <h1>{title}</h1>
      <button className="theme-toggle" onClick={toggleTheme}>
        {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
      </button>
    </div>
  )
}
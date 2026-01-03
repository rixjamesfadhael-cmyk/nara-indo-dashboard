export default function Layout({ sidebar, header, children }) {
  return (
    <div style={app}>
      <div style={sidebarWrap}>{sidebar}</div>

      <div style={main}>
        <div style={headerWrap}>{header}</div>
        <div style={content}>{children}</div>
      </div>
    </div>
  )
}

const app = {
  display: 'flex',
  minHeight: '100vh'
}

/**
 * Sidebar WRAPPER
 * ❗ TIDAK ADA background di sini
 */
const sidebarWrap = {
  width: 220,
  flexShrink: 0
}

const main = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  background: '#f8fafc'
}

const headerWrap = {
  background: '#ffffff',
  borderBottom: '1px solid #e5e7eb',
  padding: '12px 20px'
}

const content = {
  flex: 1,
  padding: 24,
  overflowY: 'auto'
}

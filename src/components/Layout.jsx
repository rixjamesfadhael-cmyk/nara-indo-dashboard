export default function Layout({ sidebar, header, children }) {
  return (
    <>
      {sidebar}

      <div style={main}>
        <div style={headerWrap}>{header}</div>
        <div style={content}>{children}</div>
      </div>
    </>
  )
}

const main = {
  marginLeft: 64,        // ⬅️ kunci sidebar fixed
  minHeight: '100vh',
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
  padding: 24
}

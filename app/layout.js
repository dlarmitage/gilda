import './globals.css'

export const metadata = {
  title: 'Gilda - Virtual HR Assistant',
  description: 'AI-powered HR assistant with PDF handbook integration',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}


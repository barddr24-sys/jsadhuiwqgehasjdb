import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/app/components/theme/ThemeProvider';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: 'XSMB — Xổ Số Miền Bắc',
  description:
    'Kết quả Xổ Số Miền Bắc hôm nay. Tra cứu kết quả XSMB nhanh chóng, chính xác.',
  keywords: ['xổ số miền bắc', 'XSMB', 'kết quả xổ số', 'xsmb hôm nay'],
  authors: [{ name: 'XSMB App' }],
  robots: { index: true, follow: true },
  openGraph: {
    title: 'XSMB — Kết Quả Xổ Số Miền Bắc',
    description: 'Kết quả Xổ Số Miền Bắc hôm nay, tra cứu nhanh và chính xác.',
    locale: 'vi_VN',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F8FA' },
    { media: '(prefers-color-scheme: dark)',  color: '#090D16' },
  ],
};

const themeBootstrapScript = `
(function() {
  try {
    var theme = localStorage.getItem('theme_preference') || 'system';
    var fontSize = localStorage.getItem('font_size_preference') || '100%';
    var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(isDark ? 'dark' : 'light');
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-font-size', fontSize);
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className="flex flex-col min-h-full">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

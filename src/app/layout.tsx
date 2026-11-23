import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Guru Kashi University | Recruitment Management System',
  description: 'University Hiring & Recruitment Management Portal',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen text-slate-900 bg-[#f1f5f9]">
        {children}
      </body>
    </html>
  );
}

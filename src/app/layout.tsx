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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined' && window.fetch) {
                  var origFetch = window.fetch;
                  window.fetch = function(input, init) {
                    if (typeof input === 'string') {
                      if (input.startsWith('/api/')) {
                        input = '/recruitment' + input;
                      }
                    } else if (input && typeof input.url === 'string' && input.url.startsWith('/api/')) {
                      input = new Request('/recruitment' + input.url, input);
                    }
                    return origFetch.call(this, input, init);
                  };
                }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen text-slate-900 bg-[#f1f5f9]">
        {children}
      </body>
    </html>
  );
}

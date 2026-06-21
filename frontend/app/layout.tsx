import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import NavSidebar from '@/components/NavSidebar';
import { ViewProvider } from '@/context/ViewContext';
import './globals.css';

const JetBrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'RAG Benchmark Lab',
  description: 'Interactive RAG pipeline explorer',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${JetBrainsMono.variable} h-full antialiased text-neutral-800`}
    >
      <body className="h-full flex flex-col">
        <div className="flex flex-1 min-h-0">
          <NavSidebar />
          <ViewProvider>
            <div className="flex flex-1 min-h-0 min-w-0 overflow-x-auto">
              {children}
            </div>
          </ViewProvider>
        </div>
      </body>
    </html>
  );
}

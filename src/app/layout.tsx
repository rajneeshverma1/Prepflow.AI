import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

export const metadata: Metadata = {
  title: 'Prepflow.ai — AI-Powered LaTeX Resume Editor',
  description: 'AI-native resume builder. Create, tailor, and compile professional LaTeX resumes with Gemini AI and job description matching.',
  icons: {
    icon: '/favicon.jpg',
    apple: '/favicon.jpg',
  },
  openGraph: {
    title: 'Prepflow.ai — AI-Powered LaTeX Resume Editor',
    description: 'Tailor your resume to any job description with Gemini AI. ATS-ready LaTeX PDFs in seconds.',
    images: ['/favicon.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased selection:bg-[#7C5CFF]/20 selection:text-[#7C5CFF]">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

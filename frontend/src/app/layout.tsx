import type { Metadata } from"next";
import { Inter, Geist_Mono } from"next/font/google";
import"./globals.css";
import { AuthProvider } from"@/context/AuthContext";
import { ThemeProvider } from"@/context/ThemeContext";
import { Toaster } from"react-hot-toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title:"CareerCraft AI | Your AI Career Copilot",
  description:"Build resumes, discover jobs, learn in-demand skills, prepare for interviews, and get hired faster with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-200">
        <ThemeProvider>
          <AuthProvider>
            <Toaster position="top-right" />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

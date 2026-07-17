import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Pesquisa de Percepção da TI — Revalle",
  description: "Pesquisa anônima de percepção sobre a área de TI da Revalle",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50/50 text-slate-800 font-sans selection:bg-blue-500/10 selection:text-blue-600">
        {/* Subtle decorative glowing background blobs */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -top-[40%] -left-[20%] h-[80%] w-[60%] rounded-full bg-blue-500/5 blur-[120px]" />
          <div className="absolute -bottom-[30%] -right-[10%] h-[70%] w-[50%] rounded-full bg-indigo-500/5 blur-[100px]" />
        </div>
        <div className="relative z-10 flex min-h-full flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}

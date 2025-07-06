// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// IMPORTS MUI PRÉCÉDEMMENT, MAINTENANT REMPLACÉS PAR UN SEUL COMPOSANT CLIENT
// import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
// import { ThemeProvider } from "@mui/material/styles";
// import theme from "../styles/theme";
// import { Box } from '@mui/material'; // Si Box est utilisé ici, il faut l'importer. Sinon, un simple 'main' HTML.

// NOUVEL IMPORT DE VOTRE COMPOSANT WRAPPER CLIENT
import MuiThemeProvider from "../components/MuiThemeProvider";
import Navbar from "../components/Navbar"; // Votre Navbar sera à l'intérieur du ThemeProvider

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Poker Range App",
  description: "A visual poker range editor and trainer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* ENVELOPPER TOUT CE QUI UTILISE MUI AVEC LE WRAPPER CLIENT */}
        <MuiThemeProvider>
          <Navbar /> {/* Navbar est un composant client, donc il peut être ici */}
          <main style={{ padding: '20px' }}> {/* Ou <Box component="main" sx={{ padding: '20px' }}> si vous importez Box */}
            {children}
          </main>
        </MuiThemeProvider>
      </body>
    </html>
  );
}
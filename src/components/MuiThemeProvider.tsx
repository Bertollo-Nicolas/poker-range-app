// src/components/MuiThemeProvider.tsx
'use client'; // <-- CECI EST CRUCIAL ! Marque ce composant comme un composant client.
import * as React from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../styles/theme'; // Importe votre objet thème depuis le fichier dédié.

export default function MuiThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
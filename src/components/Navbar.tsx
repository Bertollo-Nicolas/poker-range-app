// src/components/Navbar.tsx
'use client'; // Indique que c'est un Client Component dans Next.js App Router
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppBar, Toolbar, Button, Typography, Box } from '@mui/material'; // Ou ChakraUI

export default function Navbar() {
  const pathname = usePathname();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Poker Range App
        </Typography>
        <Box>
          <Button color="inherit" component={Link} href="/editor"
            sx={{ textDecoration: pathname === '/editor' ? 'underline' : 'none' }}>
            Éditeur
          </Button>
          <Button color="inherit" component={Link} href="/trainer"
            sx={{ textDecoration: pathname === '/trainer' ? 'underline' : 'none' }}>
            Trainer
          </Button>
          <Button color="inherit" component={Link} href="/library"
            sx={{ textDecoration: pathname === '/library' ? 'underline' : 'none' }}>
            Bibliothèque
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
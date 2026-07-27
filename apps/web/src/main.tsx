import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import './styles/tokens.css';
import './styles/base.css';
import './styles/app.css';
import './styles/chart.css';
import './styles/ticket.css';
import './styles/pages.css';
import './styles/lab.css';
import './styles/ui.css';
import './styles/shell.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { App } from './App';
import { installErrorReporting } from './lib/telemetry';
import { navigate, usePath } from './lib/router';
import { arrive } from './lib/expand';
import { wagmiConfig } from './lib/wallet';
import { useApp } from './store/app';

installErrorReporting();
if (import.meta.env.DEV) (window as unknown as { __eko: typeof useApp }).__eko = useApp;
const queryClient = new QueryClient();

// "/" is the landing site (the EKO scroll story), served by the host and by vite.config.ts in dev. If the SPA is ever
// asked for "/" (no landing configured), it opens Radar. The previous marketing pages are retired.
const UI = import.meta.env.DEV ? lazy(() => import('./pages/UI')) : null;

function Root() {
  const path = usePath();
  if (import.meta.env.DEV && path === '/__ui' && UI) return <Suspense fallback={null}><UI /></Suspense>;
  if (path === '/') { queueMicrotask(() => navigate('/radar', true)); return null; }
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
arrive();

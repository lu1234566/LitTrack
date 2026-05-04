import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const rootElement = document.getElementById('root');

function renderFatalError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : '';

  if (!rootElement) return;

  rootElement.innerHTML = `
    <main style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0a;color:#f5f5f5;font-family:Arial, sans-serif;padding:24px;">
      <section style="max-width:760px;width:100%;background:#171717;border:1px solid #333;border-radius:24px;padding:28px;box-shadow:0 24px 80px rgba(0,0,0,.45);">
        <p style="margin:0 0 8px;color:#f59e0b;font-size:12px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;">Readora — modo de recuperação</p>
        <h1 style="margin:0 0 12px;font-size:28px;line-height:1.15;">O app encontrou um erro ao iniciar.</h1>
        <p style="margin:0 0 18px;color:#b3b3b3;line-height:1.55;">Esta tela substitui a tela branca para permitir identificar a causa do problema. Copie a mensagem abaixo para depuração.</p>
        <pre style="white-space:pre-wrap;word-break:break-word;background:#0a0a0a;border:1px solid #2a2a2a;border-radius:16px;padding:16px;color:#fca5a5;font-size:12px;max-height:260px;overflow:auto;">${message}\n\n${stack || ''}</pre>
        <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:18px;">
          <button onclick="location.reload()" style="border:0;border-radius:999px;background:#f59e0b;color:#0a0a0a;font-weight:800;padding:12px 18px;cursor:pointer;">Recarregar</button>
          <button onclick="localStorage.clear();sessionStorage.clear();location.reload()" style="border:1px solid #444;border-radius:999px;background:#111;color:#f5f5f5;font-weight:800;padding:12px 18px;cursor:pointer;">Limpar cache local</button>
        </div>
      </section>
    </main>
  `;
}

class AppErrorBoundary extends (await import('react')).Component<{ children: React.ReactNode }, { error: unknown }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  componentDidCatch(error: unknown) {
    console.error('[Readora Fatal Render Error]', error);
  }

  render() {
    if (this.state.error) {
      renderFatalError(this.state.error);
      return null;
    }

    return this.props.children;
  }
}

async function bootstrap() {
  try {
    if (!rootElement) {
      throw new Error('Elemento #root não encontrado no index.html.');
    }

    const React = await import('react');
    const { default: App } = await import('./App.tsx');

    createRoot(rootElement).render(
      <StrictMode>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </StrictMode>,
    );
  } catch (error) {
    console.error('[Readora Fatal Bootstrap Error]', error);
    renderFatalError(error);
  }
}

bootstrap();

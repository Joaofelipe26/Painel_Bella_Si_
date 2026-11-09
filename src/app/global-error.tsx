'use client';

/** Erro no layout raiz. Os estilos globais não carregam aqui, então as cores ficam no próprio arquivo. */
export default function ErroGeral({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          background: '#F7F3E8',
          color: '#24301A',
          fontFamily: 'system-ui, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 24,
          textAlign: 'center',
        }}
      >
        <title>Bella Si</title>
        <h1 style={{ fontSize: 22, margin: 0 }}>Não foi possível abrir o painel</h1>
        <p style={{ fontSize: 18, margin: 0 }}>Confira a internet do celular e toque no botão abaixo.</p>
        <button
          type="button"
          onClick={() => retry()}
          style={{
            minHeight: 56,
            padding: '0 24px',
            border: 'none',
            borderRadius: 12,
            background: '#3F5A1E',
            color: '#FFFFFF',
            fontSize: 18,
            fontWeight: 800,
          }}
        >
          Tentar de novo
        </button>
      </body>
    </html>
  );
}

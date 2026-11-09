import estilos from './Logo.module.css';

export function Logo({ tamanho = 30, claro = false }: { tamanho?: number; claro?: boolean }) {
  return (
    <span className={`${estilos.logo} ${claro ? estilos.claro : ''}`} style={{ fontSize: tamanho }}>
      Bella Si
    </span>
  );
}

import { MenuInferior } from '@/ui/MenuInferior';
import estilos from './painel.module.css';

export default function LayoutPainel({ children }: LayoutProps<'/'>) {
  return (
    <div className={estilos.painel}>
      {children}
      <MenuInferior />
    </div>
  );
}

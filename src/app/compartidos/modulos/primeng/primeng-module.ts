// Exportaciones centralizadas de módulos PrimeNG para tree-shaking óptimo
// Importar solo lo que necesites en cada componente

export { ButtonModule } from 'primeng/button';
export { MenubarModule } from 'primeng/menubar';
export { MenuModule } from 'primeng/menu';
export { CardModule } from 'primeng/card';
export { ProgressSpinnerModule } from 'primeng/progressspinner';
export { RippleModule } from 'primeng/ripple';
export { DialogModule } from 'primeng/dialog';

// Re-exportación para compatibilidad con imports existentes
import { ButtonModule } from 'primeng/button';
import { MenubarModule } from 'primeng/menubar';
import { MenuModule } from 'primeng/menu';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RippleModule } from 'primeng/ripple';
import { DialogModule } from 'primeng/dialog';

export const PrimengModule = [
  ButtonModule,
  MenubarModule,
  MenuModule,
  CardModule,
  ProgressSpinnerModule,
  RippleModule,
  DialogModule,
] as const;
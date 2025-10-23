// Exportaciones centralizadas de módulos PrimeNG para tree-shaking óptimo
// Importar solo lo que necesites en cada componente

export { ButtonModule } from 'primeng/button';
export { MenubarModule } from 'primeng/menubar';
export { MenuModule } from 'primeng/menu';
export { CardModule } from 'primeng/card';

// Re-exportación para compatibilidad con imports existentes
import { ButtonModule } from 'primeng/button';
import { MenubarModule } from 'primeng/menubar';
import { MenuModule } from 'primeng/menu';
import { CardModule } from 'primeng/card';

export const PrimengModule = [
  ButtonModule,
  MenubarModule,
  MenuModule,
  CardModule,
] as const;
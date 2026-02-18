// Exportaciones centralizadas de módulos PrimeNG para tree-shaking óptimo
// Importar solo lo que necesites en cada componente

export { ButtonModule } from 'primeng/button';
export { MenubarModule } from 'primeng/menubar';
export { MenuModule } from 'primeng/menu';
export { CardModule } from 'primeng/card';
export { ProgressSpinnerModule } from 'primeng/progressspinner';
export { RippleModule } from 'primeng/ripple';
export { DialogModule } from 'primeng/dialog';
export { TagModule } from 'primeng/tag';
export { InputTextModule } from 'primeng/inputtext';
export { TextareaModule } from 'primeng/textarea';
export { DatePickerModule } from 'primeng/datepicker';
export { InputNumberModule } from 'primeng/inputnumber';
export { SelectModule } from 'primeng/select';
export { MultiSelectModule } from 'primeng/multiselect';
export { AutoCompleteModule } from 'primeng/autocomplete';
export { ToggleSwitchModule } from 'primeng/toggleswitch';
export { FluidModule } from 'primeng/fluid';
export { TabsModule } from 'primeng/tabs';
export { TableModule } from 'primeng/table';
export { ToastModule } from 'primeng/toast';
export { ConfirmDialogModule } from 'primeng/confirmdialog';
export { MessageModule } from 'primeng/message';

// Re-exportación para compatibilidad con imports existentes
import { ButtonModule } from 'primeng/button';
import { MenubarModule } from 'primeng/menubar';
import { MenuModule } from 'primeng/menu';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RippleModule } from 'primeng/ripple';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FluidModule } from 'primeng/fluid';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule } from 'primeng/message';

export const PrimengModule = [
  ButtonModule,
  MenubarModule,
  MenuModule,
  CardModule,
  ProgressSpinnerModule,
  RippleModule,
  DialogModule,
  TagModule,
  InputTextModule,
  TextareaModule,
  DatePickerModule,
  InputNumberModule,
  SelectModule,
  MultiSelectModule,
  AutoCompleteModule,
  ToggleSwitchModule,
  FluidModule,
  TabsModule,
  TableModule,
  ToastModule,
  ConfirmDialogModule,
  MessageModule,
] as const;

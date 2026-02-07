import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  InputSignal,
  OutputEmitterRef,
  Signal,
  computed
} from '@angular/core';
import { PrimengModule } from '@modulos/primeng/primeng-module';
import { AuthService } from '../../../core/servicios/auth.service';

@Component({
  selector: 'lt-dialogo-login',
  imports: [PrimengModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dialogo-login.html',
  styleUrl: './dialogo-login.scss'
})
export class DialogoLogin {
  private readonly authService: AuthService = inject(AuthService);

  readonly visible: InputSignal<boolean> = input<boolean>(false);
  readonly visibleChange: OutputEmitterRef<boolean> = output<boolean>();

  readonly cargando: Signal<boolean> = computed(() => this.authService.cargando());
  readonly error: Signal<string | null> = computed(() => this.authService.error());

  async loginConGoogle(): Promise<void> {
    await this.authService.loginConGoogle();

    if (this.authService.estaAutenticado()) {
      this.cerrarDialogo();
    }
  }

  cerrarDialogo(): void {
    this.authService.limpiarError();
    this.visibleChange.emit(false);
  }

  onHide(): void {
    this.authService.limpiarError();
    this.visibleChange.emit(false);
  }
}

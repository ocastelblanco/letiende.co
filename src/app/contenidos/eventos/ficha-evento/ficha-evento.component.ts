import { Component, Inject, Input, Optional, effect } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { DataService, Evento } from 'src/app/servicios/data.service';
import { IconDefinition, faInstagram, faTiktok } from '@fortawesome/free-brands-svg-icons';
import { faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'lt-ficha-evento',
  templateUrl: './ficha-evento.component.html',
  styleUrls: ['./ficha-evento.component.scss']
})
export class FichaEventoComponent {
  @Input() evento: Evento = {} as Evento;
  @Input() year: boolean = false;
  info: IconDefinition = faCircleInfo;
  ig: IconDefinition = faInstagram;
  tiktok: IconDefinition = faTiktok;
  registro: IconDefinition = faPenToSquare;
  interfaz: any;
  idioma: string = 'es';
  constructor(@Optional() @Inject(DIALOG_DATA) public _evento: Evento, private data: DataService, @Optional() public esteDialogo: DialogRef) {
    if (this._evento) this.evento = this._evento;
    effect(() => this.idioma = this.data.idioma());
    this.data.getInterfaz().subscribe(((interfaz: any) => interfaz.eventos ? this.interfaz = interfaz.eventos : null));
  }
  cierraDialogo(): void {
    this.esteDialogo.close();
  }
  portadaDefecto(): string {
    return this.evento.portada.length ? this.evento.portada : this.data.rutas.imgs + 'eventos_generica.png';
  }
}

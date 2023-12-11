import { Component, Inject, effect } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { DataService, Evento } from 'src/app/servicios/data.service';
import { IconDefinition, faInstagram, faTiktok } from '@fortawesome/free-brands-svg-icons';
import { faPenToSquare, faFaceGrinBeamSweat } from '@fortawesome/free-regular-svg-icons';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'lt-ficha-evento',
  templateUrl: './ficha-evento.component.html',
  styleUrls: ['./ficha-evento.component.scss']
})
export class FichaEventoComponent {
  info: IconDefinition = faCircleInfo;
  ig: IconDefinition = faInstagram;
  tiktok: IconDefinition = faTiktok;
  registro: IconDefinition = faPenToSquare;
  doh: IconDefinition = faFaceGrinBeamSweat;
  interfaz: any;
  idioma: string = 'es';
  constructor(@Inject(DIALOG_DATA) public evento: Evento, private data: DataService, public esteDialogo: DialogRef) {
    effect(() => this.idioma = this.data.idioma());
    this.data.getInterfaz().subscribe(((interfaz: any) => interfaz.eventos ? this.interfaz = interfaz.eventos : null));
  }
  cierraDialogo(): void {
    this.esteDialogo.close();
  }
}

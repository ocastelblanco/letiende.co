import { Component, Inject, Input, Optional } from '@angular/core';
import { Disco } from 'src/app/servicios/data.service';
import {
  IconDefinition,
  faRecordVinyl,
  faGuitar,
  faGauge,
  faSackDollar,
  faMapLocation,
  faCalendarDay,
  faMusic,
  faListCheck
} from '@fortawesome/free-solid-svg-icons';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

@Component({
  selector: 'lt-ficha-disco',
  templateUrl: './ficha-disco.component.html',
  styleUrls: ['./ficha-disco.component.scss']
})
export class FichaDiscoComponent {
  @Input() disco!: Disco;
  @Input() contenidoVisible: boolean = true;
  modal: boolean = false;
  album: IconDefinition = faRecordVinyl;
  artista: IconDefinition = faGuitar;
  estado: IconDefinition = faGauge;
  valor: IconDefinition = faSackDollar;
  origen: IconDefinition = faMapLocation;
  anno: IconDefinition = faCalendarDay;
  genero: IconDefinition = faMusic;
  descripcion: IconDefinition = faListCheck;
  constructor(@Optional() @Inject(DIALOG_DATA) private data: Disco, @Optional() public esteDialogo: DialogRef) {
    if (this.data) {
      this.disco = this.data;
      this.modal = true;
    }
  }
}

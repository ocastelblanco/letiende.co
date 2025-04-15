import { Component, effect, OnInit } from '@angular/core';
import { DataService } from 'src/app/servicios/data.service';
import { IconDefinition, faWhatsapp } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'lt-cotizacion',
  templateUrl: './cotizacion.component.html',
  styleUrl: './cotizacion.component.scss'
})
export class CotizacionComponent implements OnInit {
  idioma: string = 'es';
  interfaz: any;
  wa: IconDefinition = faWhatsapp;
  constructor(private data: DataService) {
    effect(() => this.idioma = this.data.idioma());
  }
  ngOnInit(): void {
    this.data.getInterfaz().subscribe((interfaz: any) => this.interfaz = interfaz.auditorio.cotizacion);
  }
}

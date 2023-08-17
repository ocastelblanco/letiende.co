import { Component, OnInit } from '@angular/core';
import { DataService, Evento } from 'src/app/servicios/data.service';
import { IconDefinition, faInstagram, faTiktok } from '@fortawesome/free-brands-svg-icons';
import { faPenToSquare } from '@fortawesome/free-regular-svg-icons';

@Component({
  selector: 'lt-eventos',
  templateUrl: './eventos.component.html',
  styleUrls: ['./eventos.component.scss']
})
export class EventosComponent implements OnInit {
  eventos: Evento[] = [];
  ig: IconDefinition = faInstagram;
  tiktok: IconDefinition = faTiktok;
  registro: IconDefinition = faPenToSquare;
  hoy: Date = new Date();
  constructor(private data: DataService) { }
  ngOnInit(): void {
    this.data.getEventos().subscribe((eventos: Evento[]) => this.eventos = eventos);
  }
}

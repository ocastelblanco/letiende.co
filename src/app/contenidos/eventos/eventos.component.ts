import { Component, OnInit } from '@angular/core';
import { DataService, Evento } from 'src/app/servicios/data.service';

@Component({
  selector: 'lt-eventos',
  templateUrl: './eventos.component.html',
  styleUrls: ['./eventos.component.scss']
})
export class EventosComponent implements OnInit {
  eventos: Evento[] = [];
  constructor(private data: DataService) { }
  ngOnInit(): void {
    this.data.getEventos().subscribe((eventos: Evento[]) => this.eventos = eventos);
  }
}

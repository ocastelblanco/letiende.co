import { Component, OnInit, effect } from '@angular/core';
import { DataService, Evento } from 'src/app/servicios/data.service';
import { IconDefinition, faInstagram, faTiktok } from '@fortawesome/free-brands-svg-icons';
import { faPenToSquare, faFaceGrinBeamSweat } from '@fortawesome/free-regular-svg-icons';
import { faCircleInfo, faUpRightAndDownLeftFromCenter } from '@fortawesome/free-solid-svg-icons';
import { trigger, stagger, query, style, animate, transition } from '@angular/animations';
import { FichaEventoComponent } from './ficha-evento/ficha-evento.component';
import { Dialog } from '@angular/cdk/dialog';

@Component({
  selector: 'lt-eventos',
  templateUrl: './eventos.component.html',
  styleUrls: ['./eventos.component.scss'],
  animations: [
    trigger('eventos', [
      transition(':enter', [
        query('.evento', [
          style({ opacity: 0, transform: 'translateY(-100px)' }),
          stagger(350, [
            animate('750ms cubic-bezier(0.35, 0, 0.25, 1)',
              style({ opacity: 1, transform: 'none' }))
          ])
        ])
      ])
    ]),
  ]
})
export class EventosComponent implements OnInit {
  eventos: Evento[] = [];
  info: IconDefinition = faCircleInfo;
  ig: IconDefinition = faInstagram;
  tiktok: IconDefinition = faTiktok;
  registro: IconDefinition = faPenToSquare;
  doh: IconDefinition = faFaceGrinBeamSweat;
  expande: IconDefinition = faUpRightAndDownLeftFromCenter;
  hoy: Date = new Date();
  idioma: string = 'es';
  interfaz: any;
  unDia: number = 24 * 60 * 60 * 1000;
  mes: Date = new Date(this.hoy.getFullYear(), this.hoy.getMonth(), 1);
  semanas!: Array<Date[]>;
  modoVista: string = 'eventos';
  constructor(private data: DataService, public fichaEvento: Dialog) {
    effect(() => this.idioma = this.data.idioma());
    this.calculaCalendario();
  }
  calculaCalendario(cambio: number = 0): void {
    let anno: number, mes: number;
    if (cambio == -1 && this.mes.getMonth() == 0) {
      anno = this.mes.getFullYear() - 1;
      mes = 11;
    } else if (cambio == 1 && this.mes.getMonth() == 11) {
      anno = this.mes.getFullYear() + 1;
      mes = 0;
    } else {
      anno = this.mes.getFullYear();
      mes = this.mes.getMonth() + cambio;
    }
    this.mes = new Date(anno, mes, 1);
    let inicioCalendario: Date = new Date(this.mes.getTime() - (this.mes.getDay() * this.unDia));
    let finCalendario: Date = new Date(anno, mes + 1, 0);
    finCalendario.setTime(finCalendario.getTime() + ((6 - finCalendario.getDay()) * this.unDia));
    let semana: Date[] = [], cont: number = inicioCalendario.getTime();
    this.semanas = [];
    while (cont <= finCalendario.getTime()) {
      semana.push(new Date(cont));
      if (new Date(cont).getDay() == 6) {
        this.semanas.push(semana);
        semana = [];
      }
      cont += this.unDia;
    }
  }
  ngOnInit(): void {
    this.data.getEventos().subscribe((eventos: Evento[]) => this.eventos = eventos);
    this.data.getInterfaz().subscribe(((interfaz: any) => interfaz.eventos ? this.interfaz = interfaz.eventos : null));
  }
  hayEventos(): boolean {
    return this.eventos.find((evento: Evento) => evento.fecha > this.hoy) ? true : false;
  }
  textoSiguenos(): string {
    const ext: RegExp = /\{\{[^\{]*\}\}/gm;
    const pares: string[] = this.interfaz.siguenos[this.idioma].split(ext);
    const impares: string[] = this.interfaz.siguenos[this.idioma].match(ext).map((cadena: string) => {
      let texto: string = cadena.replace(/[\{\}]/g, '');
      let url: string = '';
      let tipoVinculo: string = '';
      switch (texto) {
        case 'IG':
          url = 'https://www.instagram.com/letiende_parkway';
          tipoVinculo = 'vinculo externo';
          break;
        case 'TikTok':
          url = 'https://www.tiktok.com/@letiende_parkway';
          tipoVinculo = 'vinculo externo';
          break;
        default:
          url = 'https://www.letiende.co/registro';
          tipoVinculo = 'vinculo';
          break;
      }
      texto = ' ' + texto;
      return `<a class="${tipoVinculo}" target="_blank" href="${url}">${texto}</a>`;
    });
    // Tomado de https://stackoverflow.com/questions/47061160/merge-two-arrays-with-alternating-values
    const completo: any = ([x, ...xs]: string[], ys: string[] = []) => x === undefined ? ys : [x, ...completo(ys, xs)];
    return completo(pares, impares).join('');
  }
  esHoy(dia: Date): boolean {
    return Math.abs(dia.getTime() - this.hoy.getTime()) < this.unDia && dia.getDate() == this.hoy.getDate();
  }
  eventosDia(dia: Date): Evento[] {
    return this.eventos.filter((ev: Evento) => ev.fecha.toDateString() == dia.toDateString());
  }
  abreFichaEvento(evento: Evento): void {
    this.fichaEvento.open(FichaEventoComponent, { data: evento });
  }
}
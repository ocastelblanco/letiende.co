import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

export interface Menu {
  id: number;
  padre: number;
  posicion: number;
  titulo: string;
  descripcion: string;
  valor: number;
  visible: boolean;
  imagen: string;
  tipo: string;
}
export interface Evento {
  nombre: string;
  descripcion: string;
  portada: string;
  fecha: Date;
  ig: string;
  tiktok: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private rutaJson: string = 'https://script.google.com/macros/s/AKfycbzAgKjUUqb_xqVjIU6ci_egsJhPPc3bpn5V7mKJWKW6yEt-PrvmDcRlm7f429cw0F4/exec';
  private menu: BehaviorSubject<Menu[]> = new BehaviorSubject<Menu[]>([]);
  private eventos: BehaviorSubject<Evento[]> = new BehaviorSubject<Evento[]>([]);
  constructor(private http: HttpClient) { }
  init(): void {
    this.http.get(this.rutaJson + '?pagina=menu', { responseType: 'json' })
      .subscribe((resp: any) => {
        const menu: Menu[] = [];
        resp.forEach((el: any) => menu.push({
          id: el[0],
          padre: el[1],
          posicion: el[2],
          titulo: el[3],
          descripcion: el[4],
          imagen: el[5],
          valor: el[6],
          tipo: el[7]
        }));
        this.menu.next(menu);
      });
    this.http.get(this.rutaJson + '?pagina=eventos', { responseType: 'json' })
      .subscribe((resp: any) => {
        const eventos: Evento[] = [];
        resp.forEach((el: any) => eventos.push({
          nombre: el[0],
          descripcion: el[1],
          portada: el[2],
          fecha: new Date(el[3]),
          ig: el[4],
          tiktok: el[5]
        }));
        this.eventos.next(eventos);
      });
  }
  getMenu(): BehaviorSubject<Menu[]> {
    return this.menu;
  }
  getEventos(): BehaviorSubject<Evento[]> {
    return this.eventos;
  }
}

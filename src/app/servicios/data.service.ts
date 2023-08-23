import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Router, RouterEvent, NavigationEnd } from '@angular/router';
import { environment } from '../../environments/environment';

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
  registro: string;
}

declare var gtag: any;

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private rutaJson: string = 'https://script.google.com/macros/s/AKfycbzAgKjUUqb_xqVjIU6ci_egsJhPPc3bpn5V7mKJWKW6yEt-PrvmDcRlm7f429cw0F4/exec';
  private menu: BehaviorSubject<Menu[]> = new BehaviorSubject<Menu[]>([]);
  private eventos: BehaviorSubject<Evento[]> = new BehaviorSubject<Evento[]>([]);
  constructor(private http: HttpClient, private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((e) => {
      gtag('js', new Date());
      gtag('config', environment.googleAnalytics);
    });
  }
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
          valor: el[5],
          visible: el[6],
          imagen: el[7],
          tipo: el[8]
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
          tiktok: el[5],
          registro: el[6]
        }));
        this.eventos.next(eventos);
      });
    this.initGA();
  }
  getMenu(): BehaviorSubject<Menu[]> {
    return this.menu;
  }
  getEventos(): BehaviorSubject<Evento[]> {
    return this.eventos;
  }
  initGA() {
    const script: HTMLScriptElement = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + environment.googleAnalytics;
    script.async = true;
    document.getElementsByTagName('head')[0].appendChild(script);
    const gtagEl: HTMLScriptElement = document.createElement('script');
    const gtagBody: Text = document.createTextNode(`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
    `);
    gtagEl.appendChild(gtagBody);
    document.body.appendChild(gtagEl);
  }
}

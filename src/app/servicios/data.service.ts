import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Router, NavigationEnd } from '@angular/router';
import { environment } from '../../environments/environment';
import { DOCUMENT } from '@angular/common';


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
  link: string;
  ig: string;
  tiktok: string;
  registro: string;
}
export interface SEO {
  pagina?: string;
  titulo: string;
  descripcion: string;
  keywords: string[];
}
export interface Disco {
  album: string;
  artista: string;
  estado: string;
  barcode: string;
  valor: number;
  visible: boolean;
  origen?: string;
  anno?: string;
  genero?: string[];
  cover?: string;
  descripcion?: string;
}

declare let gtag: any;

@Injectable({
  providedIn: 'root'
})
export class DataService {
  public rutaJson: string = 'https://script.google.com/macros/s/AKfycbzAgKjUUqb_xqVjIU6ci_egsJhPPc3bpn5V7mKJWKW6yEt-PrvmDcRlm7f429cw0F4/exec?pagina=';
  private rutaAPI: string = 'https://api.letiende.co/';
  private menu: BehaviorSubject<Menu[]> = new BehaviorSubject<Menu[]>([]);
  private eventos: BehaviorSubject<Evento[]> = new BehaviorSubject<Evento[]>([]);
  private SEO: BehaviorSubject<SEO[]> = new BehaviorSubject<SEO[]>([]);
  private discos: BehaviorSubject<Disco[]> = new BehaviorSubject<Disco[]>([]);
  constructor(private http: HttpClient, private router: Router, @Inject(DOCUMENT) private doc: Document) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((e) => {
      gtag('js', new Date());
      gtag('config', environment.googleAnalytics);
    });
  }
  init(): void {
    this.http.get(this.rutaJson + 'SEO', { responseType: 'json' })
      .subscribe((resp: any) => {
        const seo: SEO[] = [];
        resp.forEach((linea: string[]) => seo.push({ pagina: linea[0], titulo: linea[1], descripcion: linea[2], keywords: this.separaKeywords(linea[3]) }));
        this.SEO.next(seo);
      });
    this.http.get(this.rutaJson + 'menu', { responseType: 'json' })
      .subscribe((resp: any) => {
        const menu: Menu[] = [];
        resp.forEach((el: any) => menu.push({
          id: el[0],
          padre: el[1],
          posicion: el[2],
          titulo: el[3],
          descripcion: el[4],
          valor: el[5],
          visible: el[6].toLowerCase() == 'si' ? true : false,
          imagen: el[7],
          tipo: el[8]
        }));
        this.menu.next(menu);
      });
    this.http.get(this.rutaJson + 'eventos', { responseType: 'json' })
      .subscribe((resp: any) => {
        const eventos: Evento[] = [];
        resp.forEach((el: any) => eventos.push({
          nombre: el[0],
          descripcion: el[1],
          portada: el[2],
          fecha: new Date(el[3]),
          link: el[4],
          ig: el[5],
          tiktok: el[6],
          registro: el[7]
        }));
        this.eventos.next(eventos);
      });
    this.initGA();
  }
  getSEO(): BehaviorSubject<SEO[]> {
    return this.SEO;
  }
  getMenu(): BehaviorSubject<Menu[]> {
    return this.menu;
  }
  getEventos(): BehaviorSubject<Evento[]> {
    return this.eventos;
  }
  initGA(): void {
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
  creaURLCanonica(): void {
    const lista: NodeList = document.querySelectorAll('link[rel="canonical"]');
    for (let i: number = 0; i < lista.length; i++) {
      const elemento: HTMLLinkElement = lista[i] as HTMLLinkElement;
      elemento.remove();
    }
    const link: HTMLLinkElement = this.doc.createElement('link');
    link.setAttribute('rel', 'canonical');
    this.doc.head.appendChild(link);
    link.setAttribute('href', this.doc.URL);
  }
  separaKeywords(cadena: string): string[] {
    const regExp: RegExp = /[,\.;:-_]/gm;
    return cadena.split(regExp).map((el: string) => el.trim());
  }
  getDiscos(): BehaviorSubject<Disco[]> {
    this.http.get(this.rutaJson + 'discos', { responseType: 'json' })
      .subscribe((resp: any) => {
        const _discos: Disco[] = [];
        resp.forEach((disco: any[]) => {
          const _disco: Disco = {
            album: disco[0],
            artista: disco[1],
            estado: disco[2],
            barcode: disco[3],
            valor: disco[4],
            visible: disco[5].toLowerCase() == 'si'
          };
          _discos.push(_disco);
        });
        this.discos.next(_discos);
      });
    return this.discos;
  }
  getDiscoInfo(album: string, artista: string, barcode: string | null = null): Observable<any> {
    const query: string = 'album=' + album + '&artista=' + artista;
    const bcode: string = barcode ? '&barcode=' + barcode : '';
    return this.http.get(this.rutaAPI + 'discogs?' + query + bcode);
  }
}

import { Injectable, Inject, inject, signal, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Router, NavigationEnd } from '@angular/router';
import { environment } from '../../environments/environment';
import { DOCUMENT } from '@angular/common';
import { ListResult, Storage, StorageReference, UploadResult, getDownloadURL, listAll, ref, uploadBytes } from '@angular/fire/storage';

export interface Menu {
  id: number;
  padre: number;
  posicion: number;
  titulo: any;
  descripcion: any;
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
export interface PortadaDisco {
  barcode: string;
  cover?: string;
}
export interface Disco extends PortadaDisco {
  album: string;
  artista: string;
  estado: string;
  valor: number;
  visible: boolean;
  origen?: string;
  anno?: string;
  genero?: string[];
  descripcion?: string;
}
export interface Libro {
  nombre: string;
  barcode: string;
  valor: number;
  visible: boolean;
  autores?: string[];
  titulo?: string;
  subtitulo?: string;
  descripcion?: string;
  editorial?: string;
  fecha?: Date;
  numPaginas?: number;
  categorias?: string[];
  idioma?: string;
  portada?: string;
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
  private libros: BehaviorSubject<Libro[]> = new BehaviorSubject<Libro[]>([]);
  private storage: Storage = inject(Storage);
  private portadas: BehaviorSubject<PortadaDisco[]> = new BehaviorSubject<PortadaDisco[]>([]);
  private interfaz: BehaviorSubject<any> = new BehaviorSubject<any>({});
  public idioma: WritableSignal<string> = signal('es');
  constructor(private http: HttpClient, private router: Router, @Inject(DOCUMENT) private doc: Document) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((e) => {
      gtag('js', new Date());
      gtag('config', environment.googleAnalytics);
    });
  }
  init(): void {
    this.http.get('assets/datos/interfaz.json', { responseType: 'json' })
      .subscribe((resp: any) => this.interfaz.next(resp));
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
          titulo: { es: el[3], en: el[9] },
          descripcion: { es: el[4], en: el[10] },
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
  getInterfaz(): BehaviorSubject<any> {
    return this.interfaz;
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
    const resDiscos: any = this.http.get(this.rutaJson + 'discos', { responseType: 'json' })
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
        resDiscos.unsubscribe();
      });
    return this.discos;
  }
  getDiscoInfo(album: string, artista: string, barcode: string | null = null): Observable<any> {
    const query: string = 'album=' + encodeURIComponent(album) + '&artista=' + encodeURIComponent(artista);
    const bcode: string = barcode ? '&barcode=' + barcode : '';
    return this.http.get(this.rutaAPI + 'discogs?' + query + bcode);
  }
  getPortadas(): BehaviorSubject<PortadaDisco[]> {
    const listRef: StorageReference = ref(this.storage, 'discos/portadas');
    const portadas: PortadaDisco[] = [];
    listAll(listRef).then((res: ListResult) => {
      const total: number = res.items.length;
      res.items.forEach((item: StorageReference, index: number) => {
        const barcode: string = item.name.substring(0, item.name.indexOf('.'));
        getDownloadURL(item).then((url: string) => {
          portadas.push({ barcode: barcode, cover: url });
          if (index >= (total - 1)) this.portadas.next(portadas);
        });
      });
    });
    return this.portadas;
  }
  putPortada(archivo: string, url: string): BehaviorSubject<string> {
    const ruta: BehaviorSubject<string> = new BehaviorSubject<string>('');
    const getCoverDiscogs: string | null = this.rutaAPI + 'coverDiscogs?cover=' + url;
    this.http.get(getCoverDiscogs, { responseType: 'json' }).subscribe((resp: any) => {
      if (resp.err || resp.rateLimit) console.log(resp.rateLimit, resp.err);
      const blob: Blob = this.convertBinaryToBlob(resp.data);
      const subida: StorageReference = ref(this.storage, 'discos/portadas/' + archivo);
      uploadBytes(subida, blob).then((res: UploadResult) => getDownloadURL(res.ref).then((_ruta: string) => ruta.next(_ruta)));
    });
    return ruta;
  }
  getLibros(): BehaviorSubject<Libro[]> {
    const resLibros: any = this.http.get(this.rutaJson + 'libros', { responseType: 'json' })
      .subscribe((resp: any) => {
        const _libros: Libro[] = [];
        resp.forEach((libro: any[]) => {
          const _libro: Libro = {
            nombre: libro[0],
            barcode: libro[1],
            valor: libro[2],
            visible: libro[3].toLowerCase() == 'si',
          };
          _libros.push(_libro);
        });
        this.libros.next(_libros);
        resLibros.unsubscribe();
      });
    return this.libros;
  }
  getLibroInfo(libro: Libro): Observable<any> {
    const query: string = libro.barcode ? 'barcode=' + libro.barcode : 'titulo=' + libro.nombre;
    return this.http.get(this.rutaAPI + 'libros?' + query);
  }
  convertBinaryToBlob(binary: string, contentType: string = 'image/jpeg'): Blob {
    const uInt8Array: Uint8Array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) uInt8Array[i] = binary.charCodeAt(i);
    return new Blob([uInt8Array], { type: contentType });
  };
}

import { Component, OnInit, effect } from '@angular/core';
import { Subscription } from 'rxjs';
import { DataService, Disco, PortadaDisco } from 'src/app/servicios/data.service';
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

interface RangoNum {
  minimo: number;
  maximo: number;
}
interface Filtros {
  artistas: string[];
  estados: string[];
  generos: string[];
  rangoPrecios: RangoNum;
}

@Component({
  selector: 'lt-discos',
  templateUrl: './discos.component.html',
  styleUrls: ['./discos.component.scss']
})
export class DiscosComponent implements OnInit {
  discos: Disco[] = [];
  album: IconDefinition = faRecordVinyl;
  artista: IconDefinition = faGuitar;
  estado: IconDefinition = faGauge;
  valor: IconDefinition = faSackDollar;
  origen: IconDefinition = faMapLocation;
  anno: IconDefinition = faCalendarDay;
  genero: IconDefinition = faMusic;
  descripcion: IconDefinition = faListCheck;
  idioma: string = 'es';
  interfaz: any;
  filtros: Filtros = {
    artistas: [],
    estados: [],
    rangoPrecios: {
      minimo: 0,
      maximo: 0
    },
    generos: []
  };
  constructor(private data: DataService) {
    effect(() => this.idioma = this.data.idioma());
  }
  ngOnInit(): void {
    this.data.getInterfaz().subscribe(((interfaz: any) => interfaz.discos ? this.interfaz = interfaz.discos : null));
    const _getPortadas: Subscription = this.data.getPortadas().subscribe((portadas: PortadaDisco[]) => {
      if (portadas.length > 0) {
        _getPortadas.unsubscribe();
        const _getDiscos: Subscription = this.data.getDiscos().subscribe((_discos: Disco[]) => {
          if (_discos.length > 0) {
            _getDiscos.unsubscribe();
            this.discos = _discos;
            this.discos.sort((a: Disco, b: Disco) => {
              if (a.artista < b.artista) return -1;
              if (a.artista > b.artista) return 1;
              return 0;
            });
            this.discos.forEach((disco: Disco) => {
              this.data.getDiscoInfo(disco.album, disco.artista, disco.barcode.substring(0, 3) != 'LTD' ? disco.barcode : null)
                .subscribe((resp: any) => {
                  const formato: any = resp.formats ?
                    resp.formats.find((frm: any) => frm.name == 'Vinyl') :
                    { qty: '1 LP', descriptions: [] };
                  const descripcion: string = formato.qty + ' ' + formato.descriptions.join(', ');
                  const _portada: PortadaDisco | undefined = portadas.find((portada: PortadaDisco) => disco.barcode == portada.barcode);
                  disco.origen = resp.country;
                  disco.anno = resp.year;
                  disco.genero = resp.genre;
                  disco.cover = _portada ? _portada.cover : undefined;
                  disco.descripcion = descripcion;
                  this.filtros.artistas = this.generaListado('artista');
                  this.filtros.estados = this.generaListado('estado');
                  this.filtros.generos = this.generaListado('genero');
                  if (!_portada) {
                    let extension: string = resp.cover_image.substring(resp.cover_image.lastIndexOf('.') + 1);
                    extension = extension == 'jpeg' ? 'jpg' : extension;
                    const archivo: string = disco.barcode + '.' + extension;
                    const putPortada: Subscription = this.data.putPortada(archivo, resp.cover_image).subscribe((url: string) => {
                      if (url != '') {
                        disco.cover = url;
                        putPortada.unsubscribe();
                      }
                    });
                  }
                });
            });
          }
        });
      }
    });
  }
  generaListado(campo: string): string[] {
    const salida: string[] = [];
    this.discos
      .filter((disco: Disco) => disco.visible)
      .map((disco: Disco) => {
        const _disco: any = disco;
        return _disco[campo];
      })
      .forEach((elemento: any) => {
        if (elemento && typeof elemento == 'object') {
          elemento.forEach((genero: string) => {
            if (!salida.includes(genero)) salida.push(genero);
          });
        }
        if (elemento && typeof elemento == 'string' && !salida.includes(elemento)) salida.push(elemento);
      });
    return salida.sort((a: string, b: string) => {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    });
  }
  listadoKeyObj(obj: any): string[] {
    return Object.keys(obj);
  }
  valObj(obj: any, key: string): string[] {
    const _obj: any = obj as any;
    return _obj[key];
  }
  esArray(obj: any, key: string): boolean {
    return this.valObj(obj, key).constructor.name == 'Array';
  }
}

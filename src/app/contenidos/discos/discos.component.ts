import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { DataService, Disco, PortadaDisco } from 'src/app/servicios/data.service';
import { IconDefinition, faRecordVinyl, faGuitar, faGauge, faSackDollar, faMapLocation, faCalendarDay, faMusic, faListCheck } from '@fortawesome/free-solid-svg-icons';

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
  constructor(private data: DataService) { }
  ngOnInit(): void {
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
}

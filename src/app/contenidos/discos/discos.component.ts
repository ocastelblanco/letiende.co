import { Component, OnInit } from '@angular/core';
import { DataService, Disco } from 'src/app/servicios/data.service';

@Component({
  selector: 'lt-discos',
  templateUrl: './discos.component.html',
  styleUrls: ['./discos.component.scss']
})
export class DiscosComponent implements OnInit {
  discos: Disco[] = [];
  constructor(private data: DataService) { }
  ngOnInit(): void {
    this.data.getDiscos().subscribe((_discos: Disco[]) => {
      this.discos = _discos;
      this.discos.sort((a: Disco, b: Disco) => {
        if (a.artista < b.artista) return -1;
        if (a.artista > b.artista) return 1;
        return 0;
      });
      this.discos.forEach((disco: Disco) => {
        this.data.getDiscoInfo(disco.album, disco.artista, disco.barcode.substring(0, 3) != 'LTD' ? disco.barcode : null)
          .subscribe((resp: any) => {
            const formato: any = resp.formats ? resp.formats.find((frm: any) => frm.name == 'Vinyl') : { qty: '1 LP', descriptions: [] };
            const descripcion: string = formato.qty + ' ' + formato.descriptions.join(', ');
            disco.origen = resp.country,
              disco.anno = resp.year,
              disco.genero = resp.genre,
              //disco.cover = resp.cover_image,
              disco.descripcion = descripcion
          });
      });
    });
  }
}

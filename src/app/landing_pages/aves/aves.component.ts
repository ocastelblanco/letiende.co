import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { DataService } from 'src/app/servicios/data.service';
import { IconDefinition, faInstagram, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faPenToSquare, faFileImage } from '@fortawesome/free-regular-svg-icons';
import { faVideo } from '@fortawesome/free-solid-svg-icons';

interface Datos {
  titulo1: string;
  titulo2: string;
  subtitulo: string;
  texto: string;
  info: string;
  wa_de: string;
  ig_lt: string;
  video: string;
  registro: string;
  brochure: string;
}

@Component({
  selector: 'lt-aves',
  templateUrl: './aves.component.html',
  styleUrls: ['./aves.component.scss']
})
export class AvesComponent implements OnInit {
  ig: IconDefinition = faInstagram;
  wa: IconDefinition = faWhatsapp;
  video: IconDefinition = faVideo;
  registro: IconDefinition = faPenToSquare;
  brochure: IconDefinition = faFileImage;
  bpPantalla!: string | undefined;
  anchos = new Map([
    [Breakpoints.XSmall, 'xs'],
    [Breakpoints.Small, 'sm'],
    [Breakpoints.Medium, 'md'],
    [Breakpoints.Large, 'lg'],
    [Breakpoints.XLarge, 'xl'],
  ]);
  datos: Datos = {} as Datos;
  constructor(private breakpoint: BreakpointObserver, private http: HttpClient, private data: DataService) {
    this.breakpoint
      .observe([
        Breakpoints.XSmall,
        Breakpoints.Small,
        Breakpoints.Medium,
        Breakpoints.Large,
        Breakpoints.XLarge,
      ])
      .subscribe(result => {
        for (const tam of Object.keys(result.breakpoints)) if (result.breakpoints[tam]) this.bpPantalla = this.anchos.get(tam);
      });
  }
  ngOnInit(): void {
    this.http.get(this.data.rutaJson + '?pagina=aves', { responseType: 'json' })
      .subscribe((r: any) => {
        const data: string[] = r[0];
        this.datos = {
          titulo1: data[0].split(':')[0] + ':',
          titulo2: data[0].split(':')[1],
          subtitulo: data[1],
          texto: data[2].replace(/\n/g, '<br>'),
          info: data[3].replace(/\n/g, '<br>').replace(/\s\s/g, '&nbsp;&nbsp;'),
          wa_de: data[4],
          ig_lt: data[5],
          video: data[6],
          registro: data[7],
          brochure: data[8],
        };
      });
  }
}

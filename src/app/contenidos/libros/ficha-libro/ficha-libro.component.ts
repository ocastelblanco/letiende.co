import { Component, Inject, Input, Optional, effect, ElementRef, Output, EventEmitter } from '@angular/core';
import { DataService, Libro } from 'src/app/servicios/data.service';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { IconDefinition, faBook, faBookOpen, faBookmark, faInfoCircle, faListCheck, faPenNib, faPrint, faSackDollar } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'lt-ficha-libro',
  templateUrl: './ficha-libro.component.html',
  styleUrls: ['./ficha-libro.component.scss']
})
export class FichaLibroComponent {
  @Input() libro!: Libro;
  @Input() xs: boolean = false;
  @Output() finalizaRender: EventEmitter<boolean> = new EventEmitter<boolean>();
  titulo: IconDefinition = faBook;
  autores: IconDefinition = faPenNib;
  valor: IconDefinition = faSackDollar;
  subtitulo: IconDefinition = faBookmark;
  descripcion: IconDefinition = faInfoCircle;
  editorial: IconDefinition = faPrint;
  paginas: IconDefinition = faBookOpen;
  categorias: IconDefinition = faListCheck;
  modal: boolean = false;
  idioma: string = 'es';
  interfaz: any;
  constructor(
    private dataService: DataService,
    @Optional() @Inject(DIALOG_DATA) private data: Libro,
    @Optional() public esteDialogo: DialogRef,
    private el: ElementRef
  ) {
    effect(() => this.idioma = this.dataService.idioma());
    this.dataService.getInterfaz().subscribe(((interfaz: any) => interfaz.libros ? this.interfaz = interfaz.libros : null));
    if (this.data) {
      this.libro = this.data;
      this.modal = true;
    }
  }
  cargaImg(): void {
    this.finalizaRender.emit(true);
  }
}

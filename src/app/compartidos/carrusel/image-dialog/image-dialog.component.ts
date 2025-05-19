import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { AfterViewInit, Component, effect, ElementRef, inject, ViewChild } from '@angular/core';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { ElementoAuditorio, DataService } from 'src/app/servicios/data.service';

type Orientation = 'portrait' | 'landscape';

@Component({
  selector: 'lt-image-dialog',
  templateUrl: './image-dialog.component.html',
  styleUrl: './image-dialog.component.scss'
})
export class ImageDialogComponent implements AfterViewInit {
  @ViewChild('img') private imgRef?: ElementRef<HTMLImageElement>;
  dialogRef: DialogRef<ElementoAuditorio> = inject<DialogRef<ElementoAuditorio>>(DialogRef<ElementoAuditorio>);
  imagen: ElementoAuditorio = inject(DIALOG_DATA);
  orImg: Orientation = 'portrait';
  orPan: Orientation = 'portrait';
  idioma: string = 'es';
  constructor(
    private breakpoint: BreakpointObserver,
    private dataServicio: DataService,
  ) {
    effect(() => this.idioma = this.dataServicio.idioma());
    this.breakpoint
      .observe(['(orientation: portrait)', '(orientation: landscape)'])
      .subscribe((result: BreakpointState) => {
        for (const orientation of Object.keys(result.breakpoints)) {
          if (result.breakpoints[orientation]) {
            this.orPan = orientation.replace('(orientation: ', '').replace(')', '') as Orientation;
            this.calculaPropImg();
          }
        }
      });
  }
  ngAfterViewInit(): void {
    setTimeout(() => this.calculaPropImg(), 50);
  }
  calculaPropImg(): void {
    if (this.imgRef) {
      const proporcion: number = this.imgRef.nativeElement.naturalWidth / this.imgRef.nativeElement.naturalHeight;
      this.orImg = proporcion > 1 ? 'landscape' : 'portrait';
    }
  }
}

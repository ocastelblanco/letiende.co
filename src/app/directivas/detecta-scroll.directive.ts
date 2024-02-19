import { Directive, Output, EventEmitter, ViewContainerRef, HostListener } from '@angular/core';

@Directive({
  selector: '[ltDetectaScroll]'
})
export class DetectaScrollDirective {
  @Output() alFinal: EventEmitter<boolean> = new EventEmitter<boolean>();
  fichasLibros?: HTMLElement;
  libro?: HTMLElement | null;
  constructor(private cont: ViewContainerRef) { }
  @HostListener('window:scroll', ["$event"]) haceScroll(): void {
    this.fichasLibros = this.cont.element.nativeElement;
    this.libro = this.fichasLibros?.querySelector('.libro');
    const pos: number = (document.documentElement.scrollTop || document.body.scrollTop) + document.documentElement.offsetHeight;
    const max: number = document.documentElement.scrollHeight - 48;
    if (pos >= max) this.alFinal.emit(true);
  }
}
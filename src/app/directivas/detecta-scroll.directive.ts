import { Directive, Output, EventEmitter, OnInit, ViewContainerRef, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[ltDetectaScroll]'
})
export class DetectaScrollDirective implements OnInit {
  @Output() doScroll: EventEmitter<number> = new EventEmitter<number>();
  contenedor?: HTMLElement;
  vcr?: ViewContainerRef;
  @HostListener('scroll') onScroll() {
    console.log('Scroll');
  }
  constructor(private el: ElementRef) { }
  ngOnInit(): void {
  }
}
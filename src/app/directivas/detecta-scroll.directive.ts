import { Directive, Output, EventEmitter, OnInit, ViewContainerRef, ElementRef } from '@angular/core';

@Directive({
  selector: '[ltDetectaScroll]'
})
export class DetectaScrollDirective implements OnInit {
  @Output() doScroll: EventEmitter<number> = new EventEmitter<number>();
  contenedor?: HTMLElement;
  vcr?: ViewContainerRef;
  constructor(el: ElementRef) { }
  ngOnInit(): void {
  }
}
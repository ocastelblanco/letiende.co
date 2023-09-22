import { DOCUMENT } from '@angular/common';
import {
  Directive,
  Input,
  OnInit,
  ElementRef,
  Renderer2,
  Inject
} from '@angular/core';

@Directive({
  selector: '[lt-json-ld]'
})
export class JsonLdDirective implements OnInit {
  @Input() json: any;
  script!: HTMLElement;
  constructor(
    private elemento: ElementRef,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private _documento: Document
  ) { }
  ngOnInit(): void {
    const padre: HTMLElement = this.elemento.nativeElement.parentNode;
    this.renderer.removeChild(padre, this.elemento.nativeElement, true);
    this.script = this.renderer.createElement('script');
    this.renderer.setAttribute(this.script, 'type', 'application/ld+json');
    this.renderer.setProperty(this.script, 'innerHTML', JSON.stringify(this.json));
    this.renderer.appendChild(this._documento.head, this.script);
  }
}

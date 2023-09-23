import { Component, OnInit } from '@angular/core';
import { DataService, SEO } from './servicios/data.service';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router, UrlSegment } from '@angular/router';
import { filter, map } from 'rxjs';

@Component({
  selector: 'lt-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  seo: SEO = {
    titulo: 'Le Tiende · Date gusto',
    descripcion: 'Café en taza, literatura en papel y música en surcos de vinilo.',
    keywords: ['le tiende', 'café', 'coffee', 'disco', 'vinilo', 'vinyl', 'record', 'vinyl record', 'discotienda', 'música', 'music', 'bookstore', 'bookshop', 'librería', 'libros', 'book', 'centro cultural', 'cultura', 'cultural center', 'events', 'eventos']
  };
  schema = {
    '@context': 'http://schema.org',
    '@type': 'CulturalCenter',
    'hasMenu': 'http://letiende.co/menu',
    'address': {
      '@type': 'PostalAddress',
      'addressCountry': 'Colombia',
      'addressLocality': 'Parkway',
      'addressRegion': 'Bogotá',
      'streetAddress': 'Carrera 24 #37-44'
    },
    'openingHours': [
      'Mo-Th 13:00-21:00',
      'Fr-Sa 13:00-22:30',
      'Su 13:00-20:00'
    ],
    'priceRange': '$$',
    'paymentAccepted': ['Cash', 'Credit Card', 'Debit Card', 'Nequi', 'Daviplata'],
    'name': this.seo.titulo,
    'url': 'https://letiende.co/',
    'description': this.seo.descripcion
  };
  constructor(
    private data: DataService,
    private titleService: Title,
    private metaService: Meta,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.data.init();
  }
  ngOnInit(): void {
    this.data.getSEO().subscribe((SEO: SEO[]) => {
      this.router.events.pipe(filter((ev: any) => ev instanceof NavigationEnd)).subscribe((ev: any) => {
        this.route.firstChild?.url.subscribe((url: UrlSegment[]) => {
          const _seo: SEO = SEO.find((pag: SEO) => pag.pagina == url[0].path) as SEO;
          if (_seo) {
            this.seo = _seo;
            this.metaService.updateTag({ name: 'keywords', content: this.seo.keywords.join(',') });
            this.metaService.updateTag({ name: 'description', content: this.seo.descripcion });
          }
          this.data.creaURLCanonica();
        });
      });
      this.titleService.setTitle(this.seo.titulo);
      this.metaService.addTags([
        { name: 'keywords', content: this.seo.keywords.join(',') },
        { name: 'description', content: this.seo.descripcion },
        { name: 'robots', content: 'index, follow' }
      ]);
      // Crea una URL canónica para cada página
    });
  }
}

import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

export interface PageMeta {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  locale?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
}
interface SiteConfig {
  siteName: string;
  baseUrl: string;
  defaultImage: string;
  defaultLocale: string;
  twitterHandle: string;
}

@Injectable({
  providedIn: 'root'
})
export class MetaService {
  private readonly meta: Meta = inject(Meta);
  private readonly title: Title = inject(Title);
  private readonly router: Router = inject(Router);

  // Configuración base del sitio
  private readonly siteConfig: SiteConfig = {
    siteName: 'Le Tiende',
    baseUrl: 'https://letiende.co',
    defaultImage: 'https://assets.letiende.co/logos/logo_sobre_amarillo_sin_fondo.png',
    defaultLocale: 'es_CO',
    twitterHandle: '@letiende'
  };

  updatePageMeta(pageMeta: PageMeta): void {
    this.title.setTitle(pageMeta.title);
    this.meta.updateTag({ name: 'description', content: pageMeta.description });
    if (pageMeta.keywords) this.meta.updateTag({ name: 'keywords', content: pageMeta.keywords });
    const canonicalUrl: string = pageMeta.canonical || pageMeta.url || this.getCurrentUrl();
    this.meta.updateTag({ rel: 'canonical', href: canonicalUrl });
    const robotsContent: string = this.buildRobotsContent(pageMeta.noindex, pageMeta.nofollow);
    this.meta.updateTag({ name: 'robots', content: robotsContent });
    this.updateOpenGraphTags(pageMeta);
    this.updateTwitterTags(pageMeta);
    this.updateAdditionalTags(pageMeta);
  }

  private updateOpenGraphTags(pageMeta: PageMeta): void {
    const ogUrl: string = pageMeta.url || this.getCurrentUrl();
    const ogImage: string = pageMeta.image || this.siteConfig.defaultImage;
    const ogType: string = pageMeta.type || 'website';
    const ogSiteName: string = pageMeta.siteName || this.siteConfig.siteName;
    const ogLocale: string = pageMeta.locale || this.siteConfig.defaultLocale;

    this.meta.updateTag({ property: 'og:title', content: pageMeta.title });
    this.meta.updateTag({ property: 'og:description', content: pageMeta.description });
    this.meta.updateTag({ property: 'og:url', content: ogUrl });
    this.meta.updateTag({ property: 'og:image', content: ogImage });
    this.meta.updateTag({ property: 'og:type', content: ogType });
    this.meta.updateTag({ property: 'og:site_name', content: ogSiteName });
    this.meta.updateTag({ property: 'og:locale', content: ogLocale });

    // Image dimensions (recomendado para mejor rendimiento)
    this.meta.updateTag({ property: 'og:image:width', content: '1200' });
    this.meta.updateTag({ property: 'og:image:height', content: '630' });
    this.meta.updateTag({ property: 'og:image:alt', content: pageMeta.title });

    // Article specific tags
    if (ogType === 'article') {
      if (pageMeta.author) {
        this.meta.updateTag({ property: 'article:author', content: pageMeta.author });
      }
      if (pageMeta.publishedTime) {
        this.meta.updateTag({ property: 'article:published_time', content: pageMeta.publishedTime });
      }
      if (pageMeta.modifiedTime) {
        this.meta.updateTag({ property: 'article:modified_time', content: pageMeta.modifiedTime });
      }
    }
  }

  private updateTwitterTags(pageMeta: PageMeta): void {
    const twitterImage: string = pageMeta.image || this.siteConfig.defaultImage;

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:site', content: this.siteConfig.twitterHandle });
    this.meta.updateTag({ name: 'twitter:title', content: pageMeta.title });
    this.meta.updateTag({ name: 'twitter:description', content: pageMeta.description });
    this.meta.updateTag({ name: 'twitter:image', content: twitterImage });
    this.meta.updateTag({ name: 'twitter:image:alt', content: pageMeta.title });
  }

  private updateAdditionalTags(pageMeta: PageMeta): void {
    if (pageMeta.author) this.meta.updateTag({ name: 'author', content: pageMeta.author });

    // Viewport (importante para mobile)
    this.meta.updateTag({
      name: 'viewport',
      content: 'width=device-width, initial-scale=1.0, viewport-fit=cover'
    });

    // Theme color
    this.meta.updateTag({ name: 'theme-color', content: '#00B7A3' }); // Tu color principal

    // Format detection
    this.meta.updateTag({ name: 'format-detection', content: 'telephone=no' });
  }

  private buildRobotsContent(noindex?: boolean, nofollow?: boolean): string {
    const robots: string[] = [];

    if (noindex) robots.push('noindex');
    else robots.push('index');

    if (nofollow) robots.push('nofollow');
    else robots.push('follow');

    return robots.join(', ');
  }

  private getCurrentUrl(): string {
    return `${this.siteConfig.baseUrl}${this.router.url}`;
  }

  // Método para limpiar meta tags específicos si es necesario
  clearDynamicTags(): void {
    const tagsToRemove = [
      'article:author',
      'article:published_time',
      'article:modified_time'
    ];
    tagsToRemove.forEach(tag => this.meta.removeTag(`property="${tag}"`));
  }
}
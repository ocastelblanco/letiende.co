import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { registerLocaleData } from '@angular/common';
import localeEsCO from '@angular/common/locales/es-CO';
import localeEsCOExtra from '@angular/common/locales/extra/es-CO';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { environment } from '../environments/environment';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SafePipe } from './pipes/safe.pipe';
import { JsonLdDirective } from './directivas/json-ld.directive';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';

import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { provideStorage, getStorage } from '@angular/fire/storage';

import { InicioComponent } from './inicio/inicio.component';
import { PieComponent } from './compartidos/pie/pie.component';
import { MenuComponent } from './contenidos/menu/menu.component';
import { NavbarComponent } from './compartidos/navbar/navbar.component';
import { EventosComponent } from './contenidos/eventos/eventos.component';
import { AvesComponent } from './landing_pages/aves/aves.component';
import { MenuDesplegableComponent } from './compartidos/navbar/menu-desplegable/menu-desplegable.component';
import { DiscosComponent } from './contenidos/discos/discos.component';

registerLocaleData(localeEsCO, 'es-CO', localeEsCOExtra);

@NgModule({
  declarations: [
    AppComponent,
    InicioComponent,
    PieComponent,
    MenuComponent,
    NavbarComponent,
    EventosComponent,
    AvesComponent,
    SafePipe,
    MenuDesplegableComponent,
    JsonLdDirective,
    DiscosComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FontAwesomeModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatBottomSheetModule,
    MatCardModule,
    MatTooltipModule,
    MatListModule,
    MatMenuModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideStorage(() => getStorage()),
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'es-CO' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

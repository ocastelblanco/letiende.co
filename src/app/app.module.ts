import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { registerLocaleData } from '@angular/common';
import localeEsCO from '@angular/common/locales/es-CO';
import localeEsCOExtra from '@angular/common/locales/extra/es-CO';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, } from '@angular/forms';
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
import { MatGridListModule } from '@angular/material/grid-list';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { DialogModule } from '@angular/cdk/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';

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
import { MuertosComponent } from './landing_pages/muertos/muertos.component';
import { FichaEventoComponent } from './contenidos/eventos/ficha-evento/ficha-evento.component';
import { LibrosComponent } from './contenidos/libros/libros.component';
import { FichaDiscoComponent } from './contenidos/discos/ficha-disco/ficha-disco.component';
import { FichaLibroComponent } from './contenidos/libros/ficha-libro/ficha-libro.component';
import { DetectaScrollDirective } from './directivas/detecta-scroll.directive';

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
    MuertosComponent,
    FichaEventoComponent,
    LibrosComponent,
    FichaDiscoComponent,
    FichaLibroComponent,
    DetectaScrollDirective,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    FontAwesomeModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatBottomSheetModule,
    MatCardModule,
    MatTooltipModule,
    MatListModule,
    MatMenuModule,
    MatGridListModule,
    MatButtonToggleModule,
    DialogModule,
    MatDividerModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSliderModule,
    MatExpansionModule,
    MatAutocompleteModule,
    MatInputModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideStorage(() => getStorage()),
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'es-CO' },
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

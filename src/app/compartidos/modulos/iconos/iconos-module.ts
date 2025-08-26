import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faMugHot,
} from '@fortawesome/free-solid-svg-icons'; // Ejemplo: importa el ícono 'coffee'

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FontAwesomeModule,
  ],
  exports: [
    FontAwesomeModule
  ]
})
export class IconosModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faMugHot,
    );
  }
}

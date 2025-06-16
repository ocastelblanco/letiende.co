import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faCoffee } from '@fortawesome/free-solid-svg-icons'; // Ejemplo: importa el ícono 'coffee'
// Importa aquí otros íconos que necesites, por ejemplo: import { faUser, faHome } from '@fortawesome/free-solid-svg-icons';

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
    // Agrega los íconos importados a la librería para que estén disponibles.
    library.addIcons(
      faCoffee
    ); // Ejemplo: agrega el ícono 'coffee'
    // Agrega aquí otros íconos: library.addIcons(faUser, faHome);
  }
}

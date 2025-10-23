import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faMugHot,
} from '@fortawesome/free-solid-svg-icons';
import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';

// Exportamos FontAwesomeModule para que los componentes lo puedan importar
export { FontAwesomeModule as IconosModule };

// Provider function para registrar los íconos globalmente
export function provideIconos(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: 'FONT_AWESOME_ICONS',
      useFactory: (library: FaIconLibrary) => {
        library.addIcons(
          faMugHot,
        );
      },
      deps: [FaIconLibrary],
      multi: false
    }
  ]);
}

import { FaIconLibrary, FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faMugHot } from '@fortawesome/free-solid-svg-icons';
import { EnvironmentProviders, makeEnvironmentProviders, inject, provideAppInitializer } from '@angular/core';

// Exportamos FaIconComponent para que los componentes lo puedan importar
export { FaIconComponent as IconosModule };

// Provider function para registrar los íconos globalmente usando APP_INITIALIZER
export function provideIconos(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => {
      const library: FaIconLibrary = inject(FaIconLibrary);
      library.addIcons(faMugHot);
    }),
  ]);
}

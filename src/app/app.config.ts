import {
  ApplicationConfig,
  inject,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection
} from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsCO from '@angular/common/locales/es-CO';
import { provideRouter } from '@angular/router';

registerLocaleData(localeEsCO);

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { FirebaseOptions, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getAnalytics, provideAnalytics, ScreenTrackingService, UserTrackingService } from '@angular/fire/analytics';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { Cloudinary } from '@cloudinary/url-gen'; // Importa Cloudinary para crear la instancia y como token de inyección
import { CloudinaryConfig } from '@servicios/cloudinary-config';
import { FirebaseConfig } from '@servicios/firebase-config';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { LTPreset } from '../tema/lt-tema';
import { provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';
import { withHttpTransferCacheOptions } from '@angular/platform-browser';
import { provideIconos } from '@modulos/iconos/iconos-module';


let localSecrets: any | undefined = undefined;
try {
  localSecrets = require('../secrets').localSecrets;
} catch (e) {
  // No existe localSecrets porque este es un entorno de producción
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay(), withHttpTransferCacheOptions({ includePostRequests: false })),
    // Usamos una función de fábrica para inyectar FirebaseConfigService
    // e inicializar Firebase con las opciones obtenidas de él.
    provideFirebaseApp(() => {
      const firebaseConfigService: FirebaseConfig = inject(FirebaseConfig);
      if (!firebaseConfigService.firebaseOptions) {
        if (localSecrets) {
          const options: FirebaseOptions = {
            projectId: localSecrets.FIREBASE_PROJECT_ID,
            appId: localSecrets.FIREBASE_APP_ID,
            storageBucket: localSecrets.FIREBASE_STORAGE_BUCKET,
            apiKey: localSecrets.FIREBASE_API_KEY,
            authDomain: localSecrets.FIREBASE_AUTH_DOMAIN,
            messagingSenderId: localSecrets.FIREBASE_MESSAGING_SENDER_ID,
            measurementId: localSecrets.FIREBASE_MEASUREMENT_ID,
          };
          return initializeApp(options);
        }
        // Manejar el caso en que las opciones de Firebase no estén disponibles.
        // Esto podría indicar una configuración incorrecta de las variables de entorno.
        console.error('Firebase configuration options are not available. Check environment variables.');
        // Retornar una configuración vacía o lanzar un error, dependiendo de la criticidad.
        // Una configuración vacía puede causar errores posteriores si Firebase es esencial.
        return initializeApp({});
      }
      return initializeApp(firebaseConfigService.firebaseOptions);
    }),
    provideAuth(() => getAuth()),
    provideAnalytics(() => getAnalytics()),
    ScreenTrackingService,
    UserTrackingService,
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    // Provee la instancia de Cloudinary configurada globalmente.
    // Esto permite inyectar 'Cloudinary' en cualquier componente/servicio.
    {
      provide: Cloudinary,
      useFactory: () => {
        let cloudinaryConfigService: CloudinaryConfig = inject(CloudinaryConfig);
        if (!cloudinaryConfigService.cloudName) {
          if (localSecrets) {
            return new Cloudinary({ cloud: { cloudName: localSecrets.CLOUDINARY_CLOUD_NAME } });
          }
          console.error('Cloudinary Cloud Name no está disponible. El SDK de Cloudinary podría no funcionar correctamente.');
          return new Cloudinary({ cloud: { cloudName: 'letiende' } }); // Fallback o manejo de error
        }
        return new Cloudinary({ cloud: { cloudName: cloudinaryConfigService.cloudName } });
      },
      deps: [CloudinaryConfig] // Declara la dependencia para la función de fábrica
    },
    provideAnimationsAsync(),
    providePrimeNG({
      ripple: true,
      theme: {
        preset: LTPreset,
        options: {
          prefix: 'lt',
          darkModeSelector: '.tema-oscuro',
        },
      },
      translation: {
        accept: 'Sí',
        addRule: 'Agregar regla',
        am: 'AM',
        apply: 'Aplicar',
        cancel: 'Cancelar',
        choose: 'Escoger',
        chooseDate: 'Elige fecha',
        chooseMonth: 'Elige el mes',
        chooseYear: 'Elige año',
        clear: 'Limpiar',
        completed: 'Terminado',
        contains: 'Contenga',
        dateAfter: 'Fecha después de',
        dateBefore: 'Fecha antes de',
        dateFormat: 'dd/mm/yy',
        dateIs: 'Fecha igual a',
        dateIsNot: 'Fecha diferente a',
        dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
        dayNamesMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
        dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
        emptyFilterMessage: 'Sin opciones disponibles',
        emptyMessage: 'No se han encontrado resultados',
        emptySearchMessage: 'Sin opciones disponibles',
        emptySelectionMessage: 'Ningún elemento seleccionado',
        endsWith: 'Termine con',
        equals: 'Igual a',
        fileChosenMessage: '{0} archivos',
        fileSizeTypes: ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        firstDayOfWeek: 1,
        gt: 'Mayor que',
        gte: 'Mayor o igual a',
        lt: 'Menor que',
        lte: 'Menor o igual a',
        matchAll: 'Coincidir todo',
        matchAny: 'Coincidir con cualquiera',
        medium: 'Medio',
        monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
        monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        nextDecade: 'Próxima década',
        nextHour: 'Próxima hora',
        nextMinute: 'Siguiente minuto',
        nextMonth: 'Próximo mes',
        nextSecond: 'Siguiente segundo',
        nextYear: 'El próximo año',
        noFileChosenMessage: 'No se ha elegido ningún archivo',
        noFilter: 'Sin filtro',
        notContains: 'No contenga',
        notEquals: 'Diferente a',
        passwordPrompt: 'Escriba una contraseña',
        pending: 'Pendiente',
        pm: 'PM',
        prevDecade: 'Década anterior',
        prevHour: 'Hora anterior',
        prevMinute: 'Minuto anterior',
        prevMonth: 'Mes anterior',
        prevSecond: 'Segundo anterior',
        prevYear: 'Año anterior',
        reject: 'No',
        removeRule: 'Eliminar regla',
        searchMessage: '{0} resultados disponibles',
        selectionMessage: '{0} elementos seleccionados',
        startsWith: 'Comience con',
        strong: 'Fuerte',
        today: 'Hoy',
        upload: 'Subir',
        weak: 'Débil',
        weekHeader: 'Sem',
        aria: {
          cancelEdit: 'Cancelar editado',
          close: 'Cerrar',
          collapseRow: 'Reducir fila',
          editRow: 'Editar fila',
          expandRow: 'Expandir fila',
          falseLabel: 'Falso',
          filterConstraint: 'Restricción de filtro',
          filterOperator: 'Operador de filtro',
          firstPageLabel: 'Primera página',
          gridView: 'Vista de cuadrícula',
          hideFilterMenu: 'Ocultar menú del filtro',
          jumpToPageDropdownLabel: 'Ir al menú desplegable de página',
          jumpToPageInputLabel: 'Ir a la entrada de página',
          lastPageLabel: 'Última página',
          listLabel: 'Lista de opciones',
          listView: 'Vista de lista',
          maximizeLabel: 'Maximizar',
          minimizeLabel: 'Minimizar',
          moveAllToSource: 'Mover todo al origen',
          moveAllToTarget: 'Mover todo al objetivo',
          moveBottom: 'Desplazarse hacia abajo',
          moveDown: 'Bajar',
          moveTop: 'Mover arriba',
          moveToSource: 'Mover al origen',
          moveToTarget: 'Mover al objetivo',
          moveUp: 'Subir',
          navigation: 'Navegación',
          next: 'Siguiente',
          nextPageLabel: 'Siguiente página',
          nullLabel: 'No seleccionado',
          pageLabel: 'Página {page}',
          previous: 'Anterior',
          prevPageLabel: 'Página anterior',
          removeLabel: 'Eliminar',
          rotateLeft: 'Girar a la izquierda',
          rotateRight: 'Girar a la derecha',
          rowsPerPageLabel: 'Filas por página',
          saveEdit: 'Guardar editado',
          scrollTop: 'Desplazarse hacia arriba',
          selectAll: 'Seleccionar todos',
          selectColor: 'Seleccione un color',
          selectRow: 'Seleccionar fila',
          showFilterMenu: 'Mostrar menú del filtro',
          slide: 'Deslizar',
          slideNumber: '{slideNumber}',
          star: '1 estrella',
          stars: '{star} estrellas',
          trueLabel: 'Verdadero',
          unselectAll: 'Deseleccionar todos',
          unselectRow: 'Desmarcar fila',
          zoomImage: 'Ampliar imagen',
          zoomIn: 'Ampliar',
          zoomOut: 'Reducir',
        },
      },
    }),
    provideHttpClient(withFetch()),
    provideIconos(),
    { provide: LOCALE_ID, useValue: 'es-CO' },
  ]
};

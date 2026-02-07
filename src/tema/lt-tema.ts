import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

type glassOpacityType = 'soft' | 'thin' | 'flat' | 'frosted' | 'heavy' | 'hard';

const glassOpacity: { [key in glassOpacityType]: string } = {
  soft: '0.1',
  thin: '0.05',
  flat: '0.15',
  frosted: '0.25',
  heavy: '0.35',
  hard: '0.55',
};

// Paleta de colores primarios
const primaryColors: Record<string, string> = {
  50: '#001411',
  100: '#00201C',
  200: '#003730',
  300: '#005047',
  400: '#006B5E',
  500: '#008677',
  600: '#00A391',
  700: '#1FC0AB',
  800: '#4CDCC6',
  900: '#6EF9E2',
  950: '#B5FFF0',
};

// Superficies para modo claro
const lightSurface: Record<string, string> = {
  950: '#000000',
  900: '#181000',
  800: '#251A00',
  700: '#3C2F0A',
  600: '#54451F',
  500: '#6D5C34',
  400: '#87754A',
  300: '#A28F61',
  200: '#BEA97A',
  100: '#DBC493',
  50: '#F8E0AD',
  0: '#FFFFFF',
};

// Superficies para modo oscuro
const darkSurface: Record<string, string> = {
  950: '#000000',
  900: '#13100F',
  800: '#1E1B1A',
  700: '#33302E',
  600: '#4A4644',
  500: '#625D5B',
  400: '#7B7674',
  300: '#95908D',
  200: '#B0AAA7',
  100: '#CCC5C2',
  50: '#E8E1DE',
  0: '#FFFFFF',
};

function hexToRgb(hex: string): string {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b;
  });
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0';
}

function creaRGBA(colorHex: string, opacidad: glassOpacityType): string {
  return `rgba(${hexToRgb(colorHex)}, ${glassOpacity[opacidad]})`;
}

// Valores precalculados para glassmorphism
const lightPanelSurface: string = creaRGBA(lightSurface[0], 'frosted');
const darkPanelSurface: string = creaRGBA(darkSurface[900], 'frosted');
const lightButtonPrimaryBackground: string = creaRGBA(lightSurface[200], 'soft');
const lightButtonPrimaryHoverBackground: string = creaRGBA(primaryColors[500], 'hard');
const darkButtonPrimaryBackground: string = creaRGBA(darkSurface[700], 'soft');
const darkButtonPrimaryHoverBackground: string = creaRGBA(darkSurface[100], 'hard');
const lightButtonPrimaryColor: string = `rgb(${hexToRgb(lightSurface[900])})`;
const darkButtonPrimaryColor: string = `rgb(${hexToRgb(lightSurface[0])})`;
const headerPadding: { lg: string, sm: string } = { lg: '8px', sm: '2px' };

export const LTPreset = definePreset(Aura, {
  primitive: {
    borderRadius: {
      none: '0',
      xs: '2px',
      sm: '4px',
      md: '6px',
      lg: '8px',
      xl: '12px',
    },
  },
  semantic: {
    primary: primaryColors,
    colorScheme: {
      light: {
        surface: lightSurface,
      },
      dark: {
        surface: darkSurface,
      },
    },
  },
  css: () => `
    /* Variables personalizadas para Le Tiende */
    :root {
      --lt-border-radius-barramenu: 27px;
      --lt-border-radius-item-barramenu: 20px;
      --lt-button-icon-only-width: 2.5rem;
      --lt-light-panel-surface: ${lightPanelSurface};
      --lt-dark-panel-surface: ${darkPanelSurface};
      --lt-light-button-primary-bg: ${lightButtonPrimaryBackground};
      --lt-light-button-primary-hover-bg: ${lightButtonPrimaryHoverBackground};
      --lt-dark-button-primary-bg: ${darkButtonPrimaryBackground};
      --lt-dark-button-primary-hover-bg: ${darkButtonPrimaryHoverBackground};
      --lt-light-button-primary-color: ${lightButtonPrimaryColor};
      --lt-dark-button-primary-color: ${darkButtonPrimaryColor};
      --lt-header-padding-lg: ${headerPadding.lg};
      --lt-header-padding-sm: ${headerPadding.sm};
    }

    /* Menubar glassmorphism */
    .p-menubar.menu-bar {
      border-radius: var(--lt-border-radius-barramenu);
      background: var(--lt-light-panel-surface);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }

    .p-menubar-item-content {
      border-radius: var(--lt-border-radius-item-barramenu) !important;
    }

    .p-dark .p-menubar.menu-bar {
      background: var(--lt-dark-panel-surface);
    }

    .admin-button.active .p-button {
      background: var(--lt-glass-active-bg) !important;
      color: var(--lt-menubar-item-color) !important;
    }

    /* Button primary glassmorphism */
    .p-button:not(.p-button-outlined):not(.p-button-text):not(.p-button-link) {
      background: var(--lt-light-button-primary-bg);
      color: var(--lt-light-button-primary-color);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }

    .p-button:not(.p-button-outlined):not(.p-button-text):not(.p-button-link):hover {
      background: var(--lt-light-button-primary-hover-bg);
    }

    .p-dark .p-button:not(.p-button-outlined):not(.p-button-text):not(.p-button-link) {
      background: var(--lt-dark-button-primary-bg);
      color: var(--lt-dark-button-primary-color);
    }

    .p-dark .p-button:not(.p-button-outlined):not(.p-button-text):not(.p-button-link):hover {
      background: var(--lt-dark-button-primary-hover-bg);
    }

    /* Botón idioma */
    .p-button-idioma {
      display: flex;
      width: var(--lt-button-icon-only-width);
      height: var(--lt-button-icon-only-width);
    }

    .p-button-idioma img {
      height: var(--lt-button-icon-only-width);
    }

    /* Menu glassmorphism */
    .p-menu {
      background: var(--lt-light-panel-surface);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }

    .p-dark .p-menu {
      background: var(--lt-dark-panel-surface);
    }
  `,
});

import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

type glassOpacityType = 'soft' | 'thin' | 'flat' | 'frosted' | 'heavy' | 'hard';

const glassOpacity: { [key in glassOpacityType]: string } = {
  soft: '0.1',
  thin: '0.05',
  flat: '0.15',
  frosted: '0.25',
  heavy: '0.35',
  hard: '0.55',
};
const semantic: any = {
  primary: {
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
  },
  colorScheme: {
    light: {
      surface: {
        "950": "#000000",
        "900": "#181000",
        "800": "#251A00",
        "700": "#3C2F0A",
        "600": "#54451F",
        "500": "#6D5C34",
        "400": "#87754A",
        "300": "#A28F61",
        "200": "#BEA97A",
        "100": "#DBC493",
        "50": "#F8E0AD",
        "0": "#FFFFFF",
      },
    },
    dark: {
      surface: {
        "950": "#000000",
        "900": "#13100F",
        "800": "#1E1B1A",
        "700": "#33302E",
        "600": "#4A4644",
        "500": "#625D5B",
        "400": "#7B7674",
        "300": "#95908D",
        "200": "#B0AAA7",
        "100": "#CCC5C2",
        "50": "#E8E1DE",
        "0": "#FFFFF",
      }
    },
  },
};

export const LTPreset: any = definePreset(Aura, {
  primitive: {
    borderRadius: {
      menubar: '27px',
      itemMenubar: '20px',
    },
    lightPanelSurface: creaRGBA('light', 0, 'frosted'),
    darkPanelSurface: creaRGBA('dark', 900, 'frosted'),
    lightButtonPrimaryBackground: creaRGBA('light', 200, 'soft'),
    lightButtonPrimaryHoverBackground: creaRGBA('primary', 500, 'hard'),
    darkButtonPrimaryBackground: creaRGBA('dark', 700, 'soft'),
    darkButtonPrimaryHoverBackground: creaRGBA('dark', 100, 'hard'),
    lightButtonPrimaryColor: `rgb(${semantic.colorScheme.light.surface[900]})`,
    darkButtonPrimaryColor: `rgb(${semantic.colorScheme.light.surface[0]})`,
  },
  components: {
    menubar: {
      colorScheme: {
        light: {
          background: '{lightPanelSurface}',
        },
        dark: {
          background: '{darkPanelSurface}',
        },
      },
      borderRadius: '{borderRadius.menubar}',
      base: {
        item: {
          border: {
            radius: '{borderRadius.itemMenubar}'
          },
        }
      },
    },
    button: {
      colorScheme: {
        light: {
          primary: {
            background: '{lightButtonPrimaryBackground}',
            color: '{lightButtonPrimaryColor}',
            hover: {
              background: '{lightButtonPrimaryHoverBackground}',
            }
          }
        },
        dark: {
          primary: {
            background: '{darkButtonPrimaryBackground}',
            color: '{darkButtonPrimaryColor}',
            hover: {
              background: '{darkButtonPrimaryHoverBackground}',
            },
          },
        },
      },
    },
  },
  semantic: semantic,
});
function creaRGBA(tipo: 'light' | 'dark' | 'primary', nivel: number, opacidad: glassOpacityType): string {
  return 'rgba(' + hexToRgb(
    tipo == 'primary' ? semantic.primary[nivel] : semantic.colorScheme[tipo].surface[nivel]
  ) + ', ' + glassOpacity[opacidad] + ')';
}
function hexToRgb(hex: string): string | null {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b;
  });
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
}

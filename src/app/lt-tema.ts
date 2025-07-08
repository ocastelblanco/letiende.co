import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

export const LTPreset: any = definePreset(Aura, {
  primitive: {
    borderRadius: {
      full: '27px'
    }
  },
  components: {
    menubar: {
      borderRadius: '{borderRadius.full}'
    },
  },
  semantic: {
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
          "0": "#FFEFD1",
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
          "0": "#F7EFEC",
        }
      },
    },
  },
});
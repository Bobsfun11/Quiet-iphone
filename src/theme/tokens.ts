import { Platform } from 'react-native';

export const fonts = {
  editorial: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, "Times New Roman", serif' }),
};

export const colors = {
  canvas: '#F6F5EF', surface: '#FFFFFF', ink: '#24382F', muted: '#69766F',
  green: '#295440', lightGreen: '#E5EDE4', line: '#E5E7DE',
  amber: '#8C641E', lightAmber: '#FBF3DE', white: '#FFFFFF',
  sage: '#6D8265', soft: '#EEEFE6', softWhite: '#FCFCF8', separator: '#EBEDE5',
  paperGreen: '#EAF0E5', warmAccent: '#C0A66E', artLight: '#D5DEC5',
};

export const radii = { card: 24, button: 18, pill: 40 };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, hero: 40 };
export const typography = {
  title: { fontFamily: fonts.editorial, fontSize: 46, lineHeight: 51, letterSpacing: -1.6 },
  headline: { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.35 },
  body: { fontSize: 15, lineHeight: 23 },
  caption: { fontSize: 12, lineHeight: 18 },
  eyebrow: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 1.6 },
};
export const motion = { press: 120, entrance: 220, stagger: 35 };

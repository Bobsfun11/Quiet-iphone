import { DynamicColorIOS, Platform, type OpaqueColorValue } from 'react-native';

export const fonts = {
  editorial: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, "Times New Roman", serif' }),
};

function adaptiveColor(light: string, dark: string): string | OpaqueColorValue {
  // DynamicColorIOS creates a native color object. The generated RN type
  // also admits null and numeric colors, which the icon components reject.
  return Platform.OS === 'ios' ? DynamicColorIOS({ light, dark }) as OpaqueColorValue : light;
}

export const colors = {
  canvas: adaptiveColor('#F6F5EF', '#151A17'),
  surface: adaptiveColor('#FFFFFF', '#202823'),
  ink: adaptiveColor('#24382F', '#EEF2E9'),
  muted: adaptiveColor('#69766F', '#BAC7BD'),
  green: adaptiveColor('#295440', '#A5CEB1'),
  onAccent: adaptiveColor('#FFFFFF', '#172A1E'),
  lightGreen: adaptiveColor('#E5EDE4', '#263C30'),
  line: adaptiveColor('#E5E7DE', '#39483D'),
  amber: adaptiveColor('#8C641E', '#F3D08E'),
  lightAmber: adaptiveColor('#FBF3DE', '#392F22'),
  white: '#FFFFFF',
  sage: adaptiveColor('#6D8265', '#B3C8A8'),
  soft: adaptiveColor('#EEEFE6', '#2B352D'),
  softWhite: adaptiveColor('#FCFCF8', '#212A24'),
  separator: adaptiveColor('#EBEDE5', '#354139'),
  paperGreen: adaptiveColor('#EAF0E5', '#29372D'),
  controlTrack: adaptiveColor('#D7DDD2', '#536157'),
  youtubeTint: adaptiveColor('#FAEAE5', '#3D2827'),
  youtubeInk: adaptiveColor('#B34639', '#FFAEA0'),
  warmAccent: adaptiveColor('#C0A66E', '#E0C585'),
  artLight: adaptiveColor('#D5DEC5', '#50634D'),
  artSun: adaptiveColor('#E9EBCF', '#313C2C'),
  artOrbit: adaptiveColor('#DDE0C9', '#4D5B46'),
  artStem: adaptiveColor('#92A285', '#829878'),
  artLeaf: adaptiveColor('#A8B99D', '#71896A'),
  artLightLeaf: adaptiveColor('#C3CFB7', '#94AB86'),
  artDarkLeaf: adaptiveColor('#819C78', '#597652'),
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

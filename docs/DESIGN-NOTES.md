# Quiet's visual and motion decisions

The original cream/forest palette stays. The hierarchy is more editorial: Georgia for the brief opening statement, readable system type for tasks, one grouped platform list with hairlines, restrained platform colors and generous touch targets. Artwork is original geometric Views; there are no stock AI-generated graphics, gradients, fabricated engagement counters or fake usage statistics.

The motion has distinct jobs:

- **Feedback:** button press scale/opacity and row arrow feedback take 120 ms. Full-width rows highlight their background rather than shrinking the whole screen.
- **Arrival:** home content reveals once per app session; returning from a platform does not replay a long entrance. Entrances take 220 ms with a 35 ms stagger.
- **First use:** the sprig has one gentle settling movement during onboarding/first home arrival. It never loops or asks the user to breathe, wait or watch it before continuing.
- **Touch:** iPhone selection haptics occur only on deliberate commits, never while scrolling or during decorative entrances. Visual feedback remains sufficient when haptics are unavailable.
- **Accessibility:** Reduce Motion suppresses scale/translation, shortens/reduces entrances and disables the compatibility sheet's slide. Text scaling remains enabled. Touch targets remain at least 44 points.

New motion uses Reanimated 4 on the UI runtime; transforms and opacity avoid layout work per frame. Daily navigation and native switches retain immediate behavior. SF Symbols render on iOS; the labelled browser preview uses its own lightweight icon fallback.

Browser tests exercise the normal and reduced-motion paths and check for runtime errors. They do **not** verify native frame rates, on-device haptics or physical iPhone feel. Those need a signed Release build and the device acceptance checks.

## Downloaded design skill references

The official Expo skills were downloaded into the local workspace and read as design references. Their current main commit when retrieved was `a9e5bd3fa00b4e61f632e43f85da73aee1942582`.

- [Expo Animation](https://github.com/expo/skills/blob/a9e5bd3fa00b4e61f632e43f85da73aee1942582/plugins/expo/skills/expo-animation/SKILL.md), including its press and entrance recipes.
- [Expo Native UI](https://github.com/expo/skills/blob/a9e5bd3fa00b4e61f632e43f85da73aee1942582/plugins/expo/skills/expo-native-ui/SKILL.md), including the SF Symbols reference.
- [Expo Design System](https://github.com/expo/skills/blob/a9e5bd3fa00b4e61f632e43f85da73aee1942582/plugins/expo/skills/expo-design-system/SKILL.md).
- [Expo UI](https://github.com/expo/skills/blob/a9e5bd3fa00b4e61f632e43f85da73aee1942582/plugins/expo/skills/expo-ui/SKILL.md), reviewed for platform-control choices.

The existing project theme remains the visual source of truth. This pass preserves the existing navigation and native controls rather than migrating the entire working browser shell to a different routing library. The app's custom URL scheme requires a standalone registered app, so an Expo Go preview cannot verify that feature.

The animation recipe license is retained in `THIRD-PARTY-NOTICES.md`.

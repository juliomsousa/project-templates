# 03 — Coding conventions

Legend: **[lint]** means a tool enforces the rule. **[review]** means a convention checked in code review.

## Formatting [lint]

Prettier runs through ESLint. See `files/.prettierrc.js`.

```js
{arrowParens: 'avoid', bracketSameLine: true, bracketSpacing: false,
 singleQuote: true, trailingComma: 'none', semi: false}
```

This gives no semicolons, single quotes, `{foo}` without spaces, `x => x`, and no trailing commas.

## ESLint highlights [lint]

Base config: `@react-native/eslint-config/flat` (Bare) or `eslint-config-expo/flat` (Expo), plus `typescript-eslint` recommended, `eslint-plugin-sonarjs` recommended, `eslint-plugin-import` and Prettier. See `files/eslint.config.mjs`.

| Rule | Why |
|---|---|
| `no-console: error` | Log through `utils/logger` only |
| `@typescript-eslint/no-explicit-any: off` | Off: third-party edges make a hard ban impractical. `unknown` + narrowing is the expected style [review] |
| `@typescript-eslint/ban-ts-comment` | Bans `@ts-ignore`. `@ts-expect-error: <reason>` is allowed |
| `@typescript-eslint/consistent-type-imports` (inline) | `import {type Foo, bar} from '…'` |
| `import/order` (alphabetised, `react` and `react-native` first, `@app/**` last) | Stable, diff-friendly imports |
| `react/jsx-sort-props` | Props in alphabetical order |
| `no-restricted-imports` | Forces subpath imports for heavy packages (see below) |
| `no-restricted-syntax` (JSX selector) | Requires `testID` on configured components. No custom plugin needed |
| `react/jsx-no-useless-fragment`, `react/jsx-boolean-value`, `react/jsx-curly-brace-presence`, `object-shorthand`, `prefer-optional-chain`, `sonarjs/prefer-immediate-return` | Small consistency rules |

Custom local ESLint rules are added **only** when a requirement cannot be expressed with built-in rules such as `no-restricted-syntax` or `no-restricted-imports`.

## Naming [review]

| Thing | Convention | Example |
|---|---|---|
| Component file | PascalCase `.tsx`, same name as the export | `ProfileCard.tsx` → `export const ProfileCard` |
| Screen | `Screen` suffix, in its own folder | `features/profile/ProfileScreen/ProfileScreen.tsx` |
| Hook | `useX.ts` | `useFetchMe.ts` |
| Fetcher / query hook pair | `verbNoun.ts` / `useVerbNoun.ts` | `fetchMe.ts` / `useFetchMe.ts` |
| Store | `<name>State.ts` exporting `use<Name>State` | `sessionState.ts` → `useSessionState` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRIES`, `PROFILE_SAVE_BUTTON` |
| testID values | kebab-case | `'profile-save-button'` |
| Route name values | PascalCase | `'ProfileDetails'` |
| i18n keys | `namespace` → `subFeature.key` | `"profile": {"edit.save": "Save"}` |
| Tests | colocated `X.test.ts(x)` | |

## Modules & imports

- **Named exports only**, no `export default`. The exception is files a framework requires to default-export (e.g. Expo Router route files, config files). [review]
- **No barrel files** (`index.ts` re-exports). Import the exact file. Barrels defeat tree-shaking, and with Metro they pull the whole folder into the bundle and slow down resolution. [review]
  ```ts
  // ✅
  import {PrimaryButton} from '@app/components/Button/PrimaryButton'
  // ❌
  import {PrimaryButton} from '@app/components'
  ```
- **Path alias `@app/*` → `src/*`.** Use relative imports only for siblings in the same folder. Configure the alias in `tsconfig.json` `paths`, in Babel `module-resolver` for Bare (Expo reads tsconfig `paths` natively), and in Jest `moduleNameMapper`.

### Heavy dependencies

Metro **does not tree-shake** by default, so importing a package's root entry bundles the whole package.

1. **Import by subpath** when the package exposes one: `date-fns/addDays`, `@material-symbols/svg-400/outlined/home.svg`. Enforce it with `no-restricted-imports` (the template already covers `date-fns`; add others as they appear).
2. **Check the cost before adding a dependency** with https://pkg-size.dev or https://bundlephobia.com (install and min+gzip size, dependency tree).
3. **Measure the real bundle** periodically and in PRs that add dependencies:
   - Bare: `npx react-native-bundle-visualizer` (source-map-explorer treemap of the Metro bundle).
   - Expo: Expo Atlas (`EXPO_ATLAS=1 npx expo start`, then open Atlas from the dev tools), or `npx expo export --dump-sourcemap` + `npx source-map-explorer`.
4. Prefer native platform APIs, or a small focused library, over large general-purpose ones.

## Comments [review]

Code is self-explanatory. The name of a function, variable, type or test carries the meaning; a comment that repeats it is noise and is removed in review.

- Never explain *what* a function does when its name already says it.
- A comment is acceptable only for a genuinely complex flow, a non-obvious constraint, a workaround with a link to the issue, or a property worth calling out (for example an `/* istanbul ignore next */` with its reason).
- Prefer extracting a well-named function over writing a comment.
- Comments added by a human are kept as written. Agents never delete or rewrite them.

```ts
// ❌
// Fetches the current user
export const fetchMe = (signal?: AbortSignal) => callApi('/users/me', {method: 'get', signal})

// ✅
export const fetchMe = (signal?: AbortSignal) => callApi('/users/me', {method: 'get', signal})

// ✅ allowed: documents a constraint the code cannot express
// The refresh request must not go through callApi: it is unauthenticated and would recurse.
```

## TypeScript [lint + review]

- `strict: true` and `erasableSyntaxOnly: true`: no `enum`, `namespace` or constructor parameter properties. Use union types or `as const` objects.
  ```ts
  export const STATUS = {idle: 'idle', loading: 'loading'} as const
  export type Status = (typeof STATUS)[keyof typeof STATUS]
  ```
- Prefer `unknown` over `any` and narrow with type guards or Zod. The lint rule is off, so this is checked in review, and `any` is accepted only at untyped third-party edges, kept local to that line:
  ```ts
  const isApiErrorBody = (value: unknown): value is {message: string} =>
    typeof value === 'object' && value !== null && 'message' in value
  ```
- **Props get a dedicated `interface XProps`.** Never write inline prop types. Use `type` for unions, intersections and mapped types.
- Import from types-only modules (the generated `schema.ts`, `.d.ts` files) with `import type {…}`. An inline `import {type X}` can leave an empty runtime import behind after Babel, which fails to resolve for `.d.ts` files.
- `@ts-expect-error: <reason>` is acceptable only when third-party typings are wrong. In tests, prefer typed partial mocks (`as unknown as Foo`) over `@ts-expect-error`.

## Components [review]

- Function components written as arrow functions, with a named export.
- Pass handlers by reference (`onPress={handlePress}`), not as a new inline arrow (`onPress={() => handlePress()}`).
- Use `useCallback` or `useMemo` when the value goes to a child component or is expensive to compute.
- Use the `Typography` components instead of raw `<Text>`. Build screens on the shared screen shells.
- Every `testID` comes from `constants/locators.ts` and is added the first time it is used.
- Every user-facing string goes through `t()`.

### Styling (Unistyles v3)

- Define styles with `StyleSheet.create(theme => …)` from `react-native-unistyles`, at the **bottom** of the file.
- Take every colour, spacing, font size and radius from the theme. No magic numbers.
- Variant styles are functions inside the stylesheet (`border: (type: CardType) => ({…})`).
- Use `useUnistyles()` only when you need raw theme values in JSX, for example an SVG `color` prop.
- Put `/* istanbul ignore next */` above each `StyleSheet.create` so style factories don't count against coverage. [review]

```tsx
import {Pressable, View} from 'react-native'
import {StyleSheet} from 'react-native-unistyles'
import {Body} from '@app/components/Typography/Body'
import {Heading} from '@app/components/Typography/Heading'
import {PROFILE_CARD} from '@app/constants/locators'

export type ProfileCardVariant = 'default' | 'warning'

interface ProfileCardProps {
  title: string
  description: string
  variant?: ProfileCardVariant
  onPress: () => void
}

export const ProfileCard = ({
  title,
  description,
  variant = 'default',
  onPress
}: ProfileCardProps) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    style={styles.container(variant)}
    testID={PROFILE_CARD}>
    <View style={styles.content}>
      <Heading.S accessibilityRole="header">{title}</Heading.S>
      <Body.M numberOfLines={2}>{description}</Body.M>
    </View>
  </Pressable>
)

/* istanbul ignore next */
const styles = StyleSheet.create(theme => ({
  container: (variant: ProfileCardVariant) => ({
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderLeftWidth: theme.spacing.xs,
    borderLeftColor:
      variant === 'warning' ? theme.colors.warning : theme.colors.primary,
    backgroundColor: theme.colors.surface
  }),
  content: {
    gap: theme.spacing.xs
  }
}))
```

### SVG icons

SVG files are imported as React components through `react-native-svg-transformer`. The Metro setup differs per workflow and both variants are in the template: `metro.config.js` for Bare uses `react-native-svg-transformer/react-native` with `@react-native/metro-config`, and `metro.config.expo.js` uses `react-native-svg-transformer/expo` with `expo/metro-config`. The types are in `src/declarations.d.ts`.

- `.svgrrc` turns the source colour (`#000`, `currentColor`) into `{props.fill}`, so icon colour comes from the theme:
  ```tsx
  import ChevronIcon from '@app/assets/icons/chevron.svg'

  const {theme} = useUnistyles()
  <ChevronIcon fill={theme.colors.primary} height={24} width={24} />
  ```
- Export icons with a single colour (`#000`) so the replacement works. Multi-colour illustrations keep their own colours.
- Decorative icons get `accessible={false}`. An icon that stands alone as a button gets an `accessibilityLabel` on its `Pressable`.
- In Jest, `.svg` maps to `__mocks__/svgMock.js`.

## Error boundaries

Wrap the app root (already done in `App.tsx`) and each **independent section** of a screen, so one failing widget doesn't blank the whole screen. Use `components/ErrorBoundary`, which logs through `logger` and shows a translated fallback with a retry button. Pass a custom `FallbackComponent` for inline sections.

```tsx
<ErrorBoundary FallbackComponent={NotesErrorCard} onReset={refetchNotes}>
  <NotesList />
</ErrorBoundary>
```

## Feature flags

The flag **source** is decided per project (remote config, the login payload, a backend endpoint). The consumption side is fixed:

- Declare every flag with its default in `store/featureFlagsState/featureFlagsState.ts` (`FEATURE_FLAG_DEFAULTS`), so flag names are typed.
- The source calls `useFeatureFlagsState.getState().setFlags({...})` once it has values. Until then the defaults apply.
- Components read flags with `useFeatureFlag('newProfileScreen')` or wrap UI in `<FeatureGate flag="newProfileScreen" fallback={…}>`.
- Flags are session-scoped, so they reset on logout.
- Remove a flag and its dead branch once the feature is fully rolled out.

## Forms

`react-hook-form` with a Zod schema through `standardSchemaResolver`. Error messages in the schema are **i18n keys**, translated where they are displayed.

```ts
import {standardSchemaResolver} from '@hookform/resolvers/standard-schema'
import {useForm} from 'react-hook-form'
import {z} from 'zod'

const profileSchema = z.object({
  name: z.string().min(1, 'profile.form.nameRequired'),
  email: z.email('profile.form.emailInvalid')
})

type ProfileForm = z.infer<typeof profileSchema>

export const useProfileForm = (defaultValues: ProfileForm) =>
  useForm<ProfileForm>({
    resolver: standardSchemaResolver(profileSchema),
    defaultValues
  })
```

## Navigation

> **TBD.** Before implementing navigation, **ask the project owner for a code reference from another project** to follow.

Constraints that apply either way:

- Navigation wiring stays out of `features/`.
- Route params are typed.
- No hard-coded route strings scattered through the code.
- Route params must be serialisable and must not carry credentials or tokens.

### Reusable building blocks (React Navigation)

These pieces apply if the project uses React Navigation. Expo Router covers most of them with its file-based routes.

- **One file per feature stack**, at `navigation/navigators/<Feature>Stack.tsx`. Each file owns its param list and its screen-props type:
  ```tsx
  export type ProfileStackParamList = {
    [PROFILE_DETAILS]: undefined
    [PROFILE_EDIT]: {field: 'name' | 'email'}
  }

  export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> =
    NativeStackScreenProps<ProfileStackParamList, T>

  const Stack = createNativeStackNavigator<ProfileStackParamList>()

  export const ProfileStack = () => (
    <Stack.Navigator screenOptions={defaultScreenOptions}>
      <Stack.Screen component={ProfileDetailsScreen} name={PROFILE_DETAILS} />
      <Stack.Screen component={ProfileEditScreen} name={PROFILE_EDIT} />
    </Stack.Navigator>
  )
  ```
- **Nested navigators** are typed with `NavigatorScreenParams`:
  ```ts
  export type RootStackParamList = {
    [PROFILE_STACK]: NavigatorScreenParams<ProfileStackParamList>
  }
  ```
- **A typed navigation ref** for code outside components (notifications, logout). It checks readiness before acting:
  ```ts
  export const navigationRef = createNavigationContainerRef<RootStackParamList>()

  export const navigateWhenReady = (...args: Parameters<typeof navigationRef.navigate>) => {
    if (navigationRef.isReady()) navigationRef.navigate(...args)
  }
  ```
- **Shared screen-option presets** live in `navigation/screenOptions.ts` (e.g. `defaultScreenOptions`, `fullScreenModalOptions`) instead of being repeated per stack.
- **`useDisableNavigation`** is a utility hook for screens the user must not leave by going back, even though the navigator would allow it, such as a receipt or a confirmation after a payment. It blocks the Android hardware back button and the iOS back gesture on the screen and its parent navigator:
  ```ts
  export const useDisableNavigation = () => {
    const navigation = useNavigation()

    useFocusEffect(
      useCallback(() => {
        const parent = navigation.getParent()
        navigation.setOptions({gestureEnabled: false, headerBackVisible: false})
        parent?.setOptions({gestureEnabled: false})

        const subscription = BackHandler.addEventListener('hardwareBackPress', () => true)

        return () => {
          subscription.remove()
          navigation.setOptions({gestureEnabled: true, headerBackVisible: true})
          parent?.setOptions({gestureEnabled: true})
        }
      }, [navigation])
    )
  }
  ```
  The screen must then offer its own explicit exit (e.g. a "Done" button that resets to home).
- **Devtools:** call `useReactNavigationDevTools({ref: navigationRef})` next to the container (see [01 › Devtools](01-stack.md#devtools-rozenite)).

## Accessibility

> **TBD.** Applies only if accessibility is requested for the project, and can be added after init.

When it is enabled, the baseline is:

- `@react-native-ama/*` with `AMAProvider` and accessible forms.
- `accessibilityRole`, `accessibilityLabel` and `accessibilityHint` on interactive elements, and `accessibilityRole="header"` on headings.
- Focus management hooks, and respect for the reduced-motion setting.

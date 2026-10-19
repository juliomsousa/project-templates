import {StyleSheet} from 'react-native-unistyles'

const lightTheme = {
  colors: {
    primary: '#0B55B7',
    onPrimary: '#FFFFFF',
    background: '#FFFFFF',
    surface: '#F3F3F3',
    text: '#212B32',
    textMuted: '#768692',
    border: '#D8DDE0',
    success: '#02A78B',
    warning: '#FFDE0E',
    error: '#B30638'
  },
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 16,
    full: 999
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 19,
    xl: 24,
    xxl: 32
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 40
  },
  fontWeight: {
    regular: '400',
    bold: '700'
  }
} as const

const appThemes = {light: lightTheme}

const breakpoints = {xs: 0, sm: 360, md: 600, lg: 900} as const

type AppThemes = typeof appThemes
type AppBreakpoints = typeof breakpoints

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends AppThemes {}
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}

StyleSheet.configure({
  themes: appThemes,
  breakpoints,
  settings: {initialTheme: 'light'}
})

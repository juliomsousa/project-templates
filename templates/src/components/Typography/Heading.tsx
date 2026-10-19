import {Text, type TextProps} from 'react-native'
import {StyleSheet} from 'react-native-unistyles'

const S = ({style, ...props}: TextProps) => (
  <Text accessibilityRole="header" {...props} style={[styles.base, styles.s, style]} />
)

const M = ({style, ...props}: TextProps) => (
  <Text accessibilityRole="header" {...props} style={[styles.base, styles.m, style]} />
)

export const Heading = {S, M}

/* istanbul ignore next */
const styles = StyleSheet.create(theme => ({
  base: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.bold
  },
  s: {
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg
  },
  m: {
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl
  }
}))

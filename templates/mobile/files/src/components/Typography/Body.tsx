import {Text, type TextProps} from 'react-native'
import {StyleSheet} from 'react-native-unistyles'

const S = ({style, ...props}: TextProps) => (
  <Text {...props} style={[styles.base, styles.s, style]} />
)

const M = ({style, ...props}: TextProps) => (
  <Text {...props} style={[styles.base, styles.m, style]} />
)

const BoldM = ({style, ...props}: TextProps) => (
  <Text {...props} style={[styles.base, styles.m, styles.bold, style]} />
)

// Compound component: <Body.M>, <Body.S>, <Body.BoldM>
export const Body = {S, M, BoldM}

/* istanbul ignore next */
const styles = StyleSheet.create(theme => ({
  base: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.regular
  },
  s: {
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm
  },
  m: {
    fontSize: theme.fontSize.md,
    lineHeight: theme.lineHeight.md
  },
  bold: {
    fontWeight: theme.fontWeight.bold
  }
}))

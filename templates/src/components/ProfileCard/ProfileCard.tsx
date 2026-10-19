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
      <Heading.S>{title}</Heading.S>
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

import {type ComponentType, type ReactNode} from 'react'
import {Pressable, View} from 'react-native'
import {
  ErrorBoundary as BaseErrorBoundary,
  type FallbackProps
} from 'react-error-boundary'
import {useTranslation} from 'react-i18next'
import {StyleSheet} from 'react-native-unistyles'
import {Body} from '@app/components/Typography/Body'
import {ERROR_BOUNDARY_RETRY} from '@app/constants/locators'
import {logger} from '@app/utils/logger/logger'

export const DefaultErrorFallback = ({resetErrorBoundary}: FallbackProps) => {
  const {t} = useTranslation()

  return (
    <View style={styles.container}>
      <Body.M accessibilityRole="alert">{t('common.error.generic')}</Body.M>
      <Pressable
        accessibilityRole="button"
        onPress={resetErrorBoundary}
        style={styles.retry}
        testID={ERROR_BOUNDARY_RETRY}>
        <Body.BoldM style={styles.retryLabel}>{t('common.retry')}</Body.BoldM>
      </Pressable>
    </View>
  )
}

const onError = (error: unknown, info: {componentStack?: string | null}) =>
  logger.error('Unhandled render error', {
    message: error instanceof Error ? error.message : String(error),
    componentStack: info.componentStack ?? undefined
  })

interface ErrorBoundaryProps {
  children: ReactNode
  FallbackComponent?: ComponentType<FallbackProps>
  onReset?: () => void
}

/** Wrap the app root and each independent screen section */
export const ErrorBoundary = ({
  children,
  FallbackComponent = DefaultErrorFallback,
  onReset
}: ErrorBoundaryProps) => (
  <BaseErrorBoundary
    FallbackComponent={FallbackComponent}
    onError={onError}
    onReset={onReset}>
    {children}
  </BaseErrorBoundary>
)

/* istanbul ignore next */
const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg
  },
  retry: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary
  },
  retryLabel: {
    color: theme.colors.onPrimary
  }
}))

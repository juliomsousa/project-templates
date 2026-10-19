import * as Keychain from 'react-native-keychain'
import {type SessionTokens} from '@app/store/sessionState/sessionState'

// TODO(init): Expo → reimplement with expo-secure-store
// (SecureStore.setItemAsync(key, value, {keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY})).
const SESSION_SERVICE = 'app.session'

// Readable only while the device is unlocked, never synced to iCloud or another device.
const BASE_OPTIONS = {
  service: SESSION_SERVICE,
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY
}

export const saveSessionTokens = async (tokens: SessionTokens) => {
  await Keychain.setGenericPassword('session', JSON.stringify(tokens), BASE_OPTIONS)
}

export const loadSessionTokens = async (): Promise<SessionTokens | undefined> => {
  const credentials = await Keychain.getGenericPassword({service: SESSION_SERVICE})
  return credentials ? (JSON.parse(credentials.password) as SessionTokens) : undefined
}

export const clearSessionTokens = async () => {
  await Keychain.resetGenericPassword({service: SESSION_SERVICE})
}

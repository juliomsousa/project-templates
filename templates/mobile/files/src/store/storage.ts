/* istanbul ignore file */
import {createMMKV} from 'react-native-mmkv'

// Non-sensitive data only. Tokens and secrets go to Keychain/Keystore
// (react-native-keychain on Bare, expo-secure-store on Expo).
export const storage = createMMKV({id: 'app-storage'})

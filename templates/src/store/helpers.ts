import {type MMKV} from 'react-native-mmkv'
import {createJSONStorage} from 'zustand/middleware'

export const createJSONStorageHelper = (mmkv: MMKV) =>
  createJSONStorage(() => ({
    getItem: key => mmkv.getString(key) ?? null,
    setItem: (key, value) => mmkv.set(key, value),
    removeItem: key => mmkv.remove(key)
  }))

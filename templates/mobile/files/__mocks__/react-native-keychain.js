// In-memory Keychain for Jest
const entries = new Map()

module.exports = {
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly'
  },
  ACCESS_CONTROL: {
    BIOMETRY_CURRENT_SET: 'BiometryCurrentSet'
  },
  setGenericPassword: jest.fn(async (username, password, options = {}) => {
    entries.set(options.service ?? 'default', {username, password})
    return true
  }),
  getGenericPassword: jest.fn(
    async (options = {}) => entries.get(options.service ?? 'default') ?? false
  ),
  resetGenericPassword: jest.fn(async (options = {}) =>
    entries.delete(options.service ?? 'default')
  )
}

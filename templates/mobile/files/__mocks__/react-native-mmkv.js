// In-memory MMKV for Jest (root __mocks__ for node modules are applied automatically)
const createMMKV = jest.fn(() => {
  const data = new Map()

  return {
    set: jest.fn((key, value) => data.set(key, value)),
    getString: jest.fn(key => data.get(key)),
    getBoolean: jest.fn(key => data.get(key)),
    getNumber: jest.fn(key => data.get(key)),
    contains: jest.fn(key => data.has(key)),
    remove: jest.fn(key => data.delete(key)),
    getAllKeys: jest.fn(() => [...data.keys()]),
    clearAll: jest.fn(() => data.clear()),
    addOnValueChangedListener: jest.fn(() => ({remove: jest.fn()}))
  }
})

module.exports = {createMMKV}

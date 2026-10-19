import 'i18next'
import {type resources} from '@app/services/translation/init'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: (typeof resources)['en']
  }
}

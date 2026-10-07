import 'i18next'
import type { defaultNS, resources } from '@/lib/i18n'

// Type-checks translation keys passed to t() against the English resources.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS
    resources: (typeof resources)['en']
  }
}

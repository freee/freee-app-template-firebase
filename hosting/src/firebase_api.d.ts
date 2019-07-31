// In order to use firebase sdk automatic configuration in typescript
// define firebase_api.d.ts here
import * as F from 'firebase'

declare global {
  const firebase: typeof F
}

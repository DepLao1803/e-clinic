import { Suspense } from 'react'
import { ResetPassword } from '@/app/components/auth/ResetPassword'

// useSearchParams() must sit under a Suspense boundary in the App Router.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <ResetPassword />
    </Suspense>
  )
}

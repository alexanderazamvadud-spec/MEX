import { Navigate, Outlet } from 'react-router'
import { useLearner } from '../learner/useLearner.ts'

// Layout route for screens that need a learner profile (Home, Learn, Progress).
// Learners without one are sent to onboarding; Settings and the landing page stay open to everyone.
export default function RequireProfile() {
  const { record } = useLearner()
  if (!record.profile) {
    return <Navigate to="/onboarding" replace />
  }
  return <Outlet />
}

import { createHashRouter, RouterProvider, type RouteObject } from 'react-router'
import LearnerProvider from '../learner/LearnerProvider.tsx'
import AppShell from './AppShell.tsx'
import RequireProfile from './RequireProfile.tsx'
import HomePage from '../pages/HomePage.tsx'
import LandingPage from '../pages/LandingPage.tsx'
import LearnPage from '../pages/LearnPage.tsx'
import ActivityPage from '../pages/ActivityPage.tsx'
import NotFoundPage from '../pages/NotFoundPage.tsx'
import OnboardingPage from '../pages/OnboardingPage.tsx'
import PathwayPage from '../pages/PathwayPage.tsx'
import SettingsPage from '../pages/SettingsPage.tsx'
import TermsPage from '../pages/TermsPage.tsx'
import ProgressPage from '../pages/ProgressPage.tsx'
import UnitPage from '../pages/UnitPage.tsx'

// Hash-based routing (/#/path) is used because GitHub Pages is a static host with no
// server-side routing: refreshing any hash URL always loads index.html, so deep links survive.
const routes: RouteObject[] = [
  { path: '/', element: <LandingPage /> },
  { path: '/onboarding', element: <OnboardingPage /> },
  { path: '/terms', element: <TermsPage /> },
  {
    element: <AppShell />,
    children: [
      {
        element: <RequireProfile />,
        children: [
          { path: '/home', element: <HomePage /> },
          { path: '/learn', element: <LearnPage /> },
          { path: '/learn/:pathway', element: <PathwayPage /> },
          { path: '/learn/:pathway/:unit', element: <UnitPage /> },
          { path: '/learn/:pathway/:unit/:activity', element: <ActivityPage /> },
          { path: '/progress', element: <ProgressPage /> },
        ],
      },
      { path: '/settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

// The style-guide page exists only in development builds. Vite replaces
// import.meta.env.DEV with false in production, so this branch and its import are dropped.
if (import.meta.env.DEV) {
  routes.push({
    path: '/styleguide',
    HydrateFallback: () => null,
    lazy: async () => {
      const module = await import('../pages/StyleguidePage.tsx')
      return { Component: module.default }
    },
  })
}

const router = createHashRouter(routes)

export default function App() {
  return (
    <LearnerProvider>
      <RouterProvider router={router} />
    </LearnerProvider>
  )
}

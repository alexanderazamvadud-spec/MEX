import { createHashRouter, RouterProvider, type RouteObject } from 'react-router'
import LearnerProvider from '../learner/LearnerProvider.tsx'
import AppShell from './AppShell.tsx'
import NotFoundPage from '../pages/NotFoundPage.tsx'
import PlaceholderPage from '../pages/PlaceholderPage.tsx'
import SettingsPage from '../pages/SettingsPage.tsx'
import StubPage from '../pages/StubPage.tsx'

// Hash-based routing (/#/path) is used because GitHub Pages is a static host with no
// server-side routing: refreshing any hash URL always loads index.html, so deep links survive.
const routes: RouteObject[] = [
  { path: '/', element: <PlaceholderPage /> },
  {
    element: <AppShell />,
    children: [
      { path: '/home', element: <StubPage titleKey="nav.home" /> },
      { path: '/learn', element: <StubPage titleKey="nav.learn" /> },
      { path: '/progress', element: <StubPage titleKey="nav.progress" /> },
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

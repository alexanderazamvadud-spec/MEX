import { createHashRouter, RouterProvider } from 'react-router'
import PlaceholderPage from '../pages/PlaceholderPage.tsx'

// Hash-based routing (/#/path) is used because GitHub Pages is a static host with no
// server-side routing: refreshing any hash URL always loads index.html, so deep links survive.
const router = createHashRouter([
  { path: '/', element: <PlaceholderPage /> },
])

export default function App() {
  return <RouterProvider router={router} />
}

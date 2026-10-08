import { Outlet } from 'react-router'
import BottomNav from '../components/navigation/BottomNav.tsx'
import TopBar from '../components/navigation/TopBar.tsx'
import PageContainer from '../components/ui/PageContainer.tsx'

// Layout for every app screen: top bar, the screen itself, and the bottom navigation.
export default function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PageContainer>
        <TopBar />
      </PageContainer>
      <main className="flex-1">
        <PageContainer className="py-4">
          <Outlet />
        </PageContainer>
      </main>
      <BottomNav />
    </div>
  )
}

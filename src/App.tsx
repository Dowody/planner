import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Home } from '@/pages/Home'
import { Tasks } from '@/pages/Tasks'
import { Calendar } from '@/pages/Calendar'
import { Notes } from '@/pages/Notes'
import { Habits } from '@/pages/Habits'
import { Goals } from '@/pages/Goals'
import { Analytics } from '@/pages/Analytics'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { Auth } from '@/pages/Auth'
import { AuthGuard } from '@/components/AuthGuard'
import { supabase } from '@/lib/supabase'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public route for Authentication */}
          <Route path="/auth" element={<Auth />} />

          {/* Protected routes wrapped by AuthGuard and Layout */}
          <Route
            path="/*"
            element={
              <AuthGuard>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/notes" element={<Notes />} />
                    <Route path="/habits" element={<Habits />} />
                    <Route path="/goals" element={<Goals />} />
                    <Route path="/analytics" element={<Analytics />} />
                    {/* Redirect any other protected path to the dashboard if not found */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </AuthGuard>
            }
          />
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  )
}

export default App

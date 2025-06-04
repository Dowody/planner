import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  ListChecks,
  BookOpen,
  RefreshCcwDot,
  BarChart2,
  Menu,
  X,
  Goal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { motion, AnimatePresence } from 'framer-motion'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      name: 'Tasks',
      href: '/tasks',
      icon: ListChecks,
    },
    {
      name: 'Calendar',
      href: '/calendar',
      icon: Calendar,
    },
    {
      name: 'Notes',
      href: '/notes',
      icon: BookOpen,
    },
    {
      name: 'Goals',
      href: '/goals',
      icon: Goal,
    },
    {
      name: 'Habits',
      href: '/habits',
      icon: RefreshCcwDot,
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart2,
    },
  ]

  const NavItem = ({ item, isActive }: { item: typeof navigation[0], isActive: boolean }) => (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        to={item.href}
        className={cn(
          'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <motion.div
          initial={false}
          animate={{ scale: isActive ? 1.05 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <item.icon
            className={cn(
              'mr-3 h-5 w-5',
              isActive
                ? 'text-primary-foreground'
                : 'text-muted-foreground group-hover:text-foreground'
            )}
          />
        </motion.div>
        {item.name}
      </Link>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Mobile menu removed */}
        {/* Desktop Sidebar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0"
        >
          <div className="flex flex-col flex-grow pt-5 bg-background border-r">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center flex-shrink-0 px-4"
            >
              <h1 className="text-xl font-bold">Planner</h1>
            </motion.div>
            <div className="mt-5 flex-1 flex flex-col">
              <nav className="flex-1 px-2 pb-4 space-y-1">
                {navigation.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <NavItem
                      item={item}
                      isActive={location.pathname === item.href}
                    />
                  </motion.div>
                ))}
              </nav>
            </div>
          </div>
        </motion.div>

        {/* Main content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="md:pl-64 flex flex-col flex-1"
        >
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </motion.div>

        {/* Mobile bottom navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[95vw] max-w-md rounded-2xl bg-background border border-neutral-200 shadow-lg"
        >
          <nav className="flex justify-between items-center px-2 py-1">
            {navigation.slice(0, 5).map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center flex-1 py-2 transition-colors',
                    isActive
                      ? 'text-primary bg-primary/10 rounded-xl'
                      : 'text-muted-foreground hover:text-primary'
                  )}
                  style={{ minWidth: 0 }}
                >
                  <item.icon className={cn('h-6 w-6 mb-0.5', isActive ? 'text-primary' : '')} />
                  <span className="text-[10px] font-medium leading-none mt-0.5">
                    {item.name}
                  </span>
                </Link>
              )
            })}
          </nav>
        </motion.div>
      </div>
    </div>
  )
} 
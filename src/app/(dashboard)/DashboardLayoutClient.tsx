'use client';

import { useState, createContext, useContext, Key, useEffect } from 'react';
import { View, Flex, ActionButton } from '@adobe/react-spectrum';
import ShowMenu from '@spectrum-icons/workflow/ShowMenu';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

interface User {
  id: string;
  username: string;
  isRoot: boolean;
}

interface Bucket {
  id: string;
  name: string;
}

interface DashboardContextType {
  user: User;
  buckets: Bucket[];
  selectedBucket: string;
  setSelectedBucket: (id: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardLayoutClient');
  }
  return context;
}

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  user: User;
  buckets: Bucket[];
}

export function DashboardLayoutClient({
  children,
  user,
  buckets,
}: DashboardLayoutClientProps) {
  const [selectedBucket, setSelectedBucket] = useState(buckets[0]?.id || '');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleBucketChange = (key: Key | null) => {
    if (key) {
      setSelectedBucket(key as string);
    }
  };

  return (
    <DashboardContext.Provider
      value={{
        user,
        buckets,
        selectedBucket,
        setSelectedBucket,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
      }}
    >
      {/* Mobile overlay */}
      {isMobile && (
        <div 
          className={`sidebar-overlay ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <Sidebar 
          isRoot={user.isRoot} 
          onClose={() => setIsMobileMenuOpen(false)}
          isMobile={isMobile}
        />
      </div>

      {/* Main content */}
      <div className="main-content">
        <Flex direction="column" UNSAFE_style={{ minHeight: '100vh' }}>
          {/* Header */}
          <View
            backgroundColor="gray-75"
            padding="size-200"
            UNSAFE_style={{
              borderBottom: '1px solid var(--spectrum-global-color-gray-300)',
              position: 'sticky',
              top: 0,
              zIndex: 50,
            }}
          >
            <Flex alignItems="center" gap="size-100">
              {/* Mobile menu button */}
              <ActionButton
                isQuiet
                onPress={() => setIsMobileMenuOpen(true)}
                UNSAFE_className="mobile-menu-btn"
                aria-label="Open menu"
              >
                <ShowMenu />
              </ActionButton>

              <Header
                username={user.username}
                buckets={buckets}
                selectedBucket={selectedBucket}
                onBucketChange={handleBucketChange}
                isMobile={isMobile}
              />
            </Flex>
          </View>

          {/* Page content */}
          <View
            flex={1}
            padding={isMobile ? "size-200" : "size-300"}
            UNSAFE_style={{ 
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column' 
            }}
          >
            {children}
          </View>
        </Flex>
      </div>

      {/* Mobile bottom navigation */}
      {isMobile && (
        <MobileBottomNav isRoot={user.isRoot} />
      )}
    </DashboardContext.Provider>
  );
}

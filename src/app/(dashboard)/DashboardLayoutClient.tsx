'use client';

import { useState, createContext, useContext, Key } from 'react';
import { View, Flex } from '@adobe/react-spectrum';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

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
      }}
    >
      <Flex UNSAFE_style={{ height: '100vh' }}>
        <Sidebar isRoot={user.isRoot} />
        <Flex direction="column" flex={1} UNSAFE_style={{ overflow: 'hidden' }}>
          <Header
            username={user.username}
            buckets={buckets}
            selectedBucket={selectedBucket}
            onBucketChange={handleBucketChange}
          />
          <View
            flex={1}
            padding="size-300"
            UNSAFE_style={{ overflow: 'auto' }}
          >
            {children}
          </View>
        </Flex>
      </Flex>
    </DashboardContext.Provider>
  );
}

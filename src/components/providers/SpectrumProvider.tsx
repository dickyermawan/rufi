'use client';

import { Provider, defaultTheme } from '@adobe/react-spectrum';
import { useSyncExternalStore } from 'react';

// External store for color scheme
let colorScheme: 'light' | 'dark' = 'light';
const listeners = new Set<() => void>();

function getSnapshot() {
  return colorScheme;
}

function getServerSnapshot() {
  return 'light' as const;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

// Initialize on client side
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('colorScheme') as 'light' | 'dark' | null;
  if (saved) {
    colorScheme = saved;
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    colorScheme = 'dark';
  }

  // Listen for system preference changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', (e) => {
    if (!localStorage.getItem('colorScheme')) {
      colorScheme = e.matches ? 'dark' : 'light';
      listeners.forEach(cb => cb());
    }
  });
}

export function SpectrumProvider({ children }: { children: React.ReactNode }) {
  const currentColorScheme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <Provider theme={defaultTheme} colorScheme={currentColorScheme} locale="en-US">
      <div className={`spectrum-theme ${currentColorScheme === 'dark' ? 'dark' : ''}`}>
        {children}
      </div>
    </Provider>
  );
}

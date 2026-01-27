'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ActionButton, Text, Flex } from '@adobe/react-spectrum';
import FolderOpen from '@spectrum-icons/workflow/FolderOpen';
import User from '@spectrum-icons/workflow/User';
import DataSettings from '@spectrum-icons/workflow/DataSettings';
import Settings from '@spectrum-icons/workflow/Settings';

interface MobileBottomNavProps {
  isRoot: boolean;
}

export function MobileBottomNav({ isRoot }: MobileBottomNavProps) {
  const t = useTranslations('nav');
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { key: 'files', label: t('files'), icon: <FolderOpen size="S" />, href: '/files' },
    ...(isRoot
      ? [
          { key: 'users', label: t('users'), icon: <User size="S" />, href: '/users' },
          { key: 'buckets', label: t('buckets'), icon: <DataSettings size="S" />, href: '/buckets' },
        ]
      : []),
    { key: 'settings', label: t('settings'), icon: <Settings size="S" />, href: '/settings' },
  ];

  return (
    <div className="mobile-bottom-nav">
      {navItems.map((item) => (
        <ActionButton
          key={item.key}
          isQuiet
          onPress={() => router.push(item.href)}
          UNSAFE_style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            padding: '8px 4px',
            borderRadius: '8px',
            backgroundColor: pathname.startsWith(item.href)
              ? 'var(--spectrum-global-color-blue-100)'
              : 'transparent',
          }}
        >
          <Flex direction="column" alignItems="center" gap="size-50">
            {item.icon}
            <Text
              UNSAFE_style={{
                fontSize: '10px',
                color: pathname.startsWith(item.href)
                  ? 'var(--spectrum-global-color-blue-600)'
                  : 'var(--spectrum-global-color-gray-700)',
              }}
            >
              {item.label}
            </Text>
          </Flex>
        </ActionButton>
      ))}
    </div>
  );
}

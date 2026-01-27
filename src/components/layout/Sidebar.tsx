'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  View,
  Flex,
  ActionButton,
  Text,
  Divider,
} from '@adobe/react-spectrum';
import FolderOpen from '@spectrum-icons/workflow/FolderOpen';
import User from '@spectrum-icons/workflow/User';
import DataSettings from '@spectrum-icons/workflow/DataSettings';
import Settings from '@spectrum-icons/workflow/Settings';
import LogOut from '@spectrum-icons/workflow/LogOut';
import { RufiLogo } from '@/components/RufiLogo';

interface SidebarProps {
  isRoot: boolean;
}

export function Sidebar({ isRoot }: SidebarProps) {
  const t = useTranslations('nav');
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { key: 'files', label: t('files'), icon: <FolderOpen />, href: '/files' },
    ...(isRoot
      ? [
          { key: 'users', label: t('users'), icon: <User />, href: '/users' },
          { key: 'buckets', label: t('buckets'), icon: <DataSettings />, href: '/buckets' },
        ]
      : []),
    { key: 'settings', label: t('settings'), icon: <Settings />, href: '/settings' },
  ];

  return (
    <View
      backgroundColor="gray-100"
      width="size-3000"
      padding="size-200"
      UNSAFE_style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        borderRight: '1px solid var(--spectrum-global-color-gray-300)',
      }}
    >
      <View paddingY="size-200" paddingX="size-100">
        <Flex alignItems="center" gap="size-100">
          <RufiLogo size={28} />
          <Text
            UNSAFE_style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: 'var(--spectrum-global-color-blue-600)',
            }}
          >
            Rufi
          </Text>
        </Flex>
      </View>

      <Divider size="S" marginY="size-100" />

      <Flex direction="column" gap="size-50" flex={1}>
        {navItems.map((item) => (
          <ActionButton
            key={item.key}
            isQuiet
            onPress={() => router.push(item.href)}
            UNSAFE_style={{
              justifyContent: 'flex-start',
              backgroundColor: pathname.startsWith(item.href)
                ? 'var(--spectrum-global-color-blue-100)'
                : 'transparent',
            }}
          >
            <Flex alignItems="center" gap="size-100">
              {item.icon}
              <Text>{item.label}</Text>
            </Flex>
          </ActionButton>
        ))}
      </Flex>

      <Divider size="S" marginY="size-100" />

      <ActionButton isQuiet onPress={handleLogout}>
        <Flex alignItems="center" gap="size-100">
          <LogOut />
          <Text>{t('logout')}</Text>
        </Flex>
      </ActionButton>
    </View>
  );
}

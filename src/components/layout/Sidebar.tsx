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
import Close from '@spectrum-icons/workflow/Close';
import { RufiLogo } from '@/components/RufiLogo';

interface SidebarProps {
  isRoot: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

export function Sidebar({ isRoot, onClose, isMobile }: SidebarProps) {
  const t = useTranslations('nav');
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const handleNavClick = (href: string) => {
    router.push(href);
    if (onClose) onClose();
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
      width="100%"
      height="100%"
      UNSAFE_style={{
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--spectrum-global-color-gray-300)',
      }}
    >
      {/* Header */}
      <View padding="size-200">
        <Flex alignItems="center" justifyContent="space-between">
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
          
          {/* Close button for mobile */}
          {isMobile && onClose && (
            <ActionButton isQuiet onPress={onClose} aria-label="Close menu">
              <Close />
            </ActionButton>
          )}
        </Flex>
      </View>

      <Divider size="S" />

      {/* Navigation */}
      <View flex padding="size-200">
        <Flex direction="column" gap="size-50">
          {navItems.map((item) => (
          <ActionButton
            key={item.key}
            isQuiet
            onPress={() => handleNavClick(item.href)}
            UNSAFE_style={{
              justifyContent: 'flex-start',
              backgroundColor: pathname.startsWith(item.href)
                ? 'var(--spectrum-global-color-blue-100)'
                : 'transparent',
              borderRadius: '8px',
            }}
          >
            <Flex alignItems="center" gap="size-100">
              {item.icon}
              <Text>{item.label}</Text>
            </Flex>
          </ActionButton>
        ))}
        </Flex>
      </View>

      <Divider size="S" />

      {/* Logout */}
      <View padding="size-200">
        <ActionButton 
          isQuiet 
          onPress={handleLogout}
          width="100%"
          UNSAFE_style={{
            justifyContent: 'flex-start',
            borderRadius: '8px',
          }}
        >
          <Flex alignItems="center" gap="size-100">
            <LogOut />
            <Text>{t('logout')}</Text>
          </Flex>
        </ActionButton>
      </View>
    </View>
  );
}

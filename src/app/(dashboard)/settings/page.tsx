'use client';

import { useTranslations } from 'next-intl';
import {
  View,
  Heading,
  Text,
  Flex,
  Picker,
  Item,
  Switch,
} from '@adobe/react-spectrum';
import { useState } from 'react';

export default function SettingsPage() {
  const t = useTranslations('settings');
  
  // Initialize from cookies/localStorage on client side only
  const [locale, setLocale] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.cookie.match(/locale=([^;]+)/)?.[1] || 'en';
    }
    return 'en';
  });
  
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('colorScheme') === 'dark';
    }
    return false;
  });

  const handleLocaleChange = (key: React.Key | null) => {
    if (!key) return;
    const newLocale = key as string;
    setLocale(newLocale);
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000`;
    window.location.reload();
  };

  const handleDarkModeChange = (isDark: boolean) => {
    setDarkMode(isDark);
    localStorage.setItem('colorScheme', isDark ? 'dark' : 'light');
    window.location.reload();
  };

  return (
    <View>
      <Heading level={1} marginBottom="size-400">{t('title')}</Heading>

      <Flex direction="column" gap="size-400" maxWidth="size-4600">
        <View>
          <Picker
            label={t('language')}
            selectedKey={locale}
            onSelectionChange={handleLocaleChange}
            width="100%"
          >
            <Item key="en">English</Item>
            <Item key="id">Bahasa Indonesia</Item>
          </Picker>
        </View>

        <View>
          <Flex alignItems="center" justifyContent="space-between">
            <Text>{t('darkMode')}</Text>
            <Switch isSelected={darkMode} onChange={handleDarkModeChange} aria-label={t('darkMode')} />
          </Flex>
        </View>
      </Flex>
    </View>
  );
}

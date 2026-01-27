'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  View,
  Flex,
  TextField,
  Button,
  Heading,
  Text,
  Form,
} from '@adobe/react-spectrum';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('loginError'));
        return;
      }

      router.push('/files');
      router.refresh();
    } catch {
      setError(t('loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View
      backgroundColor="gray-50"
      minHeight="100vh"
      UNSAFE_style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        backgroundColor="gray-75"
        padding="size-500"
        borderRadius="medium"
        width="size-4600"
        UNSAFE_style={{
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Form onSubmit={handleSubmit}>
          <Flex direction="column" gap="size-300">
            <Heading level={1} UNSAFE_style={{ textAlign: 'center' }}>
              {t('loginTitle')}
            </Heading>
            <Text UNSAFE_style={{ textAlign: 'center', color: 'var(--spectrum-global-color-gray-700)' }}>
              {t('loginDescription')}
            </Text>

            {error && (
              <View
                backgroundColor="negative"
                padding="size-150"
                borderRadius="small"
              >
                <Text UNSAFE_style={{ color: 'white' }}>{error}</Text>
              </View>
            )}

            <TextField
              label={t('username')}
              value={username}
              onChange={setUsername}
              isRequired
              autoFocus
            />

            <TextField
              label={t('password')}
              type="password"
              value={password}
              onChange={setPassword}
              isRequired
            />

            <Button
              variant="accent"
              type="submit"
              isPending={isLoading}
              isDisabled={isLoading}
              UNSAFE_style={{ marginTop: '8px' }}
            >
              {t('login')}
            </Button>
          </Flex>
        </Form>
      </View>
    </View>
  );
}

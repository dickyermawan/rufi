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
} from '@adobe/react-spectrum'
import { RufiLogo } from '@/components/RufiLogo';

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
      minHeight="100vh"
      UNSAFE_style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 50%, #1e1b4b 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background elements */}
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
          animation: 'pulse 8s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-30%',
          right: '-30%',
          width: '80%',
          height: '80%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 60%)',
          animation: 'pulse 10s ease-in-out infinite reverse',
        }}
      />

      {/* Floating cloud decorations */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '10%',
          opacity: 0.1,
        }}
      >
        <RufiLogo size={120} />
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '8%',
          opacity: 0.08,
        }}
      >
        <RufiLogo size={180} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: '60%',
          left: '5%',
          opacity: 0.05,
        }}
      >
        <RufiLogo size={100} />
      </div>

      {/* Login Card */}
      <View
        UNSAFE_style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          padding: '48px 40px',
          width: '100%',
          maxWidth: '420px',
          margin: '20px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <Form onSubmit={handleSubmit}>
          <Flex direction="column" gap="size-300" alignItems="center">
            {/* Logo & Brand */}
            <Flex direction="column" alignItems="center" gap="size-200" marginBottom="size-200">
              <View
                UNSAFE_style={{
                  padding: '16px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  boxShadow: '0 10px 30px -10px rgba(59, 130, 246, 0.5)',
                }}
              >
                <RufiLogo size={48} />
              </View>
              <Heading 
                level={1} 
                UNSAFE_style={{ 
                  textAlign: 'center',
                  fontSize: '28px',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginTop: '8px',
                }}
              >
                {t('loginTitle')}
              </Heading>
              <Text 
                UNSAFE_style={{ 
                  textAlign: 'center', 
                  color: '#64748b',
                  fontSize: '14px',
                  maxWidth: '280px',
                }}
              >
                {t('loginDescription')}
              </Text>
            </Flex>

            {/* Error Message */}
            {error && (
              <View
                width="100%"
                UNSAFE_style={{
                  background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                  border: '1px solid #fca5a5',
                  padding: '12px 16px',
                  borderRadius: '12px',
                }}
              >
                <Flex alignItems="center" gap="size-100">
                  <Text UNSAFE_style={{ color: '#dc2626', fontSize: '14px' }}>
                    {error}
                  </Text>
                </Flex>
              </View>
            )}

            {/* Form Fields */}
            <View width="100%">
              <Flex direction="column" gap="size-200">
                <TextField
                  label={t('username')}
                  value={username}
                  onChange={setUsername}
                  isRequired
                  autoFocus
                  width="100%"
                  UNSAFE_className="login-field"
                />

                <TextField
                  label={t('password')}
                  type="password"
                  value={password}
                  onChange={setPassword}
                  isRequired
                  width="100%"
                  UNSAFE_className="login-field"
                />
              </Flex>
            </View>

            {/* Submit Button */}
            <Button
              variant="accent"
              type="submit"
              isPending={isLoading}
              isDisabled={isLoading || !username || !password}
              width="100%"
              UNSAFE_style={{ 
                marginTop: '16px',
                height: '48px',
                fontSize: '16px',
                fontWeight: '600',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                boxShadow: '0 4px 14px -4px rgba(59, 130, 246, 0.5)',
                transition: 'all 0.2s ease',
              }}
            >
              {isLoading ? t('login') + '...' : t('login')}
            </Button>

            {/* Footer */}
            <Text 
              UNSAFE_style={{ 
                marginTop: '24px',
                fontSize: '12px',
                color: '#94a3b8',
                textAlign: 'center',
              }}
            >
              Rufi - S3 File Manager
            </Text>
          </Flex>
        </Form>
      </View>

      {/* CSS Keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        
        .login-field input {
          border-radius: 10px !important;
          padding: 12px 14px !important;
        }
        
        .login-field label {
          font-weight: 500 !important;
          color: #475569 !important;
        }
      `}</style>
    </View>
  );
}

'use client';

import { useState, useEffect, useCallback, use } from 'react';
import {
  View,
  Flex,
  Heading,
  Text,
  Button,
  TextField,
  ProgressCircle,
} from '@adobe/react-spectrum';
import Download from '@spectrum-icons/workflow/Download';

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default function SharePage({ params }: SharePageProps) {
  const { token } = use(params);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchShare = useCallback(async (pwd?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const url = pwd
        ? `/api/share/${token}?password=${encodeURIComponent(pwd)}`
        : `/api/share/${token}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.requiresPassword) {
        setRequiresPassword(true);
        setFileName(data.fileName);
      } else if (response.ok && data.success) {
        setFileName(data.fileName);
        setDownloadUrl(data.downloadUrl);
        setRequiresPassword(false);
      } else {
        setError(data.error || 'Failed to load shared file');
      }
    } catch {
      setError('Failed to load shared file');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchShare();
  }, [fetchShare]);

  const handlePasswordSubmit = async () => {
    if (!password) return;
    setIsSubmitting(true);
    await fetchShare(password);
    setIsSubmitting(false);
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
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
          textAlign: 'center',
        }}
      >
        {isLoading ? (
          <Flex alignItems="center" justifyContent="center" height="size-2000">
            <ProgressCircle aria-label="Loading..." isIndeterminate />
          </Flex>
        ) : error ? (
          <Flex direction="column" alignItems="center" gap="size-200">
            <Heading level={2}>Error</Heading>
            <Text>{error}</Text>
          </Flex>
        ) : requiresPassword ? (
          <Flex direction="column" alignItems="center" gap="size-300">
            <Heading level={2}>Password Required</Heading>
            <Text>This file is protected. Enter the password to download.</Text>
            {fileName && <Text UNSAFE_style={{ fontWeight: 'bold' }}>{fileName}</Text>}
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              width="100%"
            />
            <Button
              variant="accent"
              onPress={handlePasswordSubmit}
              isPending={isSubmitting}
              isDisabled={!password}
            >
              Unlock
            </Button>
          </Flex>
        ) : (
          <Flex direction="column" alignItems="center" gap="size-300">
            <Heading level={2}>Download File</Heading>
            {fileName && <Text UNSAFE_style={{ fontWeight: 'bold' }}>{fileName}</Text>}
            <Button variant="accent" onPress={handleDownload}>
              <Download />
              <Text>Download</Text>
            </Button>
          </Flex>
        )}
      </View>
    </View>
  );
}

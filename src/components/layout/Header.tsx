'use client';

import { View, Flex, Text, Picker, Item } from '@adobe/react-spectrum';
import { useTranslations } from 'next-intl';
import { Key } from 'react';

interface HeaderProps {
  username: string;
  buckets: { id: string; name: string }[];
  selectedBucket: string;
  onBucketChange: (bucketId: Key | null) => void;
  isMobile?: boolean;
}

export function Header({ username, buckets, selectedBucket, onBucketChange, isMobile }: HeaderProps) {
  const t = useTranslations('files');

  return (
    <Flex 
      alignItems="center" 
      justifyContent="space-between" 
      flex={1}
      gap="size-200"
      UNSAFE_style={{ flexWrap: 'wrap' }}
    >
      <Flex alignItems="center" gap="size-200" flex={1}>
        {buckets.length > 0 && (
          <Picker
            label={isMobile ? undefined : t('selectBucket')}
            aria-label={t('selectBucket')}
            labelPosition="side"
            selectedKey={selectedBucket}
            onSelectionChange={onBucketChange}
            width={isMobile ? "100%" : "size-3000"}
            isQuiet={isMobile}
          >
            {buckets.map((bucket) => (
              <Item key={bucket.id}>{bucket.name}</Item>
            ))}
          </Picker>
        )}
      </Flex>

      {!isMobile && (
        <Flex alignItems="center" gap="size-100">
          <Text UNSAFE_style={{ 
            fontSize: '14px',
            color: 'var(--spectrum-global-color-gray-700)'
          }}>
            {username}
          </Text>
        </Flex>
      )}
    </Flex>
  );
}

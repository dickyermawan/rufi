'use client';

import { View, Flex, Text, Picker, Item } from '@adobe/react-spectrum';
import { useTranslations } from 'next-intl';
import { Key } from 'react';

interface HeaderProps {
  username: string;
  buckets: { id: string; name: string }[];
  selectedBucket: string;
  onBucketChange: (bucketId: Key | null) => void;
}

export function Header({ username, buckets, selectedBucket, onBucketChange }: HeaderProps) {
  const t = useTranslations('files');

  return (
    <View
      backgroundColor="gray-75"
      padding="size-200"
      UNSAFE_style={{
        borderBottom: '1px solid var(--spectrum-global-color-gray-300)',
      }}
    >
      <Flex alignItems="center" justifyContent="space-between">
        <Flex alignItems="center" gap="size-200">
          {buckets.length > 0 && (
            <Picker
              label={t('selectBucket')}
              labelPosition="side"
              selectedKey={selectedBucket}
              onSelectionChange={onBucketChange}
              width="size-3000"
            >
              {buckets.map((bucket) => (
                <Item key={bucket.id}>{bucket.name}</Item>
              ))}
            </Picker>
          )}
        </Flex>

        <Flex alignItems="center" gap="size-100">
          <Text>{username}</Text>
        </Flex>
      </Flex>
    </View>
  );
}

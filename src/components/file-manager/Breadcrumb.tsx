'use client';

import { Flex, Text, ActionButton } from '@adobe/react-spectrum';
import Home from '@spectrum-icons/workflow/Home';
import ChevronRight from '@spectrum-icons/workflow/ChevronRight';

interface BreadcrumbProps {
  path: string;
  onNavigate: (path: string) => void;
}

export function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
  const parts = path.split('/').filter(Boolean);

  const pathSegments = parts.map((part, index) => ({
    name: part,
    path: '/' + parts.slice(0, index + 1).join('/') + '/',
  }));

  return (
    <Flex alignItems="center" gap="size-50" UNSAFE_className="breadcrumb">
      <ActionButton isQuiet onPress={() => onNavigate('/')}>
        <Home size="S" />
      </ActionButton>

      {pathSegments.map((segment, index) => (
        <Flex key={segment.path} alignItems="center" gap="size-50">
          <ChevronRight size="S" />
          <ActionButton
            isQuiet
            onPress={() => onNavigate(segment.path)}
            isDisabled={index === pathSegments.length - 1}
          >
            <Text>{segment.name}</Text>
          </ActionButton>
        </Flex>
      ))}
    </Flex>
  );
}

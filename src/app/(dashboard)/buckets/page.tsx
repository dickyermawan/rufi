'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  View,
  Flex,
  Heading,
  Text,
  Button,
  ActionButton,
  TextField,
  Checkbox,
  DialogTrigger,
  Dialog,
  Content,
  Divider,
  ButtonGroup,
  TableView,
  TableHeader,
  TableBody,
  Column,
  Row,
  Cell,
  ProgressCircle,
} from '@adobe/react-spectrum';
import Add from '@spectrum-icons/workflow/Add';
import Delete from '@spectrum-icons/workflow/Delete';
import Edit from '@spectrum-icons/workflow/Edit';
import Checkmark from '@spectrum-icons/workflow/Checkmark';

interface Bucket {
  id: string;
  name: string;
  endpoint: string;
  region: string;
  isDefault: boolean;
}

export default function BucketsPage() {
  const t = useTranslations('buckets');
  const tCommon = useTranslations('common');
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editBucket, setEditBucket] = useState<Bucket | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [region, setRegion] = useState('auto');
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState('');

  const loadBuckets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/buckets');
      const data = await response.json();
      if (data.success) {
        setBuckets(data.buckets);
      }
    } catch {
      console.error('Failed to load buckets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBuckets();
  }, []);

  const resetForm = () => {
    setName('');
    setEndpoint('');
    setAccessKey('');
    setSecretKey('');
    setRegion('auto');
    setIsDefault(false);
    setError('');
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/buckets/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint,
          accessKey,
          secretKey,
          region,
          bucketName: name,
        }),
      });
      const data = await response.json();
      setTestResult({
        success: response.ok,
        message: response.ok ? t('connectionSuccess') : (data.error || t('connectionError')),
      });
    } catch {
      setTestResult({ success: false, message: t('connectionError') });
    } finally {
      setIsTesting(false);
    }
  };

  const handleAddBucket = async () => {
    setError('');
    try {
      const response = await fetch('/api/buckets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, endpoint, accessKey, secretKey, region, isDefault }),
      });
      const data = await response.json();
      if (response.ok) {
        setIsAddOpen(false);
        resetForm();
        loadBuckets();
      } else {
        setError(data.error || 'Failed to create bucket');
      }
    } catch {
      setError('Failed to create bucket');
    }
  };

  const handleUpdateBucket = async () => {
    if (!editBucket) return;
    setError('');
    try {
      const body: Record<string, unknown> = { name, endpoint, region, isDefault };
      if (accessKey) body.accessKey = accessKey;
      if (secretKey) body.secretKey = secretKey;

      const response = await fetch(`/api/buckets?id=${editBucket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok) {
        setEditBucket(null);
        resetForm();
        loadBuckets();
      } else {
        setError(data.error || 'Failed to update bucket');
      }
    } catch {
      setError('Failed to update bucket');
    }
  };

  const handleDeleteBucket = async (bucketId: string) => {
    if (!confirm('Are you sure you want to delete this bucket?')) return;
    try {
      const response = await fetch(`/api/buckets?id=${bucketId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        loadBuckets();
      }
    } catch {
      console.error('Failed to delete bucket:');
    }
  };

  const openEditDialog = (bucket: Bucket) => {
    setEditBucket(bucket);
    setName(bucket.name);
    setEndpoint(bucket.endpoint);
    setAccessKey('');
    setSecretKey('');
    setRegion(bucket.region);
    setIsDefault(bucket.isDefault);
    setError('');
    setTestResult(null);
  };

  if (isLoading) {
    return (
      <Flex alignItems="center" justifyContent="center" height="size-3000">
        <ProgressCircle aria-label="Loading..." isIndeterminate />
      </Flex>
    );
  }

  const formContent = (
    <Flex direction="column" gap="size-200">
      {error && (
        <View backgroundColor="negative" padding="size-100" borderRadius="regular">
          <Text UNSAFE_style={{ color: 'white' }}>{error}</Text>
        </View>
      )}
      {testResult && (
        <View
          backgroundColor={testResult.success ? 'positive' : 'negative'}
          padding="size-100"
          borderRadius="regular"
        >
          <Text UNSAFE_style={{ color: 'white' }}>{testResult.message}</Text>
        </View>
      )}
      <TextField label={t('name')} value={name} onChange={setName} isRequired />
      <TextField label={t('endpoint')} value={endpoint} onChange={setEndpoint} isRequired />
      <TextField label={t('accessKey')} value={accessKey} onChange={setAccessKey} isRequired={!editBucket} />
      <TextField
        label={t('secretKey')}
        type="password"
        value={secretKey}
        onChange={setSecretKey}
        isRequired={!editBucket}
        description={editBucket ? 'Leave empty to keep current key' : ''}
      />
      <TextField label={t('region')} value={region} onChange={setRegion} />
      <Checkbox isSelected={isDefault} onChange={setIsDefault}>
        {t('isDefault')}
      </Checkbox>
      <Button variant="secondary" onPress={handleTestConnection} isPending={isTesting}>
        {t('testConnection')}
      </Button>
    </Flex>
  );

  return (
    <View>
      <Flex alignItems="center" justifyContent="space-between" marginBottom="size-300">
        <Heading level={1}>{t('title')}</Heading>
        <DialogTrigger isOpen={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) resetForm(); }}>
          <Button variant="accent">
            <Add />
            <Text>{t('addBucket')}</Text>
          </Button>
          <Dialog>
            <Heading>{t('addBucket')}</Heading>
            <Divider />
            <Content>{formContent}</Content>
            <ButtonGroup>
              <Button variant="secondary" onPress={() => { setIsAddOpen(false); resetForm(); }}>
                {tCommon('cancel')}
              </Button>
              <Button variant="accent" onPress={handleAddBucket}>
                {tCommon('create')}
              </Button>
            </ButtonGroup>
          </Dialog>
        </DialogTrigger>
      </Flex>

      <TableView aria-label="Buckets table" selectionMode="none">
        <TableHeader>
          <Column key="name" width="25%">{t('name')}</Column>
          <Column key="endpoint" width="35%">{t('endpoint')}</Column>
          <Column key="region" width="15%">{t('region')}</Column>
          <Column key="default" width="10%">{t('isDefault')}</Column>
          <Column key="actions" width="15%">{tCommon('actions')}</Column>
        </TableHeader>
        <TableBody>
          {buckets.map((bucket) => (
            <Row key={bucket.id}>
              <Cell>{bucket.name}</Cell>
              <Cell>{bucket.endpoint}</Cell>
              <Cell>{bucket.region}</Cell>
              <Cell>{bucket.isDefault ? <Checkmark size="S" /> : null}</Cell>
              <Cell>
                <Flex gap="size-100">
                  <ActionButton isQuiet onPress={() => openEditDialog(bucket)}>
                    <Edit size="S" />
                  </ActionButton>
                  <ActionButton isQuiet onPress={() => handleDeleteBucket(bucket.id)}>
                    <Delete size="S" />
                  </ActionButton>
                </Flex>
              </Cell>
            </Row>
          ))}
        </TableBody>
      </TableView>

      {/* Edit Bucket Dialog */}
      {editBucket && (
        <DialogTrigger isOpen={!!editBucket} onOpenChange={(open) => { if (!open) { setEditBucket(null); resetForm(); } }}>
          <span />
          <Dialog>
            <Heading>{t('editBucket')}</Heading>
            <Divider />
            <Content>{formContent}</Content>
            <ButtonGroup>
              <Button variant="secondary" onPress={() => { setEditBucket(null); resetForm(); }}>
                {tCommon('cancel')}
              </Button>
              <Button variant="accent" onPress={handleUpdateBucket}>
                {tCommon('save')}
              </Button>
            </ButtonGroup>
          </Dialog>
        </DialogTrigger>
      )}
    </View>
  );
}

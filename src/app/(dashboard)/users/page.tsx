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
import Settings from '@spectrum-icons/workflow/Settings';
import User from '@spectrum-icons/workflow/User';

interface UserType {
  id: string;
  username: string;
  isRoot: boolean;
  createdAt: string;
  bucketAccess: Array<{
    bucket: { id: string; name: string };
  }>;
}

// Mobile User Card Component
function UserCard({ 
  user, 
  onEdit, 
  onAccess, 
  onDelete,
  t,
}: { 
  user: UserType; 
  onEdit: () => void; 
  onAccess: () => void;
  onDelete: () => void;
  t: (key: string) => string;
}) {
  return (
    <View
      backgroundColor="gray-75"
      padding="size-200"
      borderRadius="medium"
      UNSAFE_style={{
        border: '1px solid var(--spectrum-global-color-gray-300)',
      }}
    >
      <Flex direction="column" gap="size-150">
        <Flex alignItems="center" gap="size-100">
          <View
            backgroundColor={user.isRoot ? 'blue-400' : 'gray-300'}
            padding="size-100"
            borderRadius="regular"
          >
            <User size="S" />
          </View>
          <Flex direction="column" flex={1}>
            <Text UNSAFE_style={{ fontWeight: 'bold', fontSize: '16px' }}>
              {user.username}
            </Text>
            <Text UNSAFE_style={{ fontSize: '12px', color: 'var(--spectrum-global-color-gray-600)' }}>
              {user.isRoot ? 'Root Admin' : 'User'}
            </Text>
          </Flex>
        </Flex>

        <Divider size="S" />

        <View>
          <Text UNSAFE_style={{ fontSize: '12px', color: 'var(--spectrum-global-color-gray-600)' }}>
            {t('bucketAccess')}
          </Text>
          <Text UNSAFE_style={{ fontSize: '13px' }}>
            {user.isRoot
              ? 'All buckets'
              : user.bucketAccess.map((a) => a.bucket.name).join(', ') || 'None'}
          </Text>
        </View>

        <Flex gap="size-100" marginTop="size-100">
          <ActionButton flex={1} onPress={onEdit}>
            <Edit size="S" />
            <Text>Edit</Text>
          </ActionButton>
          <ActionButton flex={1} onPress={onAccess}>
            <Settings size="S" />
            <Text>Access</Text>
          </ActionButton>
          <ActionButton onPress={onDelete}>
            <Delete size="S" />
          </ActionButton>
        </Flex>
      </Flex>
    </View>
  );
}

export default function UsersPage() {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserType | null>(null);
  const [accessUser, setAccessUser] = useState<UserType | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRoot, setIsRoot] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch {
      console.error('Failed to load users:');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async () => {
    setError('');
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, isRoot }),
      });
      const data = await response.json();
      if (response.ok) {
        setIsAddOpen(false);
        setUsername('');
        setPassword('');
        setIsRoot(false);
        loadUsers();
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch {
      setError('Failed to create user');
    }
  };

  const handleUpdateUser = async () => {
    if (!editUser) return;
    setError('');
    try {
      const body: Record<string, unknown> = {};
      if (username && username !== editUser.username) body.username = username;
      if (password) body.password = password;
      if (isRoot !== editUser.isRoot) body.isRoot = isRoot;

      const response = await fetch(`/api/users?id=${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok) {
        setEditUser(null);
        setUsername('');
        setPassword('');
        setIsRoot(false);
        loadUsers();
      } else {
        setError(data.error || 'Failed to update user');
      }
    } catch {
      setError('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        loadUsers();
      }
    } catch {
      console.error('Failed to delete user:');
    }
  };

  const openEditDialog = (user: UserType) => {
    setEditUser(user);
    setUsername(user.username);
    setPassword('');
    setIsRoot(user.isRoot);
    setError('');
  };

  if (isLoading) {
    return (
      <Flex alignItems="center" justifyContent="center" height="size-3000">
        <ProgressCircle aria-label="Loading..." isIndeterminate />
      </Flex>
    );
  }

  return (
    <View>
      <Flex 
        alignItems="center" 
        justifyContent="space-between" 
        marginBottom="size-300"
        wrap={isMobile ? 'wrap' : 'nowrap'}
        gap="size-200"
      >
        <Heading level={1}>{t('title')}</Heading>
        <DialogTrigger isOpen={isAddOpen} onOpenChange={setIsAddOpen}>
          <Button variant="accent" width={isMobile ? '100%' : undefined}>
            <Add />
            <Text>{t('addUser')}</Text>
          </Button>
          <Dialog>
            <Heading>{t('addUser')}</Heading>
            <Divider />
            <Content>
              <Flex direction="column" gap="size-200">
                {error && (
                  <View backgroundColor="negative" padding="size-100" borderRadius="regular">
                    <Text UNSAFE_style={{ color: 'white' }}>{error}</Text>
                  </View>
                )}
                <TextField
                  label={t('username')}
                  value={username}
                  onChange={setUsername}
                  isRequired
                />
                <TextField
                  label={t('password')}
                  type="password"
                  value={password}
                  onChange={setPassword}
                  isRequired
                />
                <Checkbox isSelected={isRoot} onChange={setIsRoot}>
                  {t('isRoot')}
                </Checkbox>
              </Flex>
            </Content>
            <ButtonGroup>
              <Button variant="secondary" onPress={() => setIsAddOpen(false)}>
                {tCommon('cancel')}
              </Button>
              <Button variant="accent" onPress={handleAddUser}>
                {tCommon('create')}
              </Button>
            </ButtonGroup>
          </Dialog>
        </DialogTrigger>
      </Flex>

      {/* Mobile Card View */}
      {isMobile ? (
        <Flex direction="column" gap="size-200">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onEdit={() => openEditDialog(user)}
              onAccess={() => setAccessUser(user)}
              onDelete={() => handleDeleteUser(user.id)}
              t={t}
            />
          ))}
          {users.length === 0 && (
            <View padding="size-400" UNSAFE_style={{ textAlign: 'center' }}>
              <Text UNSAFE_style={{ color: 'var(--spectrum-global-color-gray-600)' }}>
                No users found
              </Text>
            </View>
          )}
        </Flex>
      ) : (
        /* Desktop Table View */
        <TableView aria-label="Users table" selectionMode="none">
          <TableHeader>
            <Column key="username" width="30%">{t('username')}</Column>
            <Column key="isRoot" width="15%">{t('isRoot')}</Column>
            <Column key="buckets" width="35%">{t('bucketAccess')}</Column>
            <Column key="actions" width="20%">{tCommon('actions')}</Column>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <Row key={user.id}>
                <Cell>{user.username}</Cell>
                <Cell>{user.isRoot ? 'Yes' : 'No'}</Cell>
                <Cell>
                  {user.isRoot
                    ? 'All buckets'
                    : user.bucketAccess.map((a) => a.bucket.name).join(', ') || 'None'}
                </Cell>
                <Cell>
                  <Flex gap="size-100">
                    <ActionButton isQuiet onPress={() => openEditDialog(user)}>
                      <Edit size="S" />
                    </ActionButton>
                    <ActionButton isQuiet onPress={() => setAccessUser(user)}>
                      <Settings size="S" />
                    </ActionButton>
                    <ActionButton isQuiet onPress={() => handleDeleteUser(user.id)}>
                      <Delete size="S" />
                    </ActionButton>
                  </Flex>
                </Cell>
              </Row>
            ))}
          </TableBody>
        </TableView>
      )}

      {/* Edit User Dialog */}
      {editUser && (
        <DialogTrigger isOpen={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
          <span />
          <Dialog>
            <Heading>{t('editUser')}</Heading>
            <Divider />
            <Content>
              <Flex direction="column" gap="size-200">
                {error && (
                  <View backgroundColor="negative" padding="size-100" borderRadius="regular">
                    <Text UNSAFE_style={{ color: 'white' }}>{error}</Text>
                  </View>
                )}
                <TextField
                  label={t('username')}
                  value={username}
                  onChange={setUsername}
                />
                <TextField
                  label={t('password')}
                  type="password"
                  value={password}
                  onChange={setPassword}
                  description="Leave empty to keep current password"
                />
                <Checkbox isSelected={isRoot} onChange={setIsRoot}>
                  {t('isRoot')}
                </Checkbox>
              </Flex>
            </Content>
            <ButtonGroup>
              <Button variant="secondary" onPress={() => setEditUser(null)}>
                {tCommon('cancel')}
              </Button>
              <Button variant="accent" onPress={handleUpdateUser}>
                {tCommon('save')}
              </Button>
            </ButtonGroup>
          </Dialog>
        </DialogTrigger>
      )}

      {/* Access Management Dialog - simplified for now */}
      {accessUser && (
        <DialogTrigger isOpen={!!accessUser} onOpenChange={(open) => !open && setAccessUser(null)}>
          <span />
          <Dialog size="L">
            <Heading>{t('bucketAccess')}: {accessUser.username}</Heading>
            <Divider />
            <Content>
              <Text>
                Configure bucket access and permissions for this user.
                This feature requires selecting buckets and setting individual permissions.
              </Text>
              {/* Full implementation would include bucket selection and permission checkboxes */}
            </Content>
            <ButtonGroup>
              <Button variant="secondary" onPress={() => setAccessUser(null)}>
                {tCommon('close')}
              </Button>
            </ButtonGroup>
          </Dialog>
        </DialogTrigger>
      )}
    </View>
  );
}

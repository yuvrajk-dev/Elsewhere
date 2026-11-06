import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ChatRow } from '@/components/social-rows';
import { AppText, EmptyState, PageGutter, ScrollPage, ScreenHeader, ScreenShell, SearchField } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { useApp } from '@/state/app-provider';

export default function ChatsScreen() {
  const app = useApp();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const results = useMemo(() => app.chats.filter((chat) => `${chat.person.displayName} ${chat.person.username} ${chat.latestMessage}`.toLowerCase().includes(query.toLowerCase())), [app.chats, query]);

  return (
    <ScreenShell>
      <ScrollPage>
        <PageGutter>
          <ScreenHeader title="Chats" subtitle="Your private conversations." />
          <SearchField value={query} onChangeText={setQuery} placeholder="Search chats" compact accessibilityLabel="Search chats" />
          <AppText variant="caption" color={colors.muted} style={{ marginTop: spacing.three, marginBottom: spacing.two }}>Only conversations with a message appear here.</AppText>
          {results.length ? results.map((chat) => (
            <ChatRow key={chat.id} chat={chat} onPress={() => router.push(`/chat/${chat.id}` as never)} />
          )) : (
            <EmptyState title={query ? 'No conversations found' : 'Your chats will show up here'} description={query ? 'Try another name or message.' : 'Start by sending a message to a friend.'} />
          )}
        </PageGutter>
      </ScrollPage>
    </ScreenShell>
  );
}

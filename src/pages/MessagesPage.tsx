import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Loader2, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

interface Conversation {
  user_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  last_message?: string;
  last_message_time?: string;
  unreadCount?: number;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    loadConversations();
  }, [user]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat);
    }
  }, [selectedChat]);

  // keep a ref to selectedChat so realtime handler can access latest value
  const selectedChatRef = useRef<string | null>(null);
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Setup single realtime subscription on mount
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messages_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as Message;
          // If the message is part of the currently open chat, append it
          if (
            (newMsg.sender_id === user.id && newMsg.receiver_id === selectedChatRef.current) ||
            (newMsg.sender_id === selectedChatRef.current && newMsg.receiver_id === user.id)
          ) {
            setMessages((prev) => [...prev, newMsg]);
          } else {
            // If current user is the receiver and the chat is not open, increment unread count
            if (newMsg.receiver_id === user.id) {
              setConversations((prev) =>
                prev.map((c) =>
                  c.user_id === newMsg.sender_id
                    ? { ...c, unreadCount: (c.unreadCount || 0) + 1 }
                    : c
                )
              );
            }
          }
          // Optionally update conversations list or other UI here
        }
      )
      .subscribe();

    return () => {
      try {
        channel.unsubscribe();
      } catch (e) {
        // ignore
      }
    };
  }, [user]);

  // Listen for global navigation requests to open a specific chat
  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent;
      const detail = ev?.detail;
      if (detail?.page === 'messages' && detail?.userId) {
        setSelectedChat(detail.userId);
      }
    };
    window.addEventListener('app:navigate', handler as EventListener);
    return () => window.removeEventListener('app:navigate', handler as EventListener);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    if (!user) return;

    // Get users that the current user follows or is followed by
    const { data: followData } = await supabase
      .from('followers')
      .select('follower_id, following_id')
      .or(`follower_id.eq.${user.id},following_id.eq.${user.id}`);

    if (!followData) {
      setLoading(false);
      return;
    }

    const userIds = new Set<string>();
    followData.forEach((f) => {
      if (f.follower_id !== user.id) userIds.add(f.follower_id);
      if (f.following_id !== user.id) userIds.add(f.following_id);
    });

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, full_name, avatar_url')
      .in('user_id', Array.from(userIds));

    // also load unread messages for current user grouped by sender
    const { data: unreadMessages } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('receiver_id', user.id)
      .eq('read', false);

    const counts: Record<string, number> = {};
    if (unreadMessages) {
      unreadMessages.forEach((m: any) => {
        counts[m.sender_id] = (counts[m.sender_id] || 0) + 1;
      });
    }

    if (profiles) {
      const convs = (profiles as any[]).map((p) => ({
        user_id: p.user_id,
        username: p.username,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        unreadCount: counts[p.user_id] || 0,
      }));
      setConversations(convs as Conversation[]);
    }
    setLoading(false);
  };

  const loadMessages = async (otherUserId: string) => {
    if (!user) return;

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', otherUserId);
      // reset unread count for this conversation
      setConversations((prev) => prev.map((c) => (c.user_id === otherUserId ? { ...c, unreadCount: 0 } : c)));
    }
  };

  // subscribeToMessages kept for compatibility but realtime handled globally above
  const subscribeToMessages = () => {
    return () => {};
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedChat || !newMessage.trim()) return;
    const content = newMessage.trim();
    setNewMessage('');

    // Insert and get the created row so we can optimistically append
    const { data, error } = await supabase
      .from('messages')
      .insert({ sender_id: user.id, receiver_id: selectedChat, content })
      .select()
      .single();

    if (error) {
      // optionally show error
      return;
    }

    if (data) {
      setMessages((prev) => [...prev, data as Message]);
      // scroll after adding
      setTimeout(() => scrollToBottom(), 100);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const selectedConversation = conversations.find((c) => c.user_id === selectedChat);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)]">
      <Card className="h-full flex overflow-hidden relative">
        {/* Conversations List */}
        {(!isMobile || (isMobile && !selectedChat)) && (
          <div className="w-full md:w-80 border-r overflow-y-auto">
          <div className="p-4 border-b">
            <h2 className="font-bold text-lg">Mensagens</h2>
          </div>
          <div className="divide-y">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>Nenhuma conversa ainda.</p>
                <p className="text-sm mt-2">
                  Siga outros usuários para começar a conversar!
                </p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.user_id}
                  onClick={() => setSelectedChat(conv.user_id)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-muted transition-colors ${
                    selectedChat === conv.user_id ? 'bg-muted' : ''
                  }`}
                >
                  <Avatar>
                    <AvatarImage src={conv.avatar_url || ''} />
                    <AvatarFallback>
                      {conv.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="font-semibold">{conv.full_name || conv.username}</p>
                    <p className="text-sm text-muted-foreground">@{conv.username}</p>
                    {conv.unreadCount ? (
                      <p className="text-sm text-primary mt-1">
                        {conv.unreadCount === 1
                          ? '1 Nova mensagem'
                          : conv.unreadCount > 4
                          ? '4+ Novas mensagens'
                          : `${conv.unreadCount} Novas mensagens`}
                      </p>
                    ) : null}
                  </div>
                </button>
              ))
            )}
          </div>
          </div>
        )}

        {/* Chat Area */}
        {(!isMobile || (isMobile && selectedChat)) && (
          <div className="flex-1 flex flex-col">
          {selectedChat && selectedConversation ? (
            <>
              {/* Chat Header */}
              {isMobile ? (
                <div className="p-4 border-b relative flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedChat(null)}
                    className="absolute left-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>

                  <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
                    <p className="font-semibold">{selectedConversation.full_name || selectedConversation.username}</p>
                    <p className="text-sm text-muted-foreground">@{selectedConversation.username}</p>
                  </div>

                  <div className="ml-auto">
                    <Avatar>
                      <AvatarImage src={selectedConversation.avatar_url || ''} />
                      <AvatarFallback>
                        {selectedConversation.username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-b flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedConversation.avatar_url || ''} />
                    <AvatarFallback>
                      {selectedConversation.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      {selectedConversation.full_name || selectedConversation.username}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      @{selectedConversation.username}
                    </p>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        message.sender_id === user?.id ? 'bg-primary text-primary-foreground' : 'text-white'
                      }`}
                      style={
                        message.sender_id === user?.id
                          ? undefined
                          : { backgroundColor: '#012169' }
                      }
                    >
                      <p>{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender_id === user?.id
                            ? 'text-primary-foreground/70'
                            : 'text-white/80'
                        }`}
                      >
                        {formatDistanceToNow(new Date(message.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p>Selecione uma conversa para começar</p>
            </div>
          )}
          </div>
        )}

        {/* overlay removed: chat area now handles mobile layout (header/back button/centered name) */}
      </Card>
    </div>
  );
}

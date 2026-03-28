import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { SupportService } from '../../services/supportService';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { ErrorMessage } from '../../components/Common/ErrorMessage';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messageList: {
    padding: 12,
  },
  messageRow: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#1a5490',
  },
  systemBubble: {
    backgroundColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
  },
  systemText: {
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a5490',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default function SupportChatScreen() {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (currentConversation) {
      loadMessages();
    }
  }, [currentConversation]);

  const loadConversations = async () => {
    try {
      setError(null);
      const result = await SupportService.getConversations();
      setConversations(result.data || []);
      
      if (result.data?.length > 0 && !currentConversation) {
        setCurrentConversation(result.data[0]._id);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const result = await SupportService.getMessages(currentConversation);
      setMessages(result.data || []);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentConversation) return;

    const message = messageText;
    setSending(true);
    setMessageText('');

    try {
      const result = await SupportService.sendMessage(currentConversation, message);
      const newMessage = {
        _id: result.data._id,
        message,
        userId: 'user',
        createdAt: new Date(),
      };
      setMessages([...messages, newMessage]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to send message');
      setMessageText(message);
    } finally {
      setSending(false);
    }
  };

  const handleCreateConversation = async () => {
    Alert.prompt('New Conversation', 'Enter a subject for your support request:', [
      {
        text: 'Cancel',
        onPress: () => {},
      },
      {
        text: 'Create',
        onPress: async (subject) => {
          if (!subject?.trim()) return;
          
          try {
            const result = await SupportService.createConversation(subject);
            setConversations([result.data, ...conversations]);
            setCurrentConversation(result.data._id);
          } catch (err) {
            Alert.alert('Error', err?.message || 'Failed to create conversation');
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingSpinner />;
  if (error && !conversations.length) return <ErrorMessage message={error} />;

  if (!currentConversation) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={styles.emptyText}>No support conversations</Text>
        <TouchableOpacity
          style={{
            marginTop: 20,
            paddingVertical: 10,
            paddingHorizontal: 20,
            backgroundColor: '#1a5490',
            borderRadius: 6,
          }}
          onPress={handleCreateConversation}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Start New Conversation</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.messageList}
          scrollEnabled={messages.length > 0}
          renderItem={({ item }) => {
            const isUserMessage = item.userId === 'user' || item.userId?.id === 'user';
            return (
              <View style={[styles.messageRow, isUserMessage && styles.userMessage]}>
                <View
                  style={[
                    styles.messageBubble,
                    isUserMessage ? styles.userBubble : styles.systemBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isUserMessage ? styles.userText : styles.systemText,
                    ]}
                  >
                    {item.message}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
            placeholderTextColor="#ccc"
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
            disabled={sending || !messageText.trim()}
          >
            <Icon name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}


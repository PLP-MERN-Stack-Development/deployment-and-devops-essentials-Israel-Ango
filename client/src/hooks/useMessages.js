import { useState, useCallback, useRef } from 'react';
import { socket } from '../socket';

export const useMessages = (currentRoom) => {
  const [messages, setMessages] = useState([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const messageCountRef = useRef(0);
  const loadedMessageCountRef = useRef(0);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(() => {
    if (isLoadingMore || !hasMoreMessages) return;

    setIsLoadingMore(true);
    socket.emit('load-more-messages', {
      room: currentRoom,
      limit: 20,
      offset: loadedMessageCountRef.current
    });
  }, [currentRoom, isLoadingMore, hasMoreMessages]);

  // Search messages
  const searchMessages = useCallback((query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    socket.emit('search-messages', {
      room: currentRoom,
      query: query.trim()
    });
  }, [currentRoom]);

  // Handle incoming messages
  const addMessage = useCallback((message) => {
    setMessages(prev => {
      // Avoid duplicates
      if (prev.some(msg => msg.id === message.id)) {
        return prev;
      }
      
      const newMessages = [...prev, message];
      messageCountRef.current = newMessages.length;
      return newMessages;
    });
  }, []);

  // Handle message delivery status
  const markMessageDelivered = useCallback((messageId) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, delivered: true } : msg
    ));
  }, []);

  // Handle message read receipts
  const markMessageRead = useCallback((messageId, readBy) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId 
        ? { 
            ...msg, 
            readBy: [...(msg.readBy || []), readBy].filter((v, i, a) => a.indexOf(v) === i)
          } 
        : msg
    ));
  }, []);

  // Clear search results
  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setIsSearching(false);
  }, []);

  // Reset messages when changing rooms
  const resetMessages = useCallback(() => {
    setMessages([]);
    setHasMoreMessages(true);
    loadedMessageCountRef.current = 0;
    messageCountRef.current = 0;
  }, []);

  return {
    messages,
    searchResults,
    hasMoreMessages,
    isLoadingMore,
    isSearching,
    loadMoreMessages,
    searchMessages,
    addMessage,
    markMessageDelivered,
    markMessageRead,
    clearSearch,
    resetMessages,
    setMessages,
    setHasMoreMessages,
    setIsLoadingMore
  };
};
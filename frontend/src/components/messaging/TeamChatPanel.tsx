'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { 
  Users, 
  MessageSquare, 
  Plus, 
  X, 
  Send,
  Hash
} from 'lucide-react';
import { RootState } from '@/store';
import toast from 'react-hot-toast';

interface TeamConversation {
  id: string;
  title: string;
  last_message: string;
  last_message_time: string;
  participant_count: number;
  unread_count: number;
}

interface TeamChatPanelProps {
  onClose: () => void;
}

export default function TeamChatPanel({ onClose }: TeamChatPanelProps) {
  const { idToken, userProfile } = useSelector((state: RootState) => state.auth);
  const [teamConversations, setTeamConversations] = useState<TeamConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<TeamConversation | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  const loadTeamConversations = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/messaging/team-conversations`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const formattedConversations: TeamConversation[] = data.conversations.map((conv: any) => ({
          id: conv.id,
          title: conv.title,
          last_message: conv.last_message_content || 'No messages yet',
          last_message_time: conv.last_message_time || conv.created_at,
          participant_count: conv.participant_count || 0,
          unread_count: 0 // Will be calculated separately
        }));
        
        setTeamConversations(formattedConversations);
      } else {
        console.error('Failed to load team conversations:', response.status);
        setTeamConversations([]);
      }
    } catch (error) {
      console.error('Failed to load team conversations:', error);
      setTeamConversations([]);
    } finally {
      setLoading(false);
    }
  }, [idToken, API_URL]);

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/messaging/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      } else {
        console.error('Failed to load messages:', response.status);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    }
  }, [idToken, API_URL]);

  const createTeamConversation = async () => {
    if (!newChatTitle.trim()) {
      toast.error('Please enter a chat title');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/messaging/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversation_type: 'team_internal',
          title: newChatTitle,
          participants: [], // Will be populated with security team members
          is_private: false
        })
      });

      if (response.ok) {
        const conversation = await response.json();
        setNewChatTitle('');
        setShowCreateDialog(false);
        loadTeamConversations();
        toast.success('Team chat created successfully');
      } else {
        toast.error('Failed to create team chat');
      }
    } catch (error) {
      console.error('Failed to create team chat:', error);
      toast.error('Failed to create team chat');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const response = await fetch(`${API_URL}/api/messaging/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newMessage,
          message_type: 'text'
        })
      });

      if (response.ok) {
        setNewMessage('');
        loadMessages(selectedConversation.id);
        loadTeamConversations(); // Refresh conversation list to update last message
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  useEffect(() => {
    loadTeamConversations();
  }, [loadTeamConversations]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation, loadMessages]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);

    if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-6xl h-[80vh] bg-[#1A1D23] rounded-lg border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-[#2A2D35]">
          <div className="flex items-center space-x-3">
            <Users className="h-5 w-5 text-[#00D4FF]" />
            <div>
              <h2 className="text-lg font-bold text-white">Security Team Chat</h2>
              <p className="text-sm text-gray-400">Internal team communication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex h-[calc(80vh-80px)]">
          {/* Conversations List */}
          <div className="w-1/3 border-r border-gray-700 flex flex-col">
            {/* Create New Chat Button */}
            <div className="p-4 border-b border-gray-700">
              <button
                onClick={() => setShowCreateDialog(true)}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-[#00D4FF] hover:bg-[#00C4EF] text-[#1A1D23] font-medium rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>New Team Chat</span>
              </button>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#00D4FF]"></div>
                </div>
              ) : teamConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                  <MessageSquare className="h-8 w-8 mb-2" />
                  <p className="text-sm">No team chats yet</p>
                  <p className="text-xs">Create one to start collaborating</p>
                </div>
              ) : (
                teamConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-4 border-b border-gray-700 cursor-pointer transition-colors hover:bg-[#2A2D35] ${
                      selectedConversation?.id === conversation.id ? 'bg-[#2A2D35] border-l-4 border-l-[#00D4FF]' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <Hash className="h-6 w-6 text-[#00D4FF] bg-[#00D4FF]/20 p-1 rounded" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-white truncate">
                            {conversation.title}
                          </h4>
                          {conversation.unread_count > 0 && (
                            <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                              {conversation.unread_count}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-400 truncate mb-1">
                          {conversation.last_message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(conversation.last_message_time)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {conversation.participant_count} members
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-700 bg-[#2A2D35]">
                  <h3 className="font-medium text-white">{selectedConversation.title}</h3>
                  <p className="text-sm text-gray-400">{selectedConversation.participant_count} members</p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message, index) => (
                    <div key={index} className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-[#00D4FF] rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-[#1A1D23]">
                            {message.sender_name?.charAt(0) || 'U'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-white">{message.sender_name}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-700">
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder={`Message #${selectedConversation.title.toLowerCase()}`}
                      className="flex-1 px-4 py-2 bg-[#2A2D35] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#00D4FF]"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-[#00D4FF] hover:bg-[#00C4EF] disabled:opacity-50 disabled:cursor-not-allowed text-[#1A1D23] font-medium rounded-lg transition-colors"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Users className="h-16 w-16 mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Team Chat</h3>
                <p className="text-sm text-center">
                  Choose a team chat from the list or create a new one to start collaborating with your team.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create New Chat Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-[#2A2D35] rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Create New Team Chat</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Chat Title
              </label>
              <input
                type="text"
                value={newChatTitle}
                onChange={(e) => setNewChatTitle(e.target.value)}
                placeholder="e.g., Daily Standup, Incident Response"
                className="w-full px-3 py-2 bg-[#1A1D23] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#00D4FF]"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewChatTitle('');
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createTeamConversation}
                disabled={!newChatTitle.trim()}
                className="px-4 py-2 bg-[#00D4FF] hover:bg-[#00C4EF] disabled:opacity-50 disabled:cursor-not-allowed text-[#1A1D23] font-medium rounded-lg transition-colors"
              >
                Create Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { 
  Send, 
  Paperclip, 
  Shield, 
  User, 
  CheckCheck,
  X,
  Image,
  FileText,
  Download
} from 'lucide-react';
import { RootState } from '@/store';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'employee' | 'security_team' | 'admin';
  content: string;
  timestamp: string;
  attachments?: File[];
  is_read: boolean;
  message_type: 'text' | 'file' | 'system';
}

interface MessageThreadProps {
  incidentId?: string;
  onClose?: () => void;
}

export default function MessageThread({ incidentId, onClose }: MessageThreadProps) {
  const { userProfile, idToken } = useSelector((state: RootState) => state.auth);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  const WS_URL = API_URL.replace('http', 'ws');

  useEffect(() => {
    // Initialize WebSocket connection
    initializeWebSocket();
    
    // Load existing messages
    loadMessages();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [incidentId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeWebSocket = useCallback(() => {
    try {
      const wsUrl = `${WS_URL}/api/messaging/ws/${incidentId || 'general'}?token=${idToken}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket connected');
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'message') {
          setMessages(prev => [...prev, data.message]);
        } else if (data.type === 'typing') {
          setIsTyping(data.is_typing && data.user_id !== userProfile?.uid);
        } else if (data.type === 'status') {
          toast.success(data.message);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket disconnected');
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          initializeWebSocket();
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }, [incidentId, idToken, userProfile?.uid, WS_URL]);

  const loadMessages = useCallback(async () => {
    try {
      const endpoint = incidentId 
        ? `/api/messaging/incident/${incidentId}/messages`
        : '/api/messaging/general';
        
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [incidentId, idToken, API_URL]);

  const sendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast.error('Connection lost. Please try again.');
      return;
    }

    try {
      const messageData = {
        type: 'send_message',
        content: newMessage.trim(),
        incident_id: incidentId,
        sender_id: userProfile?.uid,
        sender_name: userProfile?.full_name,
        sender_role: userProfile?.role,
        attachments: attachments.length > 0 ? attachments.map(f => f.name) : undefined
      };

      wsRef.current.send(JSON.stringify(messageData));

      // Handle file uploads separately
      if (attachments.length > 0) {
        await uploadAttachments();
      }

      setNewMessage('');
      setAttachments([]);
    } catch (error) {
      toast.error('Failed to send message');
      console.error('Send message error:', error);
    }
  };

  const uploadAttachments = async () => {
    try {
      for (const file of attachments) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('incident_id', incidentId || '');

        await fetch(`${API_URL}/api/messaging/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`
          },
          body: formData
        });
      }
    } catch (error) {
      console.error('Failed to upload attachments:', error);
      toast.error('Message sent but some files failed to upload');
    }
  };

  const handleFileSelect = (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });
    
    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'security_team':
      case 'admin':
        return <Shield className="h-4 w-4 text-orange-400" />;
      default:
        return <User className="h-4 w-4 text-blue-400" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'security_team':
        return 'bg-orange-500/20 text-orange-300';
      case 'admin':
        return 'bg-purple-500/20 text-purple-300';
      default:
        return 'bg-blue-500/20 text-blue-300';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#2A2D35] border border-gray-700 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#00D4FF]/20 rounded-lg">
            <Shield className="h-5 w-5 text-[#00D4FF]" />
          </div>
          <div>
            <h3 className="font-semibold text-white">
              {incidentId ? `Incident #${incidentId}` : 'Security Support'}
            </h3>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-xs text-gray-400">
                {isConnected ? 'Connected' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto max-h-96">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4FF]"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <Shield className="h-8 w-8 mb-2" />
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === userProfile?.uid ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${
                  message.sender_id === userProfile?.uid ? 'order-2' : 'order-1'
                }`}>
                  <div className={`p-3 rounded-lg ${
                    message.sender_id === userProfile?.uid
                      ? 'bg-[#00D4FF] text-[#1A1D23]'
                      : 'bg-[#1A1D23] text-white border border-gray-700'
                  }`}>
                    {message.sender_id !== userProfile?.uid && (
                      <div className="flex items-center space-x-2 mb-2">
                        {getRoleIcon(message.sender_role)}
                        <span className="text-xs font-medium">{message.sender_name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getRoleBadge(message.sender_role)}`}>
                          {message.sender_role === 'security_team' ? 'Security' : 
                           message.sender_role === 'admin' ? 'Admin' : 'Employee'}
                        </span>
                      </div>
                    )}
                    
                    <p className="text-sm">{message.content}</p>
                    
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.attachments.map((file, index) => (
                          <div key={index} className="flex items-center space-x-2 p-2 bg-black/20 rounded">
                            <FileText className="h-3 w-3" />
                            <span className="text-xs">{file.name}</span>
                            <Download className="h-3 w-3 cursor-pointer" />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs opacity-70">
                        {formatTimestamp(message.timestamp)}
                      </span>
                      {message.sender_id === userProfile?.uid && (
                        <CheckCheck className={`h-3 w-3 ${message.is_read ? 'text-green-400' : 'opacity-50'}`} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-xs">
                  <div className="p-3 bg-[#1A1D23] text-white border border-gray-700 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-700">
          <div className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
            <Paperclip className="h-4 w-4" />
            <span>Attachments ({attachments.length})</span>
          </div>
          <div className="space-y-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-[#1A1D23] rounded">
                <div className="flex items-center space-x-2">
                  {file.type.startsWith('image/') ? (
                    <Image className="h-4 w-4 text-blue-400" />
                  ) : (
                    <FileText className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-sm text-white">{file.name}</span>
                  <span className="text-xs text-gray-400">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  onClick={() => removeAttachment(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 bg-[#1A1D23] border border-gray-600 rounded-lg">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 p-3 bg-transparent text-white placeholder-gray-400 focus:outline-none"
                disabled={!isConnected}
              />
              <label className="p-2 text-gray-400 hover:text-white cursor-pointer transition-colors">
                <Paperclip className="h-4 w-4" />
                <input
                  type="file"
                  multiple
                  className="hidden"
                  accept="image/*,.pdf,.txt,.log,.doc,.docx"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                />
              </label>
            </div>
          </div>
          <button
            onClick={sendMessage}
            disabled={(!newMessage.trim() && attachments.length === 0) || !isConnected}
            className="p-3 bg-[#00D4FF] hover:bg-[#00C4EF] text-[#1A1D23] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
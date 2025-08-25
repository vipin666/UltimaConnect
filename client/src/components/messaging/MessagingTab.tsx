import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, User, Clock, Users } from "lucide-react";
import { format } from "date-fns";
import type { MessageWithUsers, User as UserType } from "@shared/schema";

export function MessagingTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCompose, setShowCompose] = useState(false);
  const [selectedReceiver, setSelectedReceiver] = useState("");
  const [messageContent, setMessageContent] = useState("");

  const { data: messages = [], isLoading: messagesLoading } = useQuery<MessageWithUsers[]>({
    queryKey: ['/api/messages'],
  });

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ['/api/users'],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: string; content: string }) => {
      return apiRequest('POST', '/api/messages', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      setMessageContent("");
      setSelectedReceiver("");
      setShowCompose(false);
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!selectedReceiver || !messageContent.trim()) {
      toast({
        title: "Invalid message",
        description: "Please select a recipient and enter a message",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      receiverId: selectedReceiver,
      content: messageContent.trim(),
    });
  };

  const adminUsers = users.filter(u => u.role === 'admin' || u.role === 'super_admin' || u.role === 'watchman');

  if (messagesLoading) {
    return (
      <div className="space-y-4 px-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="shadow-md">
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-4 text-white flex-1 mr-3">
          <h2 className="text-lg font-semibold mb-1">Messages</h2>
          <p className="text-green-100 text-sm">Communicate with committee and staff</p>
        </div>
        <Button
          onClick={() => setShowCompose(!showCompose)}
          className="bg-green-600 text-white hover:bg-green-700 px-4 py-8"
          data-testid="button-compose"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>

      {/* Compose Message */}
      {showCompose && (
        <Card className="shadow-md border border-gray-200">
          <CardContent className="p-4">
            <h3 className="font-medium text-gray-800 mb-4 flex items-center">
              <Send className="w-4 h-4 mr-2" />
              Compose Message
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Send to
                </label>
                <select
                  value={selectedReceiver}
                  onChange={(e) => setSelectedReceiver(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  data-testid="select-receiver"
                >
                  <option value="">Select recipient...</option>
                  <optgroup label="Committee & Staff">
                    {adminUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.role})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <Textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Type your message here..."
                  rows={4}
                  className="w-full"
                  data-testid="textarea-message"
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleSendMessage}
                  disabled={sendMessageMutation.isPending || !selectedReceiver || !messageContent.trim()}
                  className="bg-green-600 text-white hover:bg-green-700"
                  data-testid="button-send"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCompose(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages List */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800">Recent Messages</h3>
        
        {messages.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
              <p className="text-gray-600 mb-4">Start a conversation with the committee or building staff</p>
              <Button
                onClick={() => setShowCompose(true)}
                className="bg-green-600 text-white hover:bg-green-700"
                data-testid="button-first-message"
              >
                Send First Message
              </Button>
            </CardContent>
          </Card>
        ) : (
          messages.map((message) => (
            <Card key={message.id} className="shadow-md border border-gray-200 bg-white">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">
                        From: {message.sender.firstName} {message.sender.lastName}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {message.sender.role} • {message.sender.unitNumber ? `Unit ${message.sender.unitNumber}` : 'Staff'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-1">
                    {!message.isRead && (
                      <Badge className="bg-green-500 text-white text-xs">New</Badge>
                    )}
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {format(new Date(message.createdAt!), 'MMM d, h:mm a')}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">{message.content}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
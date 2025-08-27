import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, MessageCircle, Calendar, MapPin, User } from "lucide-react";
import { format } from "date-fns";
import type { PostWithAuthor } from "@shared/schema";

interface PostCardProps {
  post: PostWithAuthor;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  isLiking?: boolean;
}

export function PostCard({ post, onLike, onComment, isLiking }: PostCardProps) {
  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'event':
        return 'border-secondary';
      case 'complaint':
        return 'border-accent';
      case 'suggestion':
        return 'border-primary';
      default:
        return 'border-gray-200';
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'event':
        return <Calendar className="text-white w-4 h-4" />;
      case 'complaint':
        return <User className="text-white w-4 h-4" />;
      case 'suggestion':
        return <User className="text-white w-4 h-4" />;
      default:
        return <User className="text-white w-4 h-4" />;
    }
  };

  const getPostTypeIconBg = (type: string) => {
    switch (type) {
      case 'event':
        return 'bg-secondary';
      case 'complaint':
        return 'bg-gray-400';
      case 'suggestion':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="destructive" className="text-xs">Active</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500 text-white text-xs">Resolved</Badge>;
      case 'frozen':
        return <Badge variant="secondary" className="text-xs">Deferred</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className={`shadow-material border-l-4 ${getPostTypeColor(post.type)}`} data-testid={`post-${post.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className={`w-10 h-10 ${getPostTypeIconBg(post.type)} rounded-full flex items-center justify-center flex-shrink-0`}>
            {getPostTypeIcon(post.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 pr-2">
                <h3 className="font-medium text-gray-800" data-testid={`text-title-${post.id}`}>
                  {post.title}
                </h3>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {getStatusBadge(post.status)}
                <span className="text-xs text-gray-500">
                  {post.author?.unitNumber ? `Unit ${post.author.unitNumber}` : 'Admin'} • {format(new Date(post.createdAt!), 'MMM d')}
                </span>
              </div>
            </div>
            
            {post.type !== 'general' && (
              <Badge 
                className={`mb-2 text-xs ${
                  post.type === 'event' ? 'bg-secondary text-white' : 
                  post.type === 'complaint' ? 'bg-accent text-white' : 
                  'bg-primary text-white'
                }`}
              >
                {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
              </Badge>
            )}
            
            <p className="text-gray-600 text-sm mb-3" data-testid={`text-content-${post.id}`}>
              {post.content}
            </p>
            
            {/* Admin Comment Display */}
            {post.adminComment && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-3 rounded-r-md">
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-medium text-blue-800">Admin Response</span>
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        {post.status === 'resolved' ? 'Resolved' : 
                         post.status === 'rejected' ? 'Rejected' : 
                         post.status === 'frozen' ? 'Deferred' : 'Updated'}
                      </Badge>
                    </div>
                    <p className="text-sm text-blue-700" data-testid={`text-admin-comment-${post.id}`}>
                      {post.adminComment}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {post.type === 'event' && (
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  Event Details
                </span>
                <span className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  Location TBD
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-start pt-2 border-t border-gray-100">
              <div className="flex items-center space-x-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onLike(post.id)}
                  disabled={isLiking}
                  className="text-primary hover:text-primary hover:bg-blue-50 px-2 py-1 h-8 rounded-md transition-colors"
                  data-testid={`button-like-${post.id}`}
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  <span className="text-sm">{post.likes ?? 0}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onComment(post.id)}
                  className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 px-2 py-1 h-8 rounded-md transition-colors"
                  data-testid={`button-comment-${post.id}`}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm">{post.comments?.length ?? 0}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, Shield, Calendar, Users, AlertTriangle, MessageCircle, Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { PostWithAuthor } from "@shared/schema";
import { format } from "date-fns";

export default function Landing() {
  // Fetch complaint posts for public viewing
  const { data: complaints = [], isLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ['/api/posts', { type: 'complaint' }],
    queryFn: async () => {
      const response = await fetch('/api/posts?type=complaint');
      return response.json();
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="destructive" className="text-xs">Active</Badge>;
      case 'resolved':
        return <Badge variant="default" className="text-xs bg-green-500 text-white">Resolved</Badge>;
      case 'frozen':
        return <Badge variant="secondary" className="text-xs">Deferred</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mr-4">
              <Building className="text-primary w-8 h-8" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-medium">Ultima Skymax Connect</h1>
              <p className="text-blue-100">Building Management System</p>
            </div>
          </div>
          
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="w-full bg-white text-primary hover:bg-gray-100 font-medium py-3"
            data-testid="button-login"
          >
            Sign In to Continue
          </Button>
        </div>
      </div>

      {/* Recent Complaints Section */}
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-medium">Recent Building Complaints</h2>
            </div>
            
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : complaints.length > 0 ? (
              <div className="space-y-4">
                {complaints.map((post) => (
                  <Card key={post.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-lg text-gray-900">{post.title}</h3>
                        {getStatusBadge(post.status)}
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {post.content}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            <span>{post.likes}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            <span>{post.comments?.length || 0} comments</span>
                          </div>
                        </div>
                        <span>
                          {post.createdAt ? format(new Date(post.createdAt), 'MMM d, yyyy') : 'Unknown date'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No complaints reported recently</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="text-center">
              <CardContent className="p-6">
                <Calendar className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-medium mb-2">Easy Booking</h3>
                <p className="text-sm text-gray-600">Book amenities like pool, gym, party hall</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Users className="w-8 h-8 text-secondary mx-auto mb-3" />
                <h3 className="font-medium mb-2">Community Feed</h3>
                <p className="text-sm text-gray-600">Stay connected with residents</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Shield className="w-8 h-8 text-accent mx-auto mb-3" />
                <h3 className="font-medium mb-2">Smart Security</h3>
                <p className="text-sm text-gray-600">Guest notifications & alerts</p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center text-gray-500 text-sm">
            New resident? Contact admin for onboarding
          </div>
        </div>
      </div>
    </div>
  );
}

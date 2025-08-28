import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, Shield, Calendar, Users, AlertTriangle, MessageCircle, Heart, MessageSquare, UserCheck, Fingerprint, Phone, MapPin, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PostWithAuthor } from "@shared/schema";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Landing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';



  // Fetch all posts for residents to view and comment
  const { data: allPosts = [], isLoading: postsLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ['/api/posts'],
    queryFn: async () => {
      const response = await fetch('/api/posts');
      return response.json();
    },
    enabled: !isAdmin, // Only for residents
  });

  // Fetch complaint posts for public viewing (non-logged in users)
  const { data: complaints = [], isLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ['/api/posts', { type: 'complaint' }],
    queryFn: async () => {
      const response = await fetch('/api/posts?type=complaint');
      return response.json();
    },
    enabled: !user, // Only for non-logged in users
  });

  // Fetch nearby services
  const { data: services = [], isLoading: servicesLoading } = useQuery<any[]>({
    queryKey: ['/api/services'],
    queryFn: async () => {
      const response = await fetch('/api/services');
      return response.json();
    },
  });

  const [servicesOpen, setServicesOpen] = useState(false);

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
            onClick={() => window.location.href = '/login'}
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

                    {/* Admin Quick Access */}
          {isAdmin && (
            <div className="mb-8">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5 text-blue-500" />
                    <h3 className="font-medium text-gray-800">Admin Quick Access</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => window.location.href = '/admin'}
                      className="w-full bg-blue-600 text-white hover:bg-blue-700 py-3 rounded-lg font-medium"
                      data-testid="button-admin-panel"
                    >
                      Admin Panel
                    </Button>
                    <Button
                      onClick={() => window.location.href = '/financial'}
                      className="w-full bg-green-600 text-white hover:bg-green-700 py-3 rounded-lg font-medium"
                      data-testid="button-financial-management"
                    >
                      Financial
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Resident Dashboard Section */}
          {user && !isAdmin && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-green-500" />
                <h2 className="text-xl font-medium">Community Feed</h2>
              </div>

              {/* All Posts Section for Residents */}
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <h3 className="font-medium text-gray-800">Recent Community Posts</h3>
                  </div>
                  
                  {postsLoading ? (
                    <div className="text-center py-4">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Loading posts...</p>
                    </div>
                  ) : allPosts.length > 0 ? (
                    <div className="space-y-4">
                      {allPosts.map((post) => (
                        <div key={post.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-800">{post.title}</h4>
                            <Badge className={post.type === 'complaint' ? 'bg-red-100 text-red-800' : 
                                             post.type === 'general' ? 'bg-blue-100 text-blue-800' : 
                                             'bg-green-100 text-green-800'}>
                              {post.type}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                            {post.content}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Heart className="w-4 h-4" />
                                <span>{post.likes || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageCircle className="w-4 h-4" />
                                <span>{post.comments?.length || 0} comments</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                By {post.author?.firstName} {post.author?.lastName} {post.author?.unitNumber && `(${post.author.unitNumber})`}
                              </p>
                              <p className="text-xs text-gray-500">
                                {post.createdAt ? format(new Date(post.createdAt), 'MMM d, yyyy') : 'Unknown date'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No posts found</p>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Nearby Services Section - prominent for admins only */}
          {isAdmin && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Building className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-medium">Nearby Services</h2>
              </div>
              {servicesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : services.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {services.slice(0, 6).map((service) => (
                    <Card key={service.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-gray-800">{service.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {service.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {service.description}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                          <MapPin className="w-4 h-4" />
                          <span>{service.address}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium">{service.phone}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`tel:${service.phone}`, '_self')}
                            >
                              Call
                            </Button>
                            <Badge variant="outline" className="text-xs">
                              {service.distanceKm} km
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Building className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No services available</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

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

      {/* Floating Nearby Services popup trigger for residents */}
      {user && !isAdmin && (
        <Dialog open={servicesOpen} onOpenChange={setServicesOpen}>
          <div className="fixed bottom-4 right-4 z-40">
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary" className="shadow-md px-3 py-2">
                <MapPin className="w-4 h-4 mr-2" /> Nearby services
              </Button>
            </DialogTrigger>
          </div>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nearby Services</DialogTitle>
            </DialogHeader>
            {servicesLoading ? (
              <div className="space-y-3">
                {[1,2,3,4].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : services.length > 0 ? (
              <div className="space-y-3">
                {services.map((service) => (
                  <Card key={service.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-1">
                        <div className="font-medium text-gray-800">{service.name}</div>
                        <Badge variant="outline" className="text-xs">{service.category}</Badge>
                      </div>
                      {service.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{service.description}</p>
                      )}
                      {service.address && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                          <MapPin className="w-4 h-4" />
                          <span>{service.address}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">{service.phone}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">{service.distanceKm} km</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No services available</div>
            )}
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}

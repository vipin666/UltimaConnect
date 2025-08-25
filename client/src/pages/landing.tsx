import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Shield, Calendar, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="bg-primary text-white flex-1 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          {/* Building Logo */}
          <div className="w-20 h-20 mx-auto mb-6 bg-white rounded-full flex items-center justify-center shadow-material">
            <Building className="text-primary w-10 h-10" />
          </div>
          
          <h1 className="text-3xl font-medium mb-4">Ultima Skymax Connect</h1>
          <p className="text-blue-100 text-lg mb-8">Building Management System</p>
          
          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-blue-100" />
              <p className="text-sm text-blue-100">Community</p>
            </div>
            <div className="text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-100" />
              <p className="text-sm text-blue-100">Bookings</p>
            </div>
            <div className="text-center">
              <Shield className="w-8 h-8 mx-auto mb-2 text-blue-100" />
              <p className="text-sm text-blue-100">Security</p>
            </div>
            <div className="text-center">
              <Building className="w-8 h-8 mx-auto mb-2 text-blue-100" />
              <p className="text-sm text-blue-100">Services</p>
            </div>
          </div>
          
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="w-full bg-white text-primary hover:bg-gray-100 font-medium py-3 text-lg"
            data-testid="button-login"
          >
            Sign In to Continue
          </Button>
          
          <p className="text-center text-blue-100 text-sm mt-4">
            New resident? Contact admin for onboarding
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="p-6 bg-background">
        <div className="max-w-md mx-auto space-y-4">
          <h2 className="text-xl font-medium text-center mb-6">Building Features</h2>
          
          <Card className="shadow-material">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="text-primary w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium">Easy Booking</h3>
                  <p className="text-sm text-gray-600">Book pool, gym, party hall & parking</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-material">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="text-secondary w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium">Community Feed</h3>
                  <p className="text-sm text-gray-600">Stay updated with events & announcements</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-material">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Shield className="text-accent w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium">Smart Security</h3>
                  <p className="text-sm text-gray-600">Guest notifications & parking alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function ClearSessions() {
  const { toast } = useToast();

  const handleClearSessions = async () => {
    try {
      const response = await fetch('/api/auth/clear-sessions', { 
        credentials: 'include' 
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "All sessions cleared successfully",
        });
        // Redirect to login page
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      } else {
        toast({
          title: "Error",
          description: "Failed to clear sessions",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear sessions",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">Clear All Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-center">
            This will clear all active sessions and force all users to log in again.
            Use this for testing purposes.
          </p>
          <Button 
            onClick={handleClearSessions}
            className="w-full"
            variant="destructive"
          >
            Clear All Sessions
          </Button>
          <Button 
            onClick={() => window.location.href = '/login'}
            className="w-full"
            variant="outline"
          >
            Go to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

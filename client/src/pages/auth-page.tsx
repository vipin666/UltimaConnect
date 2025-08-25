import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Eye, EyeOff, Building, Users, Lock } from "lucide-react";
import { Redirect } from "wouter";

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    email: "",
    unitNumber: ""
  });
  const [forgotPasswordForm, setForgotPasswordForm] = useState({ email: "" });
  const [resetPasswordForm, setResetPasswordForm] = useState({ token: "", newPassword: "" });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  // Redirect if already logged in
  if (!isLoading && user) {
    return <Redirect to="/" />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/auth/local/login", loginForm);
      if (response.ok) {
        toast({
          title: "Success",
          description: "Logged in successfully!"
        });
        window.location.href = "/"; // Redirect to home
      } else {
        const data = await response.json();
        toast({
          title: "Login Failed",
          description: data.message || "Invalid credentials",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to login. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.username || !registerForm.password || !registerForm.firstName || !registerForm.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/auth/local/register", registerForm);
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Registration Successful",
          description: data.message
        });
        setActiveTab("login");
        setRegisterForm({
          username: "",
          password: "",
          firstName: "",
          lastName: "",
          email: "",
          unitNumber: ""
        });
      } else {
        toast({
          title: "Registration Failed",
          description: data.message || "Registration failed",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to register. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordForm.email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/auth/forgot-password", forgotPasswordForm);
      const data = await response.json();
      
      toast({
        title: "Success",
        description: data.message
      });
      setForgotPasswordForm({ email: "" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reset email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordForm.token || !resetPasswordForm.newPassword) {
      toast({
        title: "Error",
        description: "Please enter both token and new password",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/auth/reset-password", resetPasswordForm);
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          description: data.message
        });
        setActiveTab("login");
        setResetPasswordForm({ token: "", newPassword: "" });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to reset password",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Hero */}
        <div className="text-center md:text-left space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">
              Welcome to <span className="text-blue-600">Ultima Skymax Connect</span>
            </h1>
            <p className="text-xl text-gray-600">
              Your comprehensive building management platform for seamless community living.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-3 text-gray-700">
              <Building className="w-5 h-5 text-blue-600" />
              <span>15-Floor Residential Building Management</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Community Posts & Resident Communication</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Lock className="w-5 h-5 text-blue-600" />
              <span>Secure Access & Amenity Booking</span>
            </div>
          </div>
        </div>

        {/* Right side - Auth Forms */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Access Your Account</CardTitle>
            <CardDescription>
              Sign in with your flat number or create a new account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username (Flat Number)</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="e.g., 101a"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                      data-testid="input-login-username"
                    />
                    <p className="text-xs text-gray-500">Use your flat number as username (e.g., 101a, 102b)</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                        data-testid="input-login-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">Default password: Skymax123</p>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-login">
                    {isSubmitting ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
                
                <div className="space-y-2">
                  <Button
                    variant="link"
                    className="w-full p-0 h-auto"
                    onClick={() => setActiveTab("forgot")}
                  >
                    Forgot your password?
                  </Button>
                  
                  <div className="text-center">
                    <span className="text-sm text-gray-500">or</span>
                  </div>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.location.href = "/api/login"}
                  >
                    Sign in with Replit
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="First name"
                        value={registerForm.firstName}
                        onChange={(e) => setRegisterForm({...registerForm, firstName: e.target.value})}
                        data-testid="input-register-firstname"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Last name"
                        value={registerForm.lastName}
                        onChange={(e) => setRegisterForm({...registerForm, lastName: e.target.value})}
                        data-testid="input-register-lastname"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                      data-testid="input-register-email"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="regUsername">Username (Flat Number)</Label>
                    <Input
                      id="regUsername"
                      type="text"
                      placeholder="e.g., 101a"
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                      data-testid="input-register-username"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="unitNumber">Unit Number</Label>
                    <Input
                      id="unitNumber"
                      type="text"
                      placeholder="e.g., 101A"
                      value={registerForm.unitNumber}
                      onChange={(e) => setRegisterForm({...registerForm, unitNumber: e.target.value})}
                      data-testid="input-register-unit"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="regPassword">Password</Label>
                    <Input
                      id="regPassword"
                      type="password"
                      placeholder="Create a strong password"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                      data-testid="input-register-password"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-register">
                    {isSubmitting ? "Creating Account..." : "Create Account"}
                  </Button>
                  
                  <p className="text-xs text-gray-500 text-center">
                    Your account will require admin approval before activation.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
            
            {activeTab === "forgot" && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold">Reset Password</h3>
                  <p className="text-sm text-gray-500">Enter your email to receive a reset link</p>
                </div>
                
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgotEmail">Email</Label>
                    <Input
                      id="forgotEmail"
                      type="email"
                      placeholder="your.email@example.com"
                      value={forgotPasswordForm.email}
                      onChange={(e) => setForgotPasswordForm({...forgotPasswordForm, email: e.target.value})}
                      data-testid="input-forgot-email"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-forgot-password">
                    {isSubmitting ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>
                
                <Button
                  variant="link"
                  className="w-full p-0 h-auto"
                  onClick={() => setActiveTab("login")}
                >
                  Back to Sign In
                </Button>
              </div>
            )}
            
            {activeTab === "reset" && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold">Reset Password</h3>
                  <p className="text-sm text-gray-500">Enter your reset token and new password</p>
                </div>
                
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resetToken">Reset Token</Label>
                    <Input
                      id="resetToken"
                      type="text"
                      placeholder="Enter the token from your email"
                      value={resetPasswordForm.token}
                      onChange={(e) => setResetPasswordForm({...resetPasswordForm, token: e.target.value})}
                      data-testid="input-reset-token"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter your new password"
                      value={resetPasswordForm.newPassword}
                      onChange={(e) => setResetPasswordForm({...resetPasswordForm, newPassword: e.target.value})}
                      data-testid="input-reset-password"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-reset-password">
                    {isSubmitting ? "Resetting..." : "Reset Password"}
                  </Button>
                </form>
                
                <Button
                  variant="link"
                  className="w-full p-0 h-auto"
                  onClick={() => setActiveTab("login")}
                >
                  Back to Sign In
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
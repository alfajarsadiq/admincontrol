// File: Login.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/lib/api"; 
import { useAuth } from "@/context/AuthContext"; 

const Login = () => {
  const navigate = useNavigate();
  const { setAdmin } = useAuth(); 
  
  // --- START OF FIX ---
  // Set the default state to empty strings
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // --- END OF FIX ---

  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      
      const { token, admin } = response.data;
      
      localStorage.setItem("authToken", token);
      setAdmin(admin); 

      toast.success(`Login Successful! Welcome, ${admin.name}.`);

      if (admin.email === "admin1@gmail.com") {
        navigate("/dashboard");
      } else {
        navigate("/lr-generator");
      }

    } catch (error) {
      toast.error("Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-2xl shadow-card animate-fade-in">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-gold">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Admin Control Management</h1>
          <p className="text-sm text-muted-foreground">Welcome back! Please login to continue.</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="Enter The Email Address" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              disabled={isLoading}
              autoComplete="off" // Keep this to help
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              disabled={isLoading}
              autoComplete="new-password" // Keep this to help
            />
          </div>
          <Button type="submit" className="w-full bg-gradient-gold hover:opacity-90 transition-opacity text-white font-medium shadow-gold" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
        <p className="text-xs text-center text-muted-foreground">Enter credentials to access the admin panel.</p>
      </div>
    </div>
  );
};

export default Login;
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/user", {
          credentials: "include",
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            // User is not authenticated, return null instead of throwing
            return null;
          }
          throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
      } catch (err) {
        // Return null for any authentication errors
        return null;
      }
    },
  });

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
  };
}

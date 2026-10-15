import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import Index from "./pages/Index";
import SavedSimulations from "./pages/SavedSimulations";
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";
import { Analytics } from "@vercel/analytics/react"
const queryClient = new QueryClient();

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.warn("Missing Clerk Publishable Key in .env");
}

import { useEffect } from "react";
import { simulationCache } from "@/utils/simulationCache";

const App = () => {
  useEffect(() => {
    // Session management for cache
    const sessionActive = sessionStorage.getItem('freeway_session_active');
    if (!sessionActive) {
      // New session (tab opened), clear previous cache to ensure fresh start
      // while allowing persistence on refresh (F5) because sessionStorage survives refreshes
      console.log("New session detected: Clearing simulation cache");
      simulationCache.clear().catch(err => console.error("Failed to clear cache:", err));
      sessionStorage.setItem('freeway_session_active', 'true');
    }
  }, []);

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <Analytics />
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/freeway-simulator" element={<Index />} />
              <Route path="/saved-simulations" element={<SavedSimulations />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
};

export default App;

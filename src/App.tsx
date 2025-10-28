import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Splash } from "@/components/Splash";
import { Layout } from "@/components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Testimonials from "./pages/Testimonials";
import Contact from "./pages/Contact";
import Gallery from "./pages/Gallery";
import Discipleship from "./pages/Discipleship";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {showSplash && <Splash onComplete={() => setShowSplash(false)} />}
          {!showSplash && (
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route path="/" element={<Home />} />
                  <Route path="/testimonials" element={<Testimonials />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route 
                    path="/gallery" 
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'social_media']}>
                        <Gallery />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/discipleship" 
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'social_media', 'collaborator']}>
                        <Discipleship />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/users" 
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <Users />
                      </ProtectedRoute>
                    } 
                  />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          )}
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

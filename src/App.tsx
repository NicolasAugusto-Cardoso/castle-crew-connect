import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Splash } from "@/components/Splash";
import { Layout } from "@/components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Testimonials from "./pages/Testimonials";
import Contact from "./pages/Contact";
import ChatThread from "./pages/ChatThread";
import Gallery from "./pages/Gallery";
import GalleryFolder from "./pages/GalleryFolder";
import Discipleship from "./pages/Discipleship";
import CollaboratorProfile from "./pages/CollaboratorProfile";
import Collaborators from "./pages/Collaborators";
import CollaboratorDetails from "./pages/CollaboratorDetails";
import CollaboratorChat from "./pages/CollaboratorChat";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";
import Install from "./pages/Install";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

// Protected Layout Wrapper
const ProtectedLayout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-light via-primary to-primary-dark" />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout />;
};

const App = () => {
  const [showInitialSplash, setShowInitialSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);


  // Start loading resources during splash
  useEffect(() => {
    // Preload critical resources in background
    const initApp = async () => {
      // Allow splash to show for minimum duration
      const minSplashTime = new Promise(resolve => setTimeout(resolve, 100));
      
      // Wait for both splash time and any critical loads
      await Promise.all([
        minSplashTime,
        // Add any critical data fetching here if needed
      ]);
      
      setAppReady(true);
    };

    initApp();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {showInitialSplash ? (
        <Splash onComplete={() => setShowInitialSplash(false)} />
      ) : (
        <BrowserRouter>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/install" element={<Install />} />
              <Route element={<ProtectedLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/testimonials" element={<Testimonials />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/contact/:messageId" element={<ChatThread />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/gallery/:folderId" element={<GalleryFolder />} />
                <Route path="/colaboradores" element={
                  <ProtectedRoute allowedRoles={['user', 'admin', 'volunteer']}>
                    <Collaborators />
                  </ProtectedRoute>
                } />
                <Route path="/colaboradores/:userId" element={
                  <ProtectedRoute allowedRoles={['user', 'admin', 'volunteer']}>
                    <CollaboratorDetails />
                  </ProtectedRoute>
                } />
                <Route path="/colaboradores/:userId/chat" element={
                  <ProtectedRoute allowedRoles={['user', 'admin', 'volunteer']}>
                    <CollaboratorChat />
                  </ProtectedRoute>
                } />
                <Route path="/discipleship" element={
                  <ProtectedRoute allowedRoles={['admin', 'social_media', 'collaborator', 'volunteer']}>
                    <Discipleship />
                  </ProtectedRoute>
                } />
                <Route path="/collaborator/profile" element={
                  <ProtectedRoute allowedRoles={['collaborator', 'admin']}>
                    <CollaboratorProfile />
                  </ProtectedRoute>
                } />
                <Route path="/users" element={<Users />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </BrowserRouter>
      )}
    </QueryClientProvider>
  );
};

export default App;

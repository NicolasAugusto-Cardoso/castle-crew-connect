import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { useAuth } from "@/hooks/useAuth";
import { useDonationsEnabled } from "@/hooks/useAppSettings";
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
import DeleteAccount from "./pages/DeleteAccount";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";

import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import Donations from "./pages/Donations";
import Bible from "./pages/Bible";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Guard para rota de doações - redireciona se desabilitado
const DonationsGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDonationsEnabled, isLoading } = useDonationsEnabled();
  
  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-primary-light via-primary to-primary-dark" />;
  }
  
  if (!isDonationsEnabled) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const queryClient = new QueryClient();

// Pre-splash loading screen with same gradient as splash
const PreSplashScreen = () => (
  <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-primary-light via-primary to-primary-dark" />
);

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
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(false);
  
  // Registra o service worker para atualizações automáticas do PWA
  useServiceWorker();

  // Show pre-splash for a brief moment, then transition to animated splash
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setShowSplash(true);
    }, 500); // 500ms of blue gradient screen before splash animation

    return () => clearTimeout(timer);
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Show pre-splash loading screen
  if (isLoading) {
    return <PreSplashScreen />;
  }

  // Show animated splash
  if (showSplash) {
    return <Splash onComplete={handleSplashComplete} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:eventId" element={<EventDetails />} />
              <Route path="/donations" element={
                <ProtectedRoute allowedRoles={['admin', 'user']}>
                  <DonationsGuard>
                    <Donations />
                  </DonationsGuard>
                </ProtectedRoute>
              } />
              <Route path="/testimonials" element={<Testimonials />} />
              <Route path="/bible" element={<Bible />} />
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
              <Route path="/delete-account" element={<DeleteAccount />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;

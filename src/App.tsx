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
import Gallery from "./pages/Gallery";
import GalleryFolder from "./pages/GalleryFolder";
import Discipleship from "./pages/Discipleship";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Layout Wrapper
const ProtectedLayout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-light via-primary to-primary-dark flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 rounded-full border-4 border-accent/30 border-t-accent animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout />;
};

const App = () => {
  const { isAuthenticated, loading } = useAuth();
  const [showInitialSplash, setShowInitialSplash] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    // Só mostra splash se não houver sessão ativa
    if (!loading && !hasCheckedAuth) {
      if (!isAuthenticated) {
        setShowInitialSplash(true);
      }
      setHasCheckedAuth(true);
    }
  }, [loading, isAuthenticated, hasCheckedAuth]);

  // Enquanto verifica auth, mantém o fundo gradiente (sem tela branca)
  if (!hasCheckedAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-light via-primary to-primary-dark flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 rounded-full border-4 border-accent/30 border-t-accent animate-spin" />
        </div>
      </div>
    );
  }

  if (showInitialSplash) {
    return <Splash onComplete={() => setShowInitialSplash(false)} />;
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
              <Route path="/testimonials" element={<Testimonials />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/gallery/:folderId" element={<GalleryFolder />} />
              <Route path="/discipleship" element={<Discipleship />} />
              <Route path="/users" element={<Users />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;

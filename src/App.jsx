import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Home from '@/pages/Home';
import Landing from '@/pages/Landing';
import PageNotFound from '@/pages/PageNotFound';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

/** Redirects to landing if not authenticated */
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/" replace />;
}

/** Redirects to app if already authenticated */
function RedirectIfAuthed({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/app" replace /> : children;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Router>
            <Routes>
              <Route
                path="/"
                element={
                  <RedirectIfAuthed>
                    <Landing />
                  </RedirectIfAuthed>
                }
              />
              <Route
                path="/app"
                element={
                  <RequireAuth>
                    <Home />
                  </RequireAuth>
                }
              />
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Router>
        </QueryClientProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
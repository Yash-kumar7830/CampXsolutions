import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import LoginPage from '@/pages/Login';
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import Marketplace from '@/pages/Marketplace';
import Reports from '@/pages/Reports';
import Profile from '@/pages/Profile';
import MobileNav from '@/components/MobileNav';
import { MapPin } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
const queryClient = new QueryClient();
const DesktopNav = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    if (!currentUser || location.pathname === '/login')
        return null;
    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login', { replace: true });
        }
        catch (error) {
            console.error('Unable to sign out:', error);
        }
    };
    return (<header className="sticky top-0 z-40 border-b border-[#e8ede6] bg-[#fbfcfa]/95 backdrop-blur dark:border-[#1e3028] dark:bg-[#0f1f18]/95">
      <nav className="mx-auto flex h-[68px] max-w-[1320px] items-center justify-between px-4 sm:px-7 lg:px-10">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#183a2f] text-[#d2ee82]"><MapPin size={18}/></span>
          <span className="font-bold tracking-tight text-[#1d382b]">campXsolutions</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/" className="hidden text-sm font-medium text-[#536657] hover:text-[#214b3b] sm:inline">Lost &amp; Found</Link>
          <Link to="/marketplace" className="hidden text-sm font-medium text-[#536657] hover:text-[#214b3b] sm:inline">Marketplace</Link>
          <Link to="/reports" className="hidden text-sm font-medium text-[#536657] hover:text-[#214b3b] sm:inline">Reports / Surveys</Link>
          <Link to="/profile" className="hidden text-sm font-medium text-[#536657] hover:text-[#214b3b] sm:inline">My Activity</Link>
          <span className="hidden text-sm text-[#718078] dark:text-[#8aaa85] sm:inline">Hi, {currentUser.username}</span>
          <ThemeToggle />
          <Button variant="outline" onClick={handleLogout} className="h-9 rounded-lg border-[#dfe6dc] bg-white px-3 text-xs text-[#536657] hover:bg-[#f4f7f2] dark:border-[#2e3d35] dark:bg-[#1a2e25] dark:text-[#9ec99a] dark:hover:bg-[#1f3829]">Sign out</Button>
        </div>
      </nav>
    </header>);
};
const AppRoutes = () => {
    const { currentUser, isLoading, requiresPasswordSetup } = useAuth();
    const location = useLocation();
    useEffect(() => {
        document.title = 'campXsolutions | KIET Campus Community';
    }, []);
    if (isLoading)
        return <div className="grid min-h-screen place-items-center bg-[#f7f8f5] text-sm text-[#718078] dark:bg-[#0d1a13] dark:text-[#7a9e78]">Loading campXsolutions…</div>;
    return (<>
      <DesktopNav />
      <Routes>
        <Route path="/login" element={<LoginPage />}/>
        <Route path="/" element={currentUser && !requiresPasswordSetup ? <Index /> : <Navigate to="/login" replace/>}/>
        <Route path="/marketplace" element={currentUser && !requiresPasswordSetup ? <Marketplace /> : <Navigate to="/login" replace/>}/>
        <Route path="/reports" element={currentUser && !requiresPasswordSetup ? <Reports /> : <Navigate to="/login" replace/>}/>
        <Route path="/profile" element={currentUser && !requiresPasswordSetup ? <Profile /> : <Navigate to="/login" replace/>}/>
        <Route path="/my-items" element={currentUser && !requiresPasswordSetup ? <Navigate to="/profile" replace/> : <Navigate to="/login" replace/>}/>
        <Route path="/my-claims" element={currentUser && !requiresPasswordSetup ? <Navigate to="/profile" replace/> : <Navigate to="/login" replace/>}/>
        <Route path="/surveys" element={currentUser && !requiresPasswordSetup ? <Navigate to="/reports" replace/> : <Navigate to="/login" replace/>}/>
        <Route path="/admin" element={currentUser?.isAdmin && !requiresPasswordSetup ? <Navigate to="/reports" replace/> : currentUser && !requiresPasswordSetup ? <Navigate to="/" replace/> : <Navigate to="/login" replace/>}/>
        <Route path="*" element={currentUser && !requiresPasswordSetup ? <NotFound /> : <Navigate to="/login" replace/>}/>
      </Routes>
      {currentUser && !requiresPasswordSetup && location.pathname !== '/login' && <MobileNav />}
    </>);
};
const App = () => (<QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>);
export default App;

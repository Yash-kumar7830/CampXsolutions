import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, LogOut, ShoppingBag, ClipboardList } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';
const MobileNav = () => {
    const isMobile = useIsMobile();
    const { logout } = useAuth();
    const navigate = useNavigate();
    if (!isMobile)
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
    return (<nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#e8ede6] bg-white/95 shadow-[0_-4px_20px_rgba(35,55,42,0.05)] backdrop-blur dark:border-[#1e3028] dark:bg-[#0f1f18]/95 md:hidden">
      <ul className="flex h-16 items-center justify-around">
        <li>
          <Link to="/" className="flex flex-col items-center gap-1 text-[#34533d] dark:text-[#7ec47a]">
            <Home size={19}/><span className="text-[10px] font-medium">Home</span>
          </Link>
        </li>
        <li>
          <Link to="/marketplace" className="flex flex-col items-center gap-1 text-[#87948a] dark:text-[#5a7a60]">
            <ShoppingBag size={19}/><span className="text-[10px]">Marketplace</span>
          </Link>
        </li>
        <li>
          <Link to="/reports" className="flex flex-col items-center gap-1 text-[#87948a] dark:text-[#5a7a60]">
            <ClipboardList size={19}/><span className="text-[10px]">Reports</span>
          </Link>
        </li>
        <li className="flex flex-col items-center gap-1">
          <ThemeToggle className="h-8 w-8 border-0 bg-transparent shadow-none" />
          <span className="text-[10px] text-[#87948a] dark:text-[#5a7a60]">Theme</span>
        </li>
        <li>
          <button onClick={() => void handleLogout()} className="flex flex-col items-center gap-1 text-[#87948a] dark:text-[#5a7a60]">
            <LogOut size={19}/><span className="text-[10px]">Sign out</span>
          </button>
        </li>
      </ul>
    </nav>);
};
export default MobileNav;

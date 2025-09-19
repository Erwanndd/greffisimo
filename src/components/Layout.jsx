import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

const Layout = ({ children, title }) => {
  const { user, logout } = useAuth();
  const { unreadMessagesCount } = useData();
  const navigate = useNavigate();

  const handleOpenMessages = useCallback(() => {
    navigate('/messages');
  }, [navigate]);

  const handleGoToDashboard = useCallback(() => {
    if (user?.role === 'formalist') navigate('/formalist');
    else if (user?.role === 'client') navigate('/client');
  }, [navigate, user]);

  const handleGoHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleGoFaq = useCallback(() => {
    navigate('/faq');
  }, [navigate]);

  return (
    <div className="min-h-screen w-full">
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass-effect border-b border-white/10 sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.button
                type="button"
                onClick={handleGoHome}
                className="flex items-center space-x-2 rounded px-1 py-0.5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                initial={false}
                whileTap={{ scale: 0.98 }}
                aria-label="Aller à l'accueil"
                title="Accueil"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
                  className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg"
                >
                  <span className="text-white font-bold text-sm">G</span>
                </motion.div>
                <span className="text-xl font-bold gradient-text">Greffissimo</span>
              </motion.button>
              {title && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="hidden md:block"
                >
                  <span className="text-gray-300">•</span>
                  <span className="ml-2 text-white font-medium">{title}</span>
                </motion.div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                type="button"
                onClick={handleGoFaq}
                className="hidden sm:inline-flex text-sm text-gray-300 hover:text-white px-2 py-1 rounded hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Consulter la FAQ"
                title="FAQ"
              >
                FAQ
              </motion.button>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="relative p-1 rounded hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={handleOpenMessages}
                aria-label="Ouvrir la messagerie"
                title="Ouvrir la messagerie"
                type="button"
              >
                <Mail className="w-5 h-5 text-gray-300" />
                {unreadMessagesCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                  >
                    {unreadMessagesCount}
                  </motion.div>
                )}
              </motion.button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                    className="flex items-center space-x-2 text-sm px-2 py-1 rounded hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Ouvrir le menu profil"
                    type="button"
                  >
                    <User className="w-4 h-4 text-blue-400" />
                    <span className="text-white">{user?.first_name || user?.email}</span>
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-slate-800 border-white/20 text-white">
                  <DropdownMenuLabel className="text-gray-300">Mon compte</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={handleGoToDashboard} className="focus:bg-white/10">
                    Tableau de bord
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleOpenMessages} className="focus:bg-white/10">
                    Messages
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={logout} className="text-red-300 focus:bg-white/10">
                    <LogOut className="w-4 h-4 mr-2" /> Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;

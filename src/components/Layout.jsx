import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Mail } from 'lucide-react';

const Layout = ({ children, title }) => {
  const { user, logout } = useAuth();
  const { unreadMessagesCount } = useData();

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
              <div className="flex items-center space-x-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
                  className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg"
                >
                  <span className="text-white font-bold text-sm">G</span>
                </motion.div>
                <span className="text-xl font-bold gradient-text">Greffissimo</span>
              </div>
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
               <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="relative"
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
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="flex items-center space-x-2 text-sm"
              >
                <User className="w-4 h-4 text-blue-400" />
                <span className="text-white">{user?.first_name || user?.email}</span>
              </motion.div>
              
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

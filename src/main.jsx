import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <HelmetProvider>
            <AuthProvider>
                <DataProvider>
                    <BrowserRouter>
                        <App />
                        <Toaster />
                    </BrowserRouter>
                </DataProvider>
            </AuthProvider>
        </HelmetProvider>
    </React.StrictMode>
);

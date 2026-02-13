import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';

export default function OfflineAlert() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleRetry = () => {
        window.location.reload();
    };

    if (isOnline) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-red-600 text-white shadow-lg animate-in slide-in-from-bottom duration-300">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <WifiOff className="w-6 h-6 animate-pulse" />
                    <div>
                        <h3 className="font-semibold text-lg">No Internet Connection</h3>
                        <p className="text-red-100 text-sm">Please check your network settings and try again.</p>
                    </div>
                </div>
                <Button
                    onClick={handleRetry}
                    variant="secondary"
                    className="bg-white text-red-600 hover:bg-gray-100 border-none"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                </Button>
            </div>
        </div>
    );
}

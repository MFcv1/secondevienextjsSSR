import { useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Composant qui track l'IP des admins lorsqu'ils accèdent au backoffice
 * Ce composant doit être monté dans le layout admin pour tracker toutes les visites
 */
const AdminIPTracker = () => {
    const { user, isAdmin } = useAuth();

    useEffect(() => {
        // Tracker l'IP seulement si c'est un admin connecté
        if (isAdmin && user && !user.isAnonymous) {
            const trackIP = async () => {
                try {
                    const trackAdminIPFn = httpsCallable(functions, 'trackAdminIP');
                    await trackAdminIPFn();
                    console.log('Admin IP tracked successfully');
                } catch (error) {
                    console.error('Failed to track admin IP:', error);
                }
            };

            // Tracker immédiatement
            trackIP();

            // Tracker toutes les 30 minutes pour maintenir l'IP à jour
            const interval = setInterval(trackIP, 30 * 60 * 1000);

            return () => clearInterval(interval);
        }
    }, [isAdmin, user]);

    // Ce composant ne rend rien visuellement
    return null;
};

export default AdminIPTracker;

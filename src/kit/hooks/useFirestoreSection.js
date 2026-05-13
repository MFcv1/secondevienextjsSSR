import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, getDocs, limit, startAfter } from 'firebase/firestore';
import { db, appId } from '../config/firebase';

/**
 * Hook de pagination Firestore pour les sections marketplace.
 * Utilise getDocs (pas onSnapshot) → pas de connexion persistante → économise les lectures.
 * Fallback automatique : si la query échoue (index manquant), retourne error pour que
 * le composant puisse fallback sur les données prop.
 *
 * @param {Array} constraints - Firebase query constraints [where(...), orderBy(...)]
 * @param {number} pageSize - Nombre d'items par page
 * @returns {{ items, loading, hasMore, loadMore, error }}
 */
export default function useFirestoreSection(constraints, pageSize = 10) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);
  const lastDocRef = useRef(null);
  const constraintsRef = useRef(constraints);

  const getColRef = useCallback(
    () => collection(db, 'artifacts', appId, 'public', 'data', 'furniture'),
    []
  );

  const fetchPage = useCallback(async (append = false) => {
    setLoading(true);
    try {
      const parts = [...constraintsRef.current, limit(pageSize)];
      if (append && lastDocRef.current) {
        parts.push(startAfter(lastDocRef.current));
      }

      const q = query(getColRef(), ...parts);
      const snapshot = await getDocs(q);

      const docs = snapshot.docs.map(d => ({
        id: d.id,
        collectionName: 'furniture',
        ...d.data()
      }));

      lastDocRef.current = snapshot.docs[snapshot.docs.length - 1] || null;
      setHasMore(snapshot.docs.length === pageSize);
      setItems(prev => append ? [...prev, ...docs] : docs);
      setError(null);
    } catch (err) {
      // Firestore retourne un lien pour créer l'index manquant dans le message d'erreur
      console.warn('[useFirestoreSection] Query failed — fallback to prop data.', err.message);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [pageSize, getColRef]);

  useEffect(() => {
    fetchPage(false);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) fetchPage(true);
  }, [loading, hasMore, fetchPage]);

  return { items, loading, hasMore, loadMore, error };
}

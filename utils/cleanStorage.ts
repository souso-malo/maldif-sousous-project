// Utilitaire pour nettoyer le localStorage des anciennes données de partage

export const cleanOldRoomData = () => {
  try {
    // Supprimer les anciennes salles
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        // Supprimer les anciennes clés de salle
        if (key.startsWith('room-') || 
            key.startsWith('gist-') || 
            key.startsWith('simple-room-') ||
            key.startsWith('coffre-room-') ||
            key.startsWith('global-room-') ||
            key.startsWith('room-mapping-') ||
            key.includes('rooms-list') ||
            key.includes('binId') ||
            key === 'current-room') {
          keysToRemove.push(key);
        }
      }
    }
    
    // Supprimer toutes les anciennes clés
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('✅ Anciennes données de partage nettoyées');
    
  } catch (error) {
    console.error('Erreur nettoyage storage:', error);
  }
};

// Nettoyer au démarrage de l'application
if (typeof window !== 'undefined') {
  cleanOldRoomData();
}
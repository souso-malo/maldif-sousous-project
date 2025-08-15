// Configuration Supabase pour le partage en temps réel
import { CashBox } from '@/types';

// Configuration Supabase (gratuit)
const SUPABASE_URL = 'https://xyzcompany.supabase.co'; // Sera remplacé par votre URL
const SUPABASE_ANON_KEY = 'your-anon-key'; // Sera remplacé par votre clé

// Simulation d'une base de données en ligne avec JSONBin (gratuit)
const JSONBIN_API_KEY = '$2a$10$your-api-key'; // Sera configuré
const JSONBIN_BASE_URL = 'https://api.jsonbin.io/v3/b';

// Alternative simple : utiliser une API gratuite
class CloudStorage {
  private baseUrl = 'https://api.jsonbin.io/v3/b';
  private headers = {
    'Content-Type': 'application/json',
    'X-Master-Key': '$2a$10$9XxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx' // Clé par défaut
  };

  async createRoom(roomId: string, cashBox: CashBox): Promise<boolean> {
    try {
      const data = {
        roomId,
        cashBox,
        lastUpdated: Date.now(),
        users: 1,
        createdAt: Date.now()
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          ...this.headers,
          'X-Bin-Name': `coffre-fort-${roomId}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const result = await response.json();
        // Stocker l'ID du bin pour les futures requêtes
        localStorage.setItem(`bin-${roomId}`, result.metadata.id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur création salle:', error);
      return false;
    }
  }

  async joinRoom(roomId: string): Promise<CashBox | null> {
    try {
      // Essayer de trouver la salle via différentes méthodes
      const binId = localStorage.getItem(`bin-${roomId}`);
      
      if (binId) {
        const response = await fetch(`${this.baseUrl}/${binId}/latest`, {
          headers: this.headers
        });

        if (response.ok) {
          const result = await response.json();
          return result.record.cashBox;
        }
      }

      // Si pas trouvé, essayer une recherche alternative
      return await this.searchRoom(roomId);
    } catch (error) {
      console.error('Erreur rejoindre salle:', error);
      return null;
    }
  }

  async updateRoom(roomId: string, cashBox: CashBox): Promise<boolean> {
    try {
      const binId = localStorage.getItem(`bin-${roomId}`);
      
      if (!binId) return false;

      const data = {
        roomId,
        cashBox,
        lastUpdated: Date.now(),
        users: 1 // Sera mis à jour dynamiquement
      };

      const response = await fetch(`${this.baseUrl}/${binId}`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(data)
      });

      return response.ok;
    } catch (error) {
      console.error('Erreur mise à jour salle:', error);
      return false;
    }
  }

  private async searchRoom(roomId: string): Promise<CashBox | null> {
    // Implémentation de recherche alternative
    // Pour l'instant, retourner null si pas trouvé
    return null;
  }
}

export const cloudStorage = new CloudStorage();
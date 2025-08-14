'use client';

import { useState } from 'react';
import { Share2, Users, Copy, Check, Wifi, WifiOff } from 'lucide-react';

interface ShareManagerProps {
  roomId: string;
  isConnected: boolean;
  connectedUsers: number;
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => boolean;
  onLeaveRoom: () => void;
}

export default function ShareManager({
  roomId,
  isConnected,
  connectedUsers,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom
}: ShareManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleCopyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback pour les navigateurs qui ne supportent pas clipboard
      const textArea = document.createElement('textarea');
      textArea.value = roomId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoinRoom = () => {
    if (!joinRoomId.trim()) {
      setError('Veuillez entrer un code de salle');
      return;
    }

    const success = onJoinRoom(joinRoomId.trim().toUpperCase());
    if (success) {
      setShowModal(false);
      setJoinRoomId('');
      setError('');
    } else {
      setError('Salle introuvable. Vérifiez le code.');
    }
  };

  const handleCreateRoom = () => {
    onCreateRoom();
    setShowModal(false);
  };

  return (
    <>
      {/* Bouton de partage */}
      <div className="flex items-center gap-2">
        {isConnected ? (
          <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
            <Wifi className="h-4 w-4" />
            <span>Salle: {roomId}</span>
            <Users className="h-4 w-4" />
            <span>{connectedUsers}</span>
            <button
              onClick={handleCopyRoomId}
              className="ml-1 p-1 hover:bg-green-200 rounded"
              title="Copier le code de la salle"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </button>
            <button
              onClick={onLeaveRoom}
              className="ml-1 p-1 hover:bg-red-200 rounded text-red-600"
              title="Quitter la salle"
            >
              <WifiOff className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm hover:bg-blue-200 transition-colors"
          >
            <Share2 className="h-4 w-4" />
            Partager
          </button>
        )}
      </div>

      {/* Modal de partage */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Partager votre coffre-fort</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Créer une nouvelle salle</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Créez une salle pour partager vos données avec d'autres personnes
                </p>
                <button
                  onClick={handleCreateRoom}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                >
                  Créer une salle
                </button>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Rejoindre une salle existante</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Entrez le code de la salle pour rejoindre un coffre-fort partagé
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                    placeholder="Code de la salle (ex: ABC123)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={6}
                  />
                  <button
                    onClick={handleJoinRoom}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                  >
                    Rejoindre
                  </button>
                </div>
                {error && (
                  <p className="text-red-600 text-sm mt-2">{error}</p>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
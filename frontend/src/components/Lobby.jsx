import React, { useState, useEffect } from 'react';
import { Gamepad2, Users } from 'lucide-react';

export const Lobby = ({ socket, error }) => {
  const [roomCode, setRoomCode] = useState('');
  const [localError, setLocalError] = useState('');
  
  useEffect(() => {
    if (error) {
      setLocalError(error);
    }
  }, [error]);

  const handleCreate = () => {
    socket.emit('createRoom');
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomCode.length !== 4) {
      setLocalError('Room code must be 4 characters');
      return;
    }
    setLocalError('');
    socket.emit('joinRoom', { roomCode: roomCode.toUpperCase() });
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-[80vh] animate-fade-in w-full">
      <div className="glass-panel p-8 md:p-12 max-w-md w-full text-center">
        <div className="mb-8 flex justify-center">
          <div className="bg-white/10 p-4 rounded-full">
            <Gamepad2 size={48} className="text-accent-blue" />
          </div>
        </div>
        
        <h1 className="text-4xl font-black mb-2 text-gradient tracking-tight">HAND CRICKET</h1>
        <p className="text-text-secondary mb-10 text-lg">Real-time multiplayer battle</p>
        
        <div className="space-y-6">
          <button 
            onClick={handleCreate}
            className="btn w-full py-4 text-lg shadow-lg hover:shadow-xl"
          >
            <Gamepad2 size={24} />
            Create New Game
          </button>
          
          <div className="flex items-center gap-4 my-6">
            <div className="h-px bg-white/20 flex-1"></div>
            <span className="text-text-secondary font-medium uppercase tracking-wider text-sm">OR</span>
            <div className="h-px bg-white/20 flex-1"></div>
          </div>
          
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Enter 4-letter Code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="input-field text-center text-xl tracking-widest font-bold uppercase py-4"
                maxLength={4}
              />
            </div>
            {localError && <p className="text-accent-red text-sm font-medium animate-shake">{localError}</p>}
            <button 
              type="submit"
              disabled={roomCode.length !== 4}
              className="btn w-full py-4 text-lg"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Users size={24} />
              Join Game
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Lobby } from './components/Lobby';
import { GameArea } from './components/GameArea';

// Initialize socket connection
const URL = 'http://localhost:3001';
const socket = io(URL, { autoConnect: false });

function App() {
  const [inRoom, setInRoom] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    socket.connect();

    socket.on('roomCreated', (data) => {
      setRoomCode(data.roomCode);
      setRole(data.role);
      setInRoom(true);
      setError('');
    });

    socket.on('roomJoined', (data) => {
      setRoomCode(data.roomCode);
      setRole(data.role);
      setInRoom(true);
      setError('');
    });

    socket.on('error', (msg) => {
      setError(msg);
      if (msg === 'Opponent disconnected') {
         setTimeout(() => {
             window.location.reload();
         }, 3000);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <>
      {error && error === 'Opponent disconnected' && (
        <div className="fixed top-0 left-0 w-full bg-accent-red text-white text-center py-2 font-bold z-50 animate-fade-in">
          Opponent disconnected! Reloading...
        </div>
      )}
      {inRoom ? (
        <GameArea socket={socket} roomCode={roomCode} role={role} />
      ) : (
        <Lobby socket={socket} error={error} />
      )}
    </>
  );
}

export default App;

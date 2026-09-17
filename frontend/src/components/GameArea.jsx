import React, { useState, useEffect } from 'react';
import { HandIcon } from './HandIcon';
import { Trophy, Shield, Zap, Target } from 'lucide-react';

export const GameArea = ({ socket, roomCode, role }) => {
  const [players, setPlayers] = useState([]);
  const [turn, setTurn] = useState('');
  const [targetScore, setTargetScore] = useState(null);
  
  const [myChoice, setMyChoice] = useState(null);
  const [opponentChoice, setOpponentChoice] = useState(null);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  
  const [gameState, setGameState] = useState('WAITING_FOR_OPPONENT'); // WAITING_FOR_OPPONENT, PLAYING, WAITING_CHOICE, COUNTDOWN, REVEAL, GAMEOVER
  const [countdown, setCountdown] = useState(3);
  const [pendingResult, setPendingResult] = useState(null);
  const [roundResult, setRoundResult] = useState(null);
  const [gameOverDetails, setGameOverDetails] = useState(null);

  useEffect(() => {
    socket.emit('playerReady', { roomCode });

    socket.on('gameStart', (data) => {
      setPlayers(data.players);
      setTurn(data.turn);
      setGameState('PLAYING');
    });

    socket.on('revealChoices', (data) => {
      setPendingResult(data);
      setGameState('COUNTDOWN');
      setCountdown(3);
    });

    socket.on('gameOver', (data) => {
      setGameOverDetails(data);
    });

    return () => {
      socket.off('gameStart');
      socket.off('revealChoices');
      socket.off('gameOver');
    };
  }, [socket]);

  // Handle Countdown
  useEffect(() => {
    if (gameState === 'COUNTDOWN') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(c => c - 1), 800);
        return () => clearTimeout(timer);
      } else {
        // Countdown finished, transition to REVEAL
        setGameState('REVEAL');
        
        const data = pendingResult;
        const isP1 = role === 'Player 1';
        
        setMyChoice(isP1 ? data.p1Choice : data.p2Choice);
        setOpponentChoice(isP1 ? data.p2Choice : data.p1Choice);
        
        setMyScore(isP1 ? data.p1Score : data.p2Score);
        setOpponentScore(isP1 ? data.p2Score : data.p1Score);
        
        if (data.target) setTargetScore(data.target);
        if (data.newTurn) setTurn(data.newTurn);
        
        setRoundResult({
          outcome: data.outcome,
          reason: data.reason
        });

        // After reveal, either go to PLAYING or GAMEOVER
        setTimeout(() => {
          if (data.gameOver) {
            setGameState('GAMEOVER');
          } else {
            setGameState('PLAYING');
            setMyChoice(null);
            setOpponentChoice(null);
            setRoundResult(null);
            setPendingResult(null);
          }
        }, 4000);
      }
    }
  }, [gameState, countdown, pendingResult, role]);

  const handleChoice = (num) => {
    if (gameState !== 'PLAYING') return;
    setMyChoice(num);
    setGameState('WAITING_CHOICE');
    socket.emit('makeChoice', { roomCode, choice: num });
  };

  const amIBatting = turn === role;

  if (gameState === 'WAITING_FOR_OPPONENT') {
    return (
      <div className="flex flex-col items-center justify-center p-6 min-h-[80vh] animate-fade-in w-full text-center">
        <div className="glass-panel p-12 max-w-md w-full">
          <div className="animate-bounce mb-6">
            <Zap size={48} className="text-accent-blue mx-auto" />
          </div>
          <h2 className="text-3xl font-black mb-4">Room Created!</h2>
          <p className="text-text-secondary mb-6 text-lg">Share this code with your opponent:</p>
          <div className="bg-white/10 border border-white/20 py-4 px-8 rounded-lg mb-8 inline-block">
            <span className="text-5xl font-black tracking-widest text-gradient">{roomCode}</span>
          </div>
          <p className="text-text-secondary animate-pulse">Waiting for opponent to join...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto p-4 md:p-6 animate-fade-in min-h-screen">
      
      {/* Header Info */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-gradient">HAND CRICKET</h1>
          <p className="text-sm text-text-secondary font-medium">Room: {roomCode} | You are {role}</p>
        </div>
        
        {targetScore && (
          <div className="glass-panel px-4 py-2 flex items-center gap-2 border-accent-purple/50 bg-accent-purple/10">
            <Target size={20} className="text-accent-purple" />
            <span className="font-bold">Target: {targetScore}</span>
          </div>
        )}
      </div>

      {/* Score Board */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* My Score */}
        <div className={`glass-panel p-6 relative overflow-hidden ${amIBatting ? 'border-accent-green/50 bg-accent-green/5' : ''}`}>
          {amIBatting && <div className="absolute top-0 right-0 bg-accent-green text-white text-xs font-bold px-2 py-1 rounded-bl-lg">BATTING</div>}
          {!amIBatting && <div className="absolute top-0 right-0 bg-accent-red text-white text-xs font-bold px-2 py-1 rounded-bl-lg">BOWLING</div>}
          
          <div className="flex items-center gap-3 mb-2">
            <Shield size={24} className="text-text-secondary" />
            <h3 className="text-lg font-bold text-text-secondary">You</h3>
          </div>
          <div className="text-5xl font-black">{myScore}</div>
        </div>

        {/* Opponent Score */}
        <div className={`glass-panel p-6 relative overflow-hidden ${!amIBatting ? 'border-accent-green/50 bg-accent-green/5' : ''}`}>
          {!amIBatting && <div className="absolute top-0 right-0 bg-accent-green text-white text-xs font-bold px-2 py-1 rounded-bl-lg">BATTING</div>}
          {amIBatting && <div className="absolute top-0 right-0 bg-accent-red text-white text-xs font-bold px-2 py-1 rounded-bl-lg">BOWLING</div>}
          
          <div className="flex items-center gap-3 mb-2">
            <Shield size={24} className="text-text-secondary" />
            <h3 className="text-lg font-bold text-text-secondary">Opponent</h3>
          </div>
          <div className="text-5xl font-black">{opponentScore}</div>
        </div>
      </div>

      {/* Battle Arena */}
      <div className="glass-panel flex-1 flex flex-col items-center justify-center p-8 mb-8 relative min-h-[300px]">
        {gameState === 'COUNTDOWN' && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-color/80 backdrop-blur-sm rounded-xl z-10 animate-fade-in">
            <div className="text-9xl font-black text-gradient animate-bounce">
              {countdown > 0 ? countdown : 'GO!'}
            </div>
          </div>
        )}

        {gameState === 'REVEAL' && roundResult && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/10 px-6 py-2 rounded-full border border-white/20 animate-fade-in z-10">
            <span className="font-bold text-lg">
              {roundResult.outcome === 'out' ? <span className="text-accent-red">WICKET! 🏏</span> : <span className="text-accent-green">+{pendingResult[amIBatting ? (role === 'Player 1' ? 'p1Choice' : 'p2Choice') : (role === 'Player 1' ? 'p2Choice' : 'p1Choice')]} Runs 🏃</span>}
            </span>
          </div>
        )}

        <div className="flex items-center justify-center gap-12 w-full">
          {/* My Hand Reveal */}
          <div className="flex flex-col items-center gap-4">
            <h4 className="font-bold text-text-secondary">You</h4>
            {gameState === 'REVEAL' || gameState === 'WAITING_CHOICE' ? (
               <HandIcon number={myChoice} className={gameState === 'REVEAL' ? 'animate-fade-in scale-110 border-accent-blue' : 'opacity-50'} />
            ) : (
               <div className="w-32 h-40 border-2 border-dashed border-white/20 rounded-2xl flex items-center justify-center text-white/30 font-medium">?</div>
            )}
          </div>
          
          <div className="text-3xl font-black text-white/20">VS</div>
          
          {/* Opponent Hand Reveal */}
          <div className="flex flex-col items-center gap-4">
            <h4 className="font-bold text-text-secondary">Opponent</h4>
            {gameState === 'REVEAL' ? (
               <HandIcon number={opponentChoice} className="animate-fade-in scale-110 border-accent-red" />
            ) : (
               <div className="w-32 h-40 border-2 border-dashed border-white/20 rounded-2xl flex items-center justify-center text-white/30 font-medium">?</div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      {gameState === 'GAMEOVER' ? (
        <div className="glass-panel p-8 text-center animate-fade-in border-accent-purple/50 bg-accent-purple/10">
          <Trophy size={64} className="text-accent-purple mx-auto mb-4 animate-bounce" />
          <h2 className="text-4xl font-black mb-2">
            {gameOverDetails?.winner === role ? 'YOU WON!' : 'YOU LOST!'}
          </h2>
          <p className="text-xl text-text-secondary mb-6">{gameOverDetails?.reason}</p>
          <button onClick={() => window.location.reload()} className="btn">Play Again</button>
        </div>
      ) : (
        <div className="glass-panel p-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold">
              {gameState === 'PLAYING' ? 'Choose your number' : 
               gameState === 'WAITING_CHOICE' ? 'Waiting for opponent...' : 
               'Round in progress...'}
            </h3>
          </div>
          
          <div className="grid grid-cols-3 gap-4 md:gap-6 max-w-2xl mx-auto">
            {[1, 2, 3, 4, 5, 6].map(num => (
              <button
                key={num}
                onClick={() => handleChoice(num)}
                disabled={gameState !== 'PLAYING'}
                className={`glass-panel border-white/10 hover:border-accent-blue/50 transition-all p-2 rounded-2xl group ${gameState !== 'PLAYING' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white/5 hover:-translate-y-1'}`}
              >
                <HandIcon number={num} className={`bg-transparent border-none shadow-none p-2 ${gameState === 'PLAYING' ? 'hand-anim' : ''}`} />
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

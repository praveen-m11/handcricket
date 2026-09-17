import React from 'react';

const handGestures = {
  1: '☝️',
  2: '✌️',
  3: '🤟',
  4: '🖖',
  5: '🖐️',
  6: '🤙'
};

export const HandIcon = ({ number, className = '', animate = false }) => {
  return (
    <div className={`flex flex-col items-center justify-center bg-white/10 border border-white/20 rounded-2xl p-6 shadow-xl ${animate ? 'animate-bounce' : ''} ${className}`} style={{ minWidth: '120px' }}>
      <span style={{ fontSize: '5rem', lineHeight: 1, filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.3))' }}>
        {handGestures[number] || '❓'}
      </span>
      <span className="text-2xl font-black mt-3 text-white tracking-widest">{number}</span>
    </div>
  );
};

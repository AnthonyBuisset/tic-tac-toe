import React from 'react';

const SimpleApp: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎮 Stellar Tic-Tac-Toe</h1>
      <p>Hello World! The React app is working.</p>
      <button onClick={() => alert('Button clicked!')}>
        Test Button
      </button>
    </div>
  );
};

export default SimpleApp;
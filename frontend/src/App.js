import React from 'react';
import Game from './Game';

function App() {
  return (
    <div className="App" style={{
      backgroundColor: '#f0f2f5',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <h1 style={{
        fontSize: '2.5rem',
        color: '#1a1a1a',
        marginBottom: '30px',
        textAlign: 'center',
        fontFamily: "'Noto Sans KR', sans-serif",
        fontWeight: '700',
        textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
      }}>Who's Human?</h1>
      <Game />
    </div>
  );
}

export default App;
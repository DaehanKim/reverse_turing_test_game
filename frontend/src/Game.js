import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Game = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [gameState, setGameState] = useState({
    agents: [],
    currentTurn: 0,
    phase: 'not_started'
  });
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (gameState.phase !== 'not_started' && gameState.agents[gameState.currentTurn] !== 'User') {
      handleAITurn();
    }
  }, [gameState.currentTurn, gameState.phase]);

  const startGame = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/start_game');
      setGameState({
        agents: response.data.agents,
        currentTurn: 0,
        phase: 'questioning'
      });
      setMessages([{ sender: 'System', text: "게임이 시작되었습니다. 목적은 게임 참여자들 중 인간을 찾아내는 것입니다. 질문과 대화를 주의깊게 보고 누가 인간인지 찾아보세요." }]);
    } catch (error) {
      console.error('Error starting game:', error);
      setMessages(prevMessages => [...prevMessages, { sender: 'System', text: "게임 시작 중 오류가 발생했습니다." }]);
    }
  };

  const handleAITurn = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/send_message', { message: "AI 자동 메시지" });
      setMessages(prev => [...prev, { sender: gameState.agents[gameState.currentTurn], text: response.data.message }]);
      setGameState(prevState => ({
        ...prevState,
        currentTurn: (prevState.currentTurn + 1) % prevState.agents.length,
        phase: response.data.phase
      }));

      if (response.data.phase === 'voting') {
        setMessages(prev => [...prev, { sender: 'System', text: "모든 에이전트가 질문을 마쳤습니다. 이제 각 에이전트가 투표하고 이유를 설명할 차례입니다." }]);
      }
    } catch (error) {
      console.error('Error in AI turn:', error);
      setMessages(prev => [...prev, { sender: 'System', text: "AI 턴 처리 중 오류가 발생했습니다." }]);
    }
  };

  const handleUserInput = async () => {
    if (inputMessage.trim() === '') return;

    setMessages(prev => [...prev, { sender: 'User', text: inputMessage }]);
    setInputMessage('');

    try {
      const response = await axios.post('http://localhost:5000/api/send_message', { message: inputMessage });
      setGameState(prevState => ({
        ...prevState,
        currentTurn: (prevState.currentTurn + 1) % prevState.agents.length,
        phase: response.data.phase
      }));

      if (response.data.phase === 'voting') {
        setMessages(prev => [...prev, { sender: 'System', text: "모든 에이전트가 질문을 마쳤습니다. 이제 각 에이전트가 투표하고 이유를 설명할 차례입니다." }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { sender: 'System', text: "메시지 전송 중 오류가 발생했습니다." }]);
    }
  };

  return (
    <div className="game-container" style={{ 
      width: '100%',
      maxWidth: '600px', 
      margin: '0 auto', 
      fontFamily: "'Noto Sans KR', sans-serif",
      boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
      borderRadius: '20px',
      overflow: 'hidden',
      background: '#ffffff'
    }}>
      {gameState.phase === 'not_started' && (
        <button onClick={startGame} style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          margin: '20px'
        }}>
          게임 시작
        </button>
      )}
      <div className="agent-list" style={{ padding: '10px 20px', backgroundColor: '#f0f0f0', borderBottom: '1px solid #e4e6eb' }}>
        <p>에이전트 목록: {gameState.agents.join(' → ') + "(User)"}</p>
      </div>
      <div className="chat-box" style={{ 
        height: '400px', 
        overflowY: 'scroll', 
        padding: '20px', 
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        '&::-webkit-scrollbar': {
          display: 'none'
        }
      }}>
        {messages.map((message, index) => (
          <div key={index} style={{ 
            marginBottom: '15px',
          }}>
            <span style={{ 
              background: message.sender === 'User' ? '#0084ff' : message.sender === 'System' ? '#f0f0f0' : '#e4e6eb',
              color: message.sender === 'User' ? 'white' : 'black',
              padding: '12px 16px',
              borderRadius: '18px',
              display: 'inline-block',
              maxWidth: '70%',
              wordBreak: 'break-word',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
              <strong>{message.sender}:</strong> {message.text}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {gameState.phase !== 'not_started' && gameState.agents[gameState.currentTurn] === 'User' && (
        <div className="input-area" style={{ 
          display: 'flex', 
          padding: '20px',
          borderTop: '1px solid #e4e6eb'
        }}>
          <input 
            type="text" 
            value={inputMessage} 
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleUserInput()}
            style={{ 
              flexGrow: 1, 
              marginRight: '10px', 
              padding: '12px', 
              border: '1px solid #e4e6eb',
              borderRadius: '20px',
              outline: 'none',
              fontSize: '16px'
            }}
            placeholder="메시지를 입력하세요..."
          />
          <button 
            onClick={handleUserInput}
            style={{ 
              padding: '12px 24px', 
              background: '#0084ff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '20px',
              cursor: 'pointer',
              transition: 'background 0.3s',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
            onMouseOver={(e) => e.target.style.background = '#0066cc'}
            onMouseOut={(e) => e.target.style.background = '#0084ff'}
          >
            전송
          </button>
        </div>
      )}
    </div>
  );
};

export default Game;
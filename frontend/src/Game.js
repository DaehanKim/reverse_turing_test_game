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
  const [gameEnded, setGameEnded] = useState(false);
  const messagesEndRef = useRef(null);
  const prevPhaseRef = useRef('not_started');


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (gameState.phase !== 'not_started' && gameState.agents[gameState.currentTurn] !== gameState.agents[gameState.agents.length-1]) {
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
      // 시스템 메시지 설정 API 호출
      let systemMessage = "게임이 시작되었습니다. AI의 목적은 게임 참여자들 중 인간을 찾아내는 것입니다. 당신은 인간임을 들키지 않도록 적절한 질문과 대답을 해야 합니다.";
      // await axios.post('http://localhost:5000/api/set_system_message', { message: systemMessage });
      
      setMessages([{ sender: 'System', text: systemMessage}]);
    } catch (error) {
      console.error('Error starting game:', error);
      setMessages(prevMessages => [...prevMessages, { sender: 'System', text: "게임 시작 중 오류가 발생했습니다." }]);
    }
  };
  
  const handleAITurn = async () => {
    try {
      if (gameEnded) {
        return;
      }
      let response;
      if (gameState.phase === 'voting') {
        response = await axios.post('http://localhost:5000/api/vote', {});
      } else if (gameState.phase === 'questioning' || gameState.phase === 'answering') {
        response = await axios.post('http://localhost:5000/api/send_message', {});
      } else {
        console.error('Unexpected game phase:', gameState.phase);
        return;
      }
      
      setMessages(prev => [...prev, { sender: gameState.agents[gameState.currentTurn], text: response.data.message }]);
      
      
      // 이전 단계와 현재 단계를 비교하여 voting에 처음 진입했는지 확인
      if (prevPhaseRef.current !== 'voting' && response.data.phase === 'voting') {
        let systemMessage = "모든 AI가 질문을 마쳤습니다. 이제 각 AI가 투표하고 이유를 설명할 차례입니다.";
        setMessages(prev => [...prev, { sender: 'System', text: systemMessage}]);
      }
      

      // 현재 단계를 저장
      prevPhaseRef.current = response.data.phase;

      setGameState(prevState => ({
        ...prevState,
        currentTurn: response.data.turn,
        phase: response.data.phase
      }));
    } catch (error) {
      console.error('Error in AI turn:', error);
      setMessages(prev => [...prev, { sender: 'System', text: "AI 턴 처리 중 오류가 발생했습니다." }]);
    }
  };
  
  const handleUserInput = async () => {
    if (inputMessage.trim() === '' || gameState.phase === 'not_started') return;
  
    setMessages(prev => [...prev, { sender: 'User', text: inputMessage }]);
    setInputMessage("");
  
    try {
      let response;
      if (gameState.phase === 'voting') {
        response = await axios.post('http://localhost:5000/api/vote', { user_message: inputMessage });
      } else if (gameState.phase === 'questioning' || gameState.phase === 'answering') {
        response = await axios.post('http://localhost:5000/api/send_message', { user_message: inputMessage });
      } else {
        // 예상치 못한 상태일 경우
        console.error('Unexpected game phase:', gameState.phase);
        return;
      }
      
      if (response.data.vote_result) {
        let systemMessage = "투표가 종료되었습니다. 결과를 집계합니다. 잠시 기다려주세요.";
        setMessages(prev => [...prev, { sender: 'System', text: systemMessage}]);


        await new Promise(resolve => {
        setTimeout(() => {
          setMessages(prev => [...prev, { sender: 'System', text: response.data.vote_result + "이 가장 많은 표를 얻어 게임에서 패배했습니다!" }]);
          // setMessages(prev => [...prev, { sender: 'System', text: response.data.vote_stat }]);
          setGameEnded(true);
          resolve();
        }, 2000);
        });
        setGameEnded(true);
      }


      setGameState(prevState => ({
        ...prevState,
        currentTurn: response.data.turn,
        phase: response.data.phase
      }));
  
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
      {gameEnded && (
        <div className="game-end-message" style={{ padding: '20px', backgroundColor: '#f0f0f0', marginTop: '20px', borderRadius: '5px' }}>
          <h2>게임이 종료되었습니다</h2>
          <p>새 게임을 시작하려면 페이지를 새로고침 해주세요.</p>
        </div>
      )}
  
      {!gameEnded && gameState.phase === 'not_started' && (
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
        <p>발언 순서: {gameState.agents.join(' → ')}</p>
        {!gameEnded && gameState.phase !== 'not_started' && (
          <>
            <p>당신은 <span style={{ fontWeight: 'bold', color: 'green' }}>{gameState.agents[gameState.agents.length-1]}</span> 역할입니다.</p>
            {gameState.agents[gameState.currentTurn] === gameState.agents.at(-1) && (
              <p>
                {gameState.phase === 'questioning' && (
                  <>
                    <span style={{ fontWeight: 'bold', color: 'green' }}>{gameState.agents.at(0)}</span>에게 <span style={{ fontWeight: 'bold', color: 'green' }}>질문</span>할 시간입니다.
                  </>
                )}
                {gameState.phase === 'answering' && (
                  <>
                    <span style={{ fontWeight: 'bold', color: 'green' }}>{gameState.agents.at(-2)}</span>에게 <span style={{ fontWeight: 'bold', color: 'green' }}>답변</span>할 시간입니다.
                  </>
                )}
                {gameState.phase === 'voting' && (
                  <>
                    <span style={{ fontWeight: 'bold', color: 'green' }}>투표</span>할 시간입니다.
                  </>
                )}
              </p>
            )}
          </>
        )}
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
      {!gameEnded && gameState.phase !== 'not_started' && gameState.agents[gameState.currentTurn] === gameState.agents.at(-1) && (
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
  );}

export default Game;
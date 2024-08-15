import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Game.css';

const Game = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [gameState, setGameState] = useState({
    agents: [],
    currentTurn: 0,
    phase: 'not_started',
    agentDescriptions : {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const messagesEndRef = useRef(null);
  const prevPhaseRef = useRef('not_started');
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef(null);
  const [typingMessage, setTypingMessage] = useState({ id: null, text: '', fullText: '' });
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const Spinner = () => (
    <div className="spinner"></div>
  );

  const startTimer = () => {
    setTimeLeft(30);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
            if (prevTime <= 1) {
                clearInterval(timerRef.current);

                // 입력 메시지가 존재하는 경우에만 전송
                if (inputMessage.trim() !== '') {
                    handleUserInput(inputMessage, true);  // true는 타임아웃을 의미합니다
                } else {
                    handleUserInput("(No response)", true);  // 메시지가 없을 때 기본값을 전송
                }

                return 0;
            }
            return prevTime - 1;
        });
    }, 1000);
};


  

  useEffect(() => {
    if (gameState.phase !== 'not_started') {
      if (gameState.agents[gameState.currentTurn] === gameState.agents.at(-1)) {
        startTimer();
      } else {
        handleAITurn();
      }
    }
  }, [gameState.currentTurn, gameState.phase]);
  
  const getPlaceholderText = () => {
    if (gameState.agents && gameState.agents.length > 0) {
        if (gameState.phase === 'answering') {
            return `${gameState.agents.at(-2)}에게 답변하세요`;
        } else if (gameState.phase === 'questioning') {
            return `${gameState.agents.at(0)}에게 질문하세요`;
        } else {
            return "가장 인간같은 AI에게 투표하세요";
        }
    } else {
        return "메시지를 입력하세요...";
    }
};




  const typeMessage = (fullText, speed = 50) => {
    return new Promise((resolve) => {
      let i = 0;
      const intervalId = setInterval(() => {
        if (i < fullText.length) {
          setTypingMessage(prev => ({ ...prev, text: prev.text + fullText[i] }));
          i++;
        } else {
          clearInterval(intervalId);
          resolve();
        }
      }, speed);
    });
  };
  
  const startGame = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/start_game');
      setGameState({
        agents: response.data.agents,
        agentDescriptions: response.data.agent_descriptions,
        currentTurn: 0,
        phase: 'questioning'
      });
      let systemMessage = "게임이 시작되었습니다. AI의 목적은 게임 참여자들 중 인간을 찾아내는 것입니다. 당신은 인간임을 들키지 않도록 적절한 질문과 대답을 해야 합니다.";
      setMessages([{ sender: 'System', text: systemMessage}]);
    } catch (error) {
      console.error('Error starting game:', error);
      setMessages(prevMessages => [...prevMessages, { sender: 'System', text: "게임 시작 중 오류가 발생했습니다." }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  
  
  const handleAITurn = async () => {
    try {
        if (gameEnded) return;
        
        const typingMessageId = Date.now();
        const typingStates = ['| ', '/ ', '—', '\\ '];
        let typingIndex = 0;

        const typingInterval = setInterval(() => {
            setTypingMessage({ id: typingMessageId, text: typingStates[typingIndex], fullText: '' });
            typingIndex = (typingIndex + 1) % typingStates.length;
        }, 500);

        let response;
        if (gameState.phase === 'voting') {
            response = await axios.post('http://localhost:5000/api/vote', {});
        } else if (gameState.phase === 'questioning' || gameState.phase === 'answering') {
            response = await axios.post('http://localhost:5000/api/send_message', {});
        } else {
            console.error('Unexpected game phase:', gameState.phase);
            clearInterval(typingInterval);
            return;
        }
        
        const delay = Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000;
        await new Promise(resolve => setTimeout(resolve, delay));

        clearInterval(typingInterval);
        setTypingMessage({ id: typingMessageId, text: '', fullText: response.data.message });

        await typeMessage(response.data.message);

        setMessages(prev => [...prev, { id: typingMessageId, sender: gameState.agents[gameState.currentTurn], text: response.data.message }]);

        setTypingMessage({ id: null, text: '', fullText: '' });

        if (response.data.vote_result) {
            let systemMessage = `투표가 종료되었습니다. ${response.data.vote_result}이(가) 가장 많은 표를 얻어 게임에서 패배했습니다!`;
            setMessages(prev => [...prev, { sender: 'System', text: systemMessage }]);
            setGameEnded(true);
        } else if (prevPhaseRef.current !== 'voting' && response.data.phase === 'voting') {
            let systemMessage = "모든 AI가 질문을 마쳤습니다. 이제 각 AI가 투표하고 이유를 설명할 차례입니다.";
            setMessages(prev => [...prev, { sender: 'System', text: systemMessage }]);
        }

        prevPhaseRef.current = response.data.phase;

        if (!response.data.vote_result) {
            setGameState(prevState => ({
                ...prevState,
                currentTurn: (response.data.turn === 0) ? 0 : prevState.currentTurn + 1,
                phase: response.data.phase
            }));
        }
    } catch (error) {
        console.error('Error in AI turn:', error);
        setMessages(prev => [...prev, { sender: 'System', text: "AI 턴 처리 중 오류가 발생했습니다." }]);
    }
};

  
  const handleUserInput = async (message, isTimeout = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (gameState.phase === 'not_started') return;

    let finalMessage = isTimeout ? "(No response)" : message.trim();

    if (finalMessage === '') {
        finalMessage = "(No response)";
    }

    setInputMessage("");

    setMessages(prev => [...prev, { sender: 'User', text: finalMessage }]);

    try {
        let response;
        if (gameState.phase === 'voting') {
            response = await axios.post('http://localhost:5000/api/vote', { user_message: finalMessage });
        } else if (gameState.phase === 'answering') {
            response = await axios.post('http://localhost:5000/api/send_message', { user_message: finalMessage });
        } else if (gameState.phase === 'questioning') {
            response = await axios.post('http://localhost:5000/api/send_message', { user_message: finalMessage });
        } else {
            console.error('Unexpected game phase:', gameState.phase);
            return;
        }

        setGameState(prevState => ({
            ...prevState,
            currentTurn: response.data.turn,
            phase: response.data.phase
        }));

        if (response.data.turn === gameState.agents.length - 1) {
            startTimer();
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
      {gameEnded && (
        <div className="game-end-message" style={{ padding: '20px', backgroundColor: '#f0f0f0', marginTop: '20px', borderRadius: '5px' }}>
          <h2>게임이 종료되었습니다</h2>
          <p>새 게임을 시작하려면 페이지를 새로고침 해주세요.</p>
        </div>
      )}
  
        {!gameEnded && gameState.phase === 'not_started' && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
          {isLoading ? (
            <Spinner />
          ) : (
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
        </div>
      )}
      <div className="agent-list" style={{ padding: '10px 20px', backgroundColor: '#f0f0f0', borderBottom: '1px solid #e4e6eb' }}>
        <h3>게임 참여자</h3>
        {gameState.agents.map((agent, index) => (
          <React.Fragment key={agent}>
            <p style={{ marginBottom: '5px' }}>
              <strong>{agent}</strong>: {gameState.agentDescriptions[agent]}
            </p>
            {index < gameState.agents.length - 1 && (
              <div style={{ textAlign: 'center', margin: '5px 0' }}>↓</div>
            )}
          </React.Fragment>
        ))}
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
{typingMessage.id && (
  <div style={{ 
    marginBottom: '15px',
  }}>
    <span style={{ 
      background: '#e4e6eb',
      color: 'black',
      padding: '12px 16px',
      borderRadius: '18px',
      display: 'inline-block',
      maxWidth: '70%',
      wordBreak: 'break-word',
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
    }}>
      <strong>{gameState.agents[gameState.currentTurn]}:</strong> {typingMessage.text}
    </span>
  </div>
)}
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
          onKeyPress={(e) => e.key === 'Enter' && handleUserInput(inputMessage)}
          disabled={timeLeft === 0}
          style={{ 
            flexGrow: 1, 
            marginRight: '10px', 
            padding: '12px', 
            border: '1px solid #e4e6eb',
            borderRadius: '20px',
            outline: 'none',
            fontSize: '16px',
            opacity: timeLeft === 0 ? 0.5 : 1,
          }}
          placeholder={getPlaceholderText()}  // 이 부분을 추가
        />

        <button 
          onClick={() => handleUserInput(inputMessage)}
          disabled={timeLeft === 0}
          style={{ 
            padding: '12px 24px', 
            background: '#0084ff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '20px',
            cursor: timeLeft === 0 ? 'not-allowed' : 'pointer',
            transition: 'background 0.3s',
            fontSize: '16px',
            fontWeight: 'bold',
            opacity: timeLeft === 0 ? 0.5 : 1,
          }}
          onMouseOver={(e) => e.target.style.background = timeLeft > 0 ? '#0066cc' : '#0084ff'}
          onMouseOut={(e) => e.target.style.background = '#0084ff'}
        >
          전송
        </button>
      </div>
    )}
      {!gameEnded && gameState.phase !== 'not_started' && gameState.agents[gameState.currentTurn] === gameState.agents.at(-1) && (
        <>
          <div className="time-bar" style={{
            width: '100%',
            height: '10px',
            backgroundColor: '#e0e0e0',
            marginBottom: '10px'
          }}>
            <div style={{
              width: `${(timeLeft / 30) * 100}%`,
              height: '100%',
              backgroundColor: timeLeft > 5 ? '#4CAF50' : '#f44336',
              transition: 'width 1s linear, background-color 1s'
            }}/>
          </div>
        </>
      )}
    </div>
    
  );}

export default Game;
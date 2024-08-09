from flask import Flask, request, jsonify
from flask_cors import CORS
from utils import chat, historical_figures

app = Flask(__name__)
CORS(app)

# 게임 상태 관리
game_state = {
    'agents': [],
    'current_turn': 0,
    'chat_history': [],
    'phase': 'not_started',  # 'not_started', 'questioning' or 'voting'
}

@app.route('/api/start_game', methods=['POST'])
def start_game():
    try:
        names = historical_figures(4).name
        game_state['agents'] = names[:3]  # 3명의 역사적 인물 생성
        game_state['agents'].append(names[3])  # 사용자를 에이전트 목록에 추가
        game_state['current_turn'] = 0
        game_state['chat_history'] = []
        game_state['phase'] = 'questioning'
        return jsonify({"message": "Game started", "agents": game_state['agents']})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/send_message', methods=['POST'])
def send_message():
    if game_state['phase'] == 'not_started':
        return jsonify({"error": "Game has not started yet"}), 400
    
    try:
        data = request.json
        user_message = data['message']
        current_agent = game_state['agents'][game_state['current_turn']]
        next_agent = game_state['agents'][(game_state['current_turn'] + 1) % len(game_state['agents'])]

        # 메시지 추가
        game_state['chat_history'].append(f"{current_agent}: {user_message}")

        # AI 응답 생성 (다음 에이전트가 User가 아닌 경우에만)
        if next_agent != "User":
            ai_message = chat(next_agent, user_message, game_state['chat_history'])
            game_state['chat_history'].append(f"{next_agent}: {ai_message}")
        else:
            ai_message = "사용자의 차례입니다. 답변해주세요."

        # 다음 턴으로 이동
        game_state['current_turn'] = (game_state['current_turn'] + 1) % len(game_state['agents'])

        # 모든 에이전트가 질문을 마치면 투표 단계로 전환
        if game_state['current_turn'] == 0 and game_state['phase'] == 'questioning':
            game_state['phase'] = 'voting'
            return jsonify({
                "message": ai_message,
                "phase": "voting",
                "instruction": "모든 에이전트가 질문을 마쳤습니다. 이제 각 에이전트가 투표하고 이유를 설명할 차례입니다.",
                "current_agent": next_agent
            })

        return jsonify({
            "message": ai_message, 
            "current_agent": next_agent, 
            "phase": game_state['phase']
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/vote', methods=['POST'])
def vote():
    if game_state['phase'] != 'voting':
        return jsonify({"error": "Voting phase has not started yet"}), 400
    
    try:
        data = request.json
        vote_message = data['message']
        current_agent = game_state['agents'][game_state['current_turn']]

        game_state['chat_history'].append(f"{current_agent} (투표): {vote_message}")

        # 다음 에이전트로 이동
        game_state['current_turn'] = (game_state['current_turn'] + 1) % len(game_state['agents'])

        # 모든 에이전트가 투표를 마치면 게임 종료
        if game_state['current_turn'] == 0:
            game_state['phase'] = 'not_started'  # 게임 종료 후 상태 초기화
            return jsonify({
                "message": "모든 에이전트가 투표를 마쳤습니다. 게임이 종료되었습니다.",
                "game_over": True,
                "chat_history": game_state['chat_history']
            })

        return jsonify({
            "message": f"{game_state['agents'][game_state['current_turn']]}의 투표 차례입니다.",
            "current_agent": game_state['agents'][game_state['current_turn']],
            "phase": "voting"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/')
def home():
    return "Welcome to the Reverse Turing Test Game API"

if __name__ == '__main__':
    app.run(debug=True)
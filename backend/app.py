from flask import Flask, request, jsonify
from flask_cors import CORS
from utils import chat, historical_figures, vote, get_vote_results

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
        game_state['is_ai'] = [True, True, True, False]
        game_state['phase'] = 'questioning'
        return jsonify({"message": "Game started", "agents": game_state['agents']})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/set_system_message', methods=['POST'])
def set_system_message():
    try:
        data = request.json
        game_state['chat_history'].append(f"System : {data['message']}")
        print(game_state['chat_history'])
        return jsonify({"system_message": data['message']})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/send_message', methods=['POST'])
def send_message():
    if game_state['phase'] == 'not_started':
        return jsonify({"error": "Game has not started yet"}), 400
    
    try:
        data = request.json
        user_message = data.get("user_message", None)
        current_agent = game_state['agents'][game_state['current_turn']]
        is_ai = game_state['is_ai'][game_state['current_turn']]

        # AI 응답 생성 (다음 에이전트가 User가 아닌 경우에만)
        if is_ai:
            ai_response = chat(current_agent, game_state['chat_history'])
            game_state['chat_history'].append(f"{current_agent}: {ai_response}")
            message = ai_response
        else:
            game_state['chat_history'].append(f"{current_agent}: {user_message}")
            message = user_message            

        print(f"turn {game_state['current_turn']} : {message}")

        # 다음 턴으로 이동
        game_state['current_turn'] = (game_state['current_turn'] + 1) % len(game_state['agents'])

        # 모든 에이전트가 질문을 마치면 투표 단계로 전환
        if game_state['current_turn'] == 0 and game_state['phase'] == 'questioning':
            game_state['phase'] = 'voting'
            return jsonify({
                "message" : message,
                "phase": "voting",
                "current_agent": current_agent
            })

        return jsonify({
            "message" : message,
            "current_agent": current_agent, 
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
        current_agent = game_state['agents'][game_state['current_turn']]

        vote_response = vote(current_agent, game_state['chat_history'])
        game_state['vote_history'].append(f"{current_agent}: {vote_response}")


        # 다음 에이전트로 이동
        game_state['current_turn'] = (game_state['current_turn'] + 1) % len(game_state['agents'])

        # 모든 에이전트가 투표를 마치면 게임 종료
        if game_state['current_turn'] == 0:
            # vote 결과 집계
            vote_result = get_vote_results(game_state['vote_history'])
            game_state['phase'] = 'not_started'  # 게임 종료 후 상태 초기화
            return jsonify({
                "vote_result" : vote_result.most_picked,
                "vote_stat" : vote_result.stat,
                "message": vote_response,
                "game_over": True,
                "chat_history": game_state['chat_history']
            })

        return jsonify({
            "message": vote_response,
            "current_agent": current_agent,
            "phase": "voting"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/')
def home():
    return "Welcome to the Reverse Turing Test Game API"

if __name__ == '__main__':
    app.run(debug=True)
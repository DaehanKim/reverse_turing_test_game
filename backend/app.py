from flask import Flask, request, jsonify
from flask_cors import CORS
from utils import question, answer, historical_figures, vote, get_vote_results
import random

app = Flask(__name__)
CORS(app)

# 게임 상태 관리
game_state = {
    'agents': [],
    'current_turn': 0,
    'chat_history': [],
    'phase': 'not_started',  # 'not_started', 'questioning', 'answering' or 'voting'
}

@app.route('/api/start_game', methods=['POST'])
def start_game():
    try:
        random_year = random.randint(0, 1900)
        figures = historical_figures(4, random_year)
        names = figures.name
        print(figures.descriptions)
        descriptions = {k:v for k,v in zip(names, figures.descriptions)}
        game_state['agents'] = names[:3]  # 3명의 역사적 인물 생성
        game_state['agents'].append(names[3])  # 사용자를 에이전트 목록에 추가
        game_state['current_turn'] = 0
        game_state['chat_history'] = []
        game_state['is_ai'] = [True, True, True, False]
        game_state['phase'] = 'questioning'
        game_state['finished_answering'] = [False] * 4
        game_state['finished_questioning'] = [False] * 4
        game_state['finished_voting'] = [False] * 4
        game_state['vote_history'] = []
        return jsonify({"message": "Game started", "agents": game_state['agents'], "agent_descriptions" : descriptions})
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
        current_turn = game_state['current_turn']
        current_agent = game_state['agents'][current_turn]
        next_turn = (current_turn + 1) % len(game_state['agents']) 
        prev_turn = (current_turn + 3) % len(game_state['agents']) 
        next_agent = game_state['agents'][next_turn]
        prev_agent = game_state['agents'][prev_turn]
        is_ai = game_state['is_ai'][game_state['current_turn']]


        # questioning & answering 번갈아가면서 진행        
        resp_fn = question if game_state['phase'] == 'questioning' else answer
        target = next_agent if game_state['phase'] == 'questioning' else prev_agent
        if is_ai:
            ai_response = resp_fn(current_agent, target, game_state['chat_history'])
            game_state['chat_history'].append(f"{current_agent}: {ai_response}")
            message = ai_response
        else:
            game_state['chat_history'].append(f"{current_agent}: {user_message}")
            message = user_message            

        print(f"turn {game_state['current_turn']} : {message}")

        # answering까지 마쳤으면 다음 턴으로 이동
        # 그렇지 않으면 turn은 그대로 두고 phase만 변경. question -> answer
        if game_state['phase'] == "questioning":
            game_state['finished_questioning'][current_turn] = True
            game_state['current_turn'] = next_turn
        if game_state['phase'] == "answering":
            game_state['finished_answering'][current_turn] = True
        game_state['phase'] = "questioning" if game_state['phase'] == 'answering' else "answering"
            
        # 모든 에이전트가 질문과 답변을 마치면 투표 단계로 전환
        if all(game_state['finished_answering']) and all(game_state['finished_questioning']):
            game_state['phase'] = 'voting'

        return jsonify({
            "message" : message,
            "current_agent": current_agent,
            "turn" : game_state['current_turn'],
            "phase": game_state['phase'],
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/vote', methods=['POST'])
def do_vote():
    if game_state['phase'] != 'voting':
        return jsonify({"error": "Voting phase has not started yet"}), 400
    
    try:
        data = request.json
        user_message = data.get('user_message', None)
        current_turn = game_state['current_turn']
        current_agent = game_state['agents'][current_turn]
        is_ai = game_state['is_ai'][current_turn]
        
        if is_ai:
            vote_response = vote(current_agent, game_state['chat_history'])
        else:
            vote_response = user_message

        game_state['vote_history'].append(f"{current_agent}: {vote_response}")
        game_state['finished_voting'][current_turn] = True

        # 다음 에이전트로 이동
        game_state['current_turn'] = (current_turn + 1) % len(game_state['agents'])

        # 모든 에이전트가 투표를 마치면 게임 종료
        if all(game_state['finished_voting']):
            print("## came here")
            try:
                vote_result = get_vote_results(game_state['vote_history'], game_state['agents'])
                print(f"Vote result: {vote_result}")  # 로그 추가

                most_picked = vote_result.top_voter
                # names = vote_result.top_voter
                # names.sort(key = lambda x:-dict(zip(vote_result.names,vote_result.scores))[x])
                # most_picked = names[0]

                return jsonify({
                    "current_agent": current_agent,
                    "phase": "voting",
                    "vote_result": str(most_picked),  
                    "message": str(vote_response),
                    "turn": game_state['current_turn']
                })
            except Exception as e:
                print(f"Error in vote result processing: {str(e)}")  # 로그 추가
                return jsonify({"error": f"Error in vote result processing: {str(e)}"}), 500

        return jsonify({
            "message": vote_response,
            "current_agent": current_agent,
            "phase": "voting",
            "turn" : game_state['current_turn']
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/')
def home():
    return "Welcome to the Reverse Turing Test Game API"

if __name__ == '__main__':
    app.run(debug=True)
# 역사 인물 역 튜링 테스트 게임

이 프로젝트는 사용자와 AI 에이전트들이 참여하는 대화형 게임입니다. AI 에이전트들은 역사적 인물로 설정되며, 사용자는 이들과 대화를 나누며 누가 인간인지 추측하는 역 튜링 테스트를 진행합니다.

## 주요 기능

- 다수의 AI 에이전트와 1명의 사용자 참여
- 자동화된 AI 대화 시스템
- 질문 및 응답 단계
- 투표 시스템

## 기술 스택

- Backend: Flask (Python)
- Frontend: React
- AI: OpenAI GPT API

## 설치 및 실행 방법

1. 저장소 클론
```
git clone [repository_url]
cd reverse-turing-test-game
```

2. 백엔드 설정
```
cd backend
pip install -r requirements.txt
```

3. 프론트엔드 설정
```
cd frontend
npm install
```

4. OpenAI API 키 설정
`backend/keys/openai_api_key` 파일에 API 키를 입력하세요.

5. 백엔드 서버 실행
```
cd backend
python app.py
```

6. 프론트엔드 실행
```
cd frontend
npm start
```

7. 브라우저에서 `http://localhost:3000`으로 접속하여 게임 시작

## 게임 규칙

1. 게임 시작 시 3명의 AI 에이전트(역사적 인물)와 1명의 사용자가 참여합니다.
2. 참가자들은 순서대로 질문을 하고 답변합니다.
3. 모든 질문이 끝나면 각 참가자는 누가 인간인지 투표합니다.
4. 투표 결과에 따라 게임의 승자가 결정됩니다.

## 기여 방법

프로젝트에 기여하고 싶으시다면, 이슈를 열거나 풀 리퀘스트를 보내주세요. 모든 기여를 환영합니다!

## 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.
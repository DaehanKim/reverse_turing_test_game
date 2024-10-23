# Reverse Turing Test Game

This project is an interactive game where users engage in conversations with AI agents posing as historical figures. The goal is for players to identify which participant is human, effectively conducting a reverse Turing Test.

## Features

- Multiple AI agents and one human user
- Automated conversation system with AI agents
- Structured question-and-answer phases
- Voting system to guess the human
- **Optimized API usage:** The API token usage is optimized by utilizing `gpt-4o-mini` for most of the game, except during the voting result computation where higher precision is needed.

## Tech Stack

- **Backend:** Flask (Python)
- **Frontend:** React
- **AI:** OpenAI GPT API

## Setup Instructions

1. Clone the repository:
    ```bash
    git clone [repository_url]
    cd reverse-turing-test-game
    ```

2. Backend setup:
    ```bash
    cd backend
    pip install -r requirements.txt
    ```

3. Frontend setup:
    ```bash
    cd frontend
    npm install
    ```

4. Set OpenAI API key: Place your API key in the `backend/keys/openai_api_key` file.

5. Start the backend server:
    ```bash
    cd backend
    python app.py
    ```

6. Start the frontend:
    ```bash
    cd frontend
    npm start
    ```

7. Access the game via `http://localhost:3000`.

## Game Rules

1. The game starts with 3 AI agents (posing as historical figures) and 1 human player.
2. Players take turns asking and answering questions.
3. After all questions, participants vote on who they think is human.
4. The winner is determined by the voting results.

## Contributions

Feel free to open issues or submit pull requests if you'd like to contribute. Contributions are welcome!

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

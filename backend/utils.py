from openai import OpenAI
from typing import List 
from pydantic import BaseModel

# OpenAI API 키 로드
YOUR_API_KEY=open("keys/openai_api_key").read().strip()
MODEL = "gpt-4o-mini"
client = OpenAI(api_key=YOUR_API_KEY)

class Figure(BaseModel):
    name: List[str]
    # oneline_explaination: List[str]

def historical_figures(n=3):
    completion = client.beta.chat.completions.parse(
    model=MODEL,
    messages=[
        {"role": "user", "content": f"Generate {n} random historical figures before 1900."},
    ],
    response_format=Figure,
    )
    return completion.choices[0].message.parsed

def chat(figure_name, user_message, chat_history):
    print(chat_history)
    messages = [
        {"role": "system", "content": f"You are {figure_name}, a historical figure from the past. Respond as if you are that person but in korean language. Your task is to ask a question to the next person or answer the previous question."},
    ]
    for entry in chat_history:
        name, content = entry.split(": ", 1)
        role = "assistant" if name != "User" else "user"
        messages.append({"role": role, "content": content})
    
    messages.append({"role": "user", "content": user_message})
    
    completion = client.chat.completions.create(
        model=MODEL,
        messages=messages
    )
    return completion.choices[0].message.content

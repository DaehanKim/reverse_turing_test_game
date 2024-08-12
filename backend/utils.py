from openai import OpenAI
from typing import List 
from pydantic import BaseModel

# OpenAI API 키 로드
YOUR_API_KEY=open("keys/openai_api_key").read().strip()
MODEL = "gpt-4o-mini"
client = OpenAI(api_key=YOUR_API_KEY)

class Figure(BaseModel):
    name: List[str]

class VoteResult(BaseModel):
    most_picked: str
    stat : str
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

def get_vote_results(vote_history):
    completion = client.beta.chat.completions.parse(
    model=MODEL,
    messages=[
        {"role": "system", "content": f"Given vote logs, tell us who got most votes and also give how much each character got."},
        {"role": "user", "content": f"vote logs : {vote_history}"},
    ],
    response_format=VoteResult,
    )
    return completion.choices[0].message.parsed

def chat(figure_name, chat_history):
    # print(chat_history)
    messages = [
        {"role": "system", "content": f"You are {figure_name}, a historical figure from the past. Respond as if you are that person but in korean language. Your task is follow the instruction(especially previous system message) in chatting history.\
         Ask appropriate question or answer the question appropriately. Just say response, not your name in front."},
        {"role" : "user", "content" : f"Chat History : {chat_history}"}
    ]    
    
    completion = client.chat.completions.create(
        model=MODEL,
        messages=messages
    )
    return completion.choices[0].message.content

def vote(figure_name, chat_history):
    # print(chat_history)
    messages = [
        {"role": "system", "content": f"You are {figure_name}, a historical figure from the past. Respond as if you are that person but in korean language. \
         Your task is to pick one person that is most likely a human from the chat history. note that there are only one human participants in the list.\
         And also provide your rationale on for your decision."},
        {"role" : "user", "content" : f"Chat History : {chat_history}"}
    ]    
    
    completion = client.chat.completions.create(
        model=MODEL,
        messages=messages,
    )
    return completion.choices[0].message.content


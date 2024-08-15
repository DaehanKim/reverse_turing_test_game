from openai import OpenAI
from typing import List 
from pydantic import BaseModel
import numpy as np

# OpenAI API 키 로드
YOUR_API_KEY=open("keys/openai_api_key").read().strip()
MODEL = "gpt-4o-mini"
HINTS = ["humans are not knowledgable", "humans may make typos", "humans may ask irrelevant question", "humans may answer in an irrelevant way", "humans sometimes make too explicit or emotional comments"]
client = OpenAI(api_key=YOUR_API_KEY)

class Figure(BaseModel):
    name: List[str]

class VoteResult(BaseModel):
    most_picked: str
    stat : str
    # oneline_explaination: List[str]

def historical_figures(n=3, era=1000):
    completion = client.beta.chat.completions.parse(
    model=MODEL,
    messages=[
        {"role": "user", "content": f"Generate {n} random historical figures around year AD {era}. write their name as compact as possible."},
    ],
    response_format=Figure,
    )
    return completion.choices[0].message.parsed

def get_vote_results(vote_history):
    completion = client.beta.chat.completions.parse(
    model=MODEL,
    messages=[
        {"role": "system", "content": f"Given vote logs, tell us who got most votes and also give how much each character got."},
        {"role": "system", "content": f"vote logs : {vote_history}"},
    ],
    response_format=VoteResult,
    )
    return completion.choices[0].message.parsed

def question(figure_name, target, chat_history):
    # print(chat_history)
    messages = [
        {"role": "system", "content": f"You are {figure_name}, a historical figure from the past. Your task is to ask question about another historical figure, {target}, in korean language.\
         Ask a good question that can only be answered by {target}. You need to make sure you stick to your personality when questioning. Just say direct, not your name in front.\
        start with something like, 'I'll ask my question to {target}'. Say only their name in english. "},
        {"role" : "system", "content" : "your response should not exceed 3 sentences. Make it compact."},
        {"role" : "system", "content" : f"Chat History : {chat_history}"}
    ]
    
    completion = client.chat.completions.create(
        model=MODEL,
        messages=messages
    )
    return completion.choices[0].message.content

def answer(figure_name, target, chat_history):
    # print(chat_history)
    messages = [
        {"role": "system", "content": f"You are {figure_name}, a historical figure from the past. Your task is to answer the question you got from another historical figure, {target}, in korean language.\
         You need to make sure you stick to your personality when answering. Just say direct, not your name in front."},
        {"role" : "system", "content" : "your response should not exceed 3 sentences. Make it compact."},
        {"role" : "system", "content" : f"Chat History : {chat_history}"}
    ]    
    
    completion = client.chat.completions.create(
        model=MODEL,
        messages=messages
    )
    return completion.choices[0].message.content

def vote(figure_name, chat_history):
    # print(chat_history)
    picked_hint = np.random.choice(HINTS, size=2, replace=False)
    hint = [{"role" : "system", "content" : f"HINT : {hint}"} for hint in picked_hint]
    messages = [
        {"role": "system", "content": f"You are {figure_name}, a historical figure from the past. You were playing a game where you need to find a human player \
         in this role playing chats.\
         You need to find a actual human player from the chat history. \
         Provide your rationale on for your decision. YOU SHOULD NOT VOTE YOURSELF.\
         you start with something like 'I suspect [name] is human being in disguise'\
         Always answer in korean."},
        {"role" : "system", "content" : "your response SHOULD NOT exceed 3 sentences. Make it compact."},
        *hint,
        {"role" : "system", "content" : f"Chat History : {chat_history}"}
    ]

    
    completion = client.chat.completions.create(
        model=MODEL,
        messages=messages,
    )
    return completion.choices[0].message.content

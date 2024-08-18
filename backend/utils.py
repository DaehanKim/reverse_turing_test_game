from openai import OpenAI
from typing import List 
from pydantic import BaseModel
import numpy as np

# OpenAI API 키 로드
YOUR_API_KEY=open("keys/openai_api_key").read().strip()
MODEL = "gpt-4o-mini"
HINTS = ["if someone is wrong in historical knowledge, suspect him to be human.", 
         "if someone makes typos, suspect him to be human.", 
         "if someone asks irrelevant questions, suspect him to be human.", 
         "if someone answers in an irrelevant way, suspect him to be human.", 
         "if someone makes explicit or rude comments, suspect him to be human.", 
         "if someone writes loose free-form answer rather than logics and structures, suspect him to be human.",
         "If someone is not responding, that's definitely human. cuz' no AI doing that."]
client = OpenAI(api_key=YOUR_API_KEY)

class Figure(BaseModel):
    name: List[str]
    descriptions : List[str]

class VoteResult(BaseModel):
    top_voter : str
    why : str
    # oneline_explaination: List[str]

def historical_figures(n=3, era=1000):
    completion = client.beta.chat.completions.parse(
    model=MODEL,
    messages=[
        {"role": "user", "content": f"Generate {n} random historical figures around year AD {era}. \
         write their name as compact as possible. and write their one-liner description in korean language."},
    ],
    response_format=Figure,
    )
    return completion.choices[0].message.parsed

def get_vote_results(vote_history, candidates):
    completion = client.beta.chat.completions.parse(
    model="gpt-4o-2024-08-06",
    messages=[
        {"role": "system", "content": f"Given vote conversation, provide who got most votes. if there are multiple top voters, pick more suspicious one by your judgement. think step-by-step and briefly and provide why in Korean."},
        {"role": "system", "content": f"conversations : {vote_history}"},
    ],
    response_format=VoteResult,
    )
    return completion.choices[0].message.parsed

def question(figure_name, target, chat_history):
    # print(chat_history)
    messages = [
        {"role": "system", "content": f"You are {figure_name}, a historical figure from the past. Your task is to ask question about another historical figure, {target}, in korean language.\
         Ask a good question that can only be answered by {target}. You need to make sure you stick to your personality when questioning. Just say direct, not your name in front.\
        start with something like, '{target}에게 묻겠습니다.'. You can write their name in english. "},
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
        {"role": "system", "content": f"You are {figure_name}, a historical figure from the past. Your task is to answer the question you got from your target, {target}, in korean language.\
         You need to make sure you stick to your personality when answering. \
         start by calling name of target, {target} \
        if there is was no response from your target, you need to respond accordingly.\
        at the end of response, write your judgement on question you got from {target}, like 'that was a good question.' or 'that's off-topic' or whatever impression you got." },
        {"role" : "system", "content" : "your response should not exceed 3 sentences. Make it compact."},
        {"role" : "system", "content" : f"Chat History : {chat_history}"}
    ]    
    
    completion = client.chat.completions.create(
        model=MODEL,
        messages=messages
    )
    return completion.choices[0].message.content

def vote(figure_name, chat_history):
    picked_hint = np.random.choice(HINTS, size=4, replace=False)
    hint = [{"role" : "system", "content" : f"HINT : {hint}"} for hint in picked_hint]
    
    messages = [
        {"role": "system", "content": f"You are {figure_name}, a historical figure participating in a role-playing game. All participants except one are AI, and your task is to identify the human player based on the chat history.\
         Your response should start with a phrase like 'xx 가 인간 같습니다.' or '제 생각엔 xx가 수상합니다.'\
         Provide a brief rationale for your choice. Do not vote for yourself. Respond concisely in Korean."},
        *hint,
        {"role" : "system", "content" : "Your response should be no more than 3 sentences and very concise."},
        {"role" : "system", "content" : f"Chat History: {chat_history}"}
    ]
    
    completion = client.chat.completions.create(
        model=MODEL,
        messages=messages,
    )
    return completion.choices[0].message.content

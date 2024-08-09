from openai import OpenAI
from pydantic import BaseModel
from typing import List

YOUR_API_KEY=open("keys/openai_api_key").read().strip()
client = OpenAI(api_key=YOUR_API_KEY)

class Figure(BaseModel):
    name: List[str]
    # oneline_explaination: List[str]

def historical_figures(n=3):
    completion = client.beta.chat.completions.parse(
    model="gpt-4o-2024-08-06",
    messages=[
        {"role": "user", "content": f"Generate {n} random historical figures before 1900."},
    ],
    response_format=Figure,
    )
    return completion.choices[0].message.parsed




# setup agents with those identity
names = historical_figures.name



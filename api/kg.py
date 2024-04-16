from strictjson import *
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv(override=True)
api_key = os.getenv("OPENAI_API_KEY")
os.environ["OPENAI_API_KEY"] = api_key

def chat(system_prompt, user_prompt = '', model = 'gpt-4', temperature = 0, **kwargs):
    ''' This replies the user based on a system prompt and user prompt to call OpenAI Chat Completions API '''
    client = OpenAI()
    response = client.chat.completions.create(
        model=model,
        temperature = temperature,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        **kwargs
    )
    res = response.choices[0].message.content
    return res

def createKG(context):
    ''' This creates a knowledge graph based on the context '''
    res = strict_json(system_prompt = '''You are a knowledge graph builder. 
    You are to output relations between two objects in the form (object_1, relation, object_2). 
    All information about dates must be included.
    Example Input: John bought a laptop
    Example Output: [('John', 'bought', 'laptop')]
    Example Input: John built a house in 2019
    Example Output: [('John', 'built', 'house'), ('house', 'built in', '2019')]''',
                user_prompt = context,
                output_format = {"List of triplets": "List of triplets of the form (object_1, relation, object_2), type: list"})
    kg = res['List of triplets']
    return kg

def query(question, kg):
    # Parse the knowledge graph
    res = strict_json(system_prompt = f'''You are a knowledge graph parser. 
    Only output the triplets that are relevant to the question.
    Knowledge Graph: {kg}''',
                        user_prompt = f'''Question: {question}''',
                        output_format = {"Parsed Knowledge Graph": "List of triplets of the form (object1, relation, object2), type: list"})
    parsed_kg = res['Parsed Knowledge Graph']

    # Use the parsed knowledge graph to answer the question
    res = strict_json(system_prompt = f'''Use the knowledge graph to answer the following question. 
    If you are unsure, output 'No Info'
    Knowledge Graph: {parsed_kg}''',
                        user_prompt = f'''Question: {question}''',
                        output_format = {"Answer": "Answer question using knowledge graph"})
    
    return res['Answer']
from strictjson import *
import os
from openai import OpenAI
from dotenv import load_dotenv
import re
import nltk
from nltk.stem import WordNetLemmatizer
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


load_dotenv(override=True)
api_key = os.getenv("OPENAI_API_KEY")
os.environ["OPENAI_API_KEY"] = api_key
nltk.download('wordnet')
nltk.download('stopwords')
stop_words = set(stopwords.words('english'))

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

def coref(context):
    ''' This resolves coreferences in a given context '''
    res = strict_json(system_prompt = '''You are a coreference resolver. 
    You are to resolve corefences in the text and replace any references with the actual subject.
    Example Input: I have a dog. He likes playing fetch.
    Example Output: I have a dog. My dog likes playing fetch.
    Example Input: John bought a new phone for Sandy. It was gift for her.
    Example Output: John bought a new phone for Sandy. The new phone was a gift for Sandy.
    Example Input: Whenever I vist her, my grandma always gives me cookies. She is so sweet.
    Example Output: Whenever I vist my grandma, my grandma always gives me cookies. My grandma is so sweet.''',
                user_prompt = context,
                output_format = {"Resolved Coreferences": "Resolved coreferences, type: string"})
    return res['Resolved Coreferences']

def createKG(context):
    ''' This creates a knowledge graph based on the context '''
    res = strict_json(system_prompt = '''You are a knowledge graph builder. 
    You are to output relations between two objects in the form (object_1, relation, object_2).
    All outputs must be of size 3.
    All information about dates must be included.
    Example Input: John bought a laptop
    Example Output: [('John', 'bought', 'laptop')]
    Example Input: John built a house in 2019
    Example Output: [('John', 'built', 'house'), ('house', 'built in', '2019')]''',
                user_prompt = context,
                output_format = {"List of triplets": "List of triplets of the form (object_1, relation, object_2), type: list"})
    kg = res['List of triplets']
    # filter out triplets that are not of length 3
    kg = [triplet for triplet in kg if len(triplet) == 3]
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

def cosine_query(question, kg):
    triplets = get_triplets_above_threshold(question, kg)

    print(triplets)

    res = strict_json(system_prompt = f'''Use the knowledge graph to answer the following question. 
    If you are unsure, output 'No Info'
    Knowledge Graph: {triplets}''',
                        user_prompt = f'''Question: {question}''',
                        output_format = {"Answer": "Answer question using knowledge graph"})
    
    return res['Answer']

def normalize_text(text):
    text = re.sub(r'[^\S\n]+', ' ', text)
    text = text.strip()
    return text

def lemmatize_text(text):
    lemmatizer = WordNetLemmatizer()
    words = text.split()
    lemmatized_words = [lemmatizer.lemmatize(word) for word in words]
    return ' '.join(lemmatized_words)

def remove_stop_words(text):
    words = text.split()
    filtered_words = [word for word in words if word not in stop_words]
    return ' '.join(filtered_words)

def process_cosine(context):
    processed_text = normalize_text(context)
    processed_text = lemmatize_text(processed_text)
    processed_text = remove_stop_words(processed_text)
    return processed_text

vectorizer = TfidfVectorizer()
def vectorize_kg(kg):
    triplets_text = ["{} {} {}".format(src, rel, trg) for src, rel, trg in kg]
    
    tfidf_matrix = vectorizer.fit_transform(triplets_text)
    return tfidf_matrix

def get_cosine_similarity(query, tfidf_matrix):
    query_vector = vectorizer.transform([query])
    similarity_scores = cosine_similarity(query_vector, tfidf_matrix)[0]
    print(similarity_scores)
    return similarity_scores

def get_triplets_above_threshold(query, kg, threshold=0.2):
    vectorized = vectorize_kg(kg)
    similarity_scores = get_cosine_similarity(query, vectorized)
    relevant_indices = np.where(similarity_scores > threshold)[0]
    relevant_triplets = [kg[i] for i in relevant_indices]
    return relevant_triplets


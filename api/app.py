from flask import Flask, request, jsonify
from flask_cors import CORS
import kg

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

context = ""
kgraph = ""

@app.route('/api/setcontext', methods=['POST'])
def set_context():
    ''' This sets the context for the knowledge graph '''
    global context, kgraph
    success = True
    context = request.json['context']
    # coref = kg.coref(context)
    processed = kg.process_cosine(context)
    kgraph = kg.createKG(processed)
    print(kgraph)
    if type(kgraph) != list:
        success = False
    return jsonify({'success': success, 'kg': kgraph}), 200

@app.route('/api/query', methods=['POST'])
def handle_query():
    ''' This handles the query '''
    global context, kgraph
    question = request.json['question']
    if context == "" or kgraph == "":
        return jsonify({'success': False, 'error': 'Context not set'}), 400
    res = kg.cosine_query(question, kgraph)
    print(res)
    return jsonify({'success': True, 'answer': res}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
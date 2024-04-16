import { useState, useEffect } from 'react';
import './Chat.css';

export default function Chat() {
    const [message, setMessage] = useState('');
    const [history, setHistory] = useState([]);

    const handleInputChange = (event) => {
        setMessage(event.target.value);
    };

    async function handleSubmit(event) {
        event.preventDefault();
        if (message.trim()) {
            setHistory([...history, { text: message, sender: 'user' }]);
            setMessage('');
        }
    }

    useEffect(() => {
        // check if last item in history was sent by user
        if (history.length && history[history.length - 1].sender === 'user') {
            // send message to server
            fetch('http://localhost:5000/api/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: history[history.length - 1].text }),
            })
                .then((res) => {
                    if (res.ok) {
                        return res.json();
                    }
                    throw new Error('Failed to send message');
                })
                .then((data) => {
                    setHistory([...history, { text: data.answer, sender: 'bot' }]);
                })
                .catch((error) => {
                    console.error('Failed to send message', error);
                });
        }
    }, [history])

    return (
        <div className="chat-container">
            <div className="chat-history">
                {history.map((msg, index) => (
                    <div key={index} className={`message ${msg.sender}`}>
                        <span>{msg.text}</span>
                    </div>
                ))}
            </div>
            <form className="chat-form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={message}
                    onChange={handleInputChange}
                    placeholder="Type your message here..."
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
}
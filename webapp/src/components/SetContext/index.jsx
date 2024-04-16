import { useState } from 'react';
import './SetContext.css';

export default function SetContext({ context, setContext }) {
    const [isOpen, setIsOpen] = useState(false);
    const [working, setWorking] = useState(false);
    const [closing, setClosing] = useState(false);

    function handleClose() {
        setClosing(true);
        setTimeout(() => {
            setIsOpen(false);
            setClosing(false);
        }, 300);
    }

    async function handleSubmit() {
        setWorking(true);
    
        // Send context to the server
        let res = await fetch('http://localhost:5000/api/setcontext', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ context: context }),
        }).then((res) => {
            if (res.ok) {
                return res.json();
            }
            throw new Error('Failed to set context');
        }).catch((error) => {
            alert("Failed to set context", error.message)
        });

        if (res) {
            if (res['success']) {
                console.log('Successfully set context:', context);
              } else {
                alert(res['error'])
              }
        }

        setWorking(false);
        handleClose();
    }

    

    return (
        <>
        <button className="context-submit" onClick={() => setIsOpen(true)}>Set Context</button>
        {isOpen == true && 
        <div className={`context-container ${closing ? 'closing' : ''}`}>
            <div className={`context-overlay ${closing ? 'closing' : ''}`}>
                <div className="header-container">
                    <h2 className="context-header">Set Context</h2>
                    <button className="context-close" onClick={handleClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <textarea
                    className="context-textarea"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                />
                <button disabled={working} className="context-submit" onClick={handleSubmit}>{working ? "Working..." : "Submit"}</button>
            </div>
        </div>
        }
        </>
    )
}
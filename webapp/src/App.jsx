import './App.css';
import { useState } from 'react';
import SetContext from './components/SetContext';
import Chat from './components/Chat';

function App() {
  const [context, setContext] = useState("");

  return (
    <div className="App">
      <SetContext 
        context={context}
        setContext={setContext}
      />
      <Chat />
    </div>
  );
}

export default App;

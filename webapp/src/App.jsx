import './App.css';
import { useState } from 'react';
import SetContext from './components/SetContext';
import Chat from './components/Chat';
import KG from './components/KG';

function App() {
  const [context, setContext] = useState("");
  const [kg, setKG] = useState("");

  return (
    <div className="App">
      <SetContext 
        context={context}
        setContext={setContext}
        setKG={setKG}
      />
      <KG 
        kg={kg}
      />
      <Chat />
    </div>
  );
}

export default App;

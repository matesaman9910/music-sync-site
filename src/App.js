import React, { useEffect, useState } from 'react';
import { db, auth, provider } from './firebase';
import { ref, onValue, set } from 'firebase/database';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import ReactPlayer from 'react-player';

function App() {
  const [user, setUser] = useState(null);
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [url, setUrl] = useState('');

  useEffect(() => {
    onAuthStateChanged(auth, setUser);

    const queueRef = ref(db, '/queue');
    onValue(queueRef, snapshot => {
      const data = snapshot.val() || [];
      setQueue(data);
      setCurrent(data[0] || null);
    });
  }, []);

  const addSong = () => {
    const newQueue = [...queue, url];
    set(ref(db, '/queue'), newQueue);
    setUrl('');
  };

  const nextSong = () => {
    const newQueue = queue.slice(1);
    set(ref(db, '/queue'), newQueue);
  };

  const login = () => signInWithPopup(auth, provider);

  return (
    <div style={{ backgroundColor: '#000', color: '#0f0', minHeight: '100vh', padding: '20px', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>🎵 Music Room</h1>
        {!user ? <button onClick={login}>Admin Login</button> : <span>Hello, {user.displayName}</span>}
      </div>

      <div style={{ marginTop: '30px' }}>
        {current ? (
          <ReactPlayer url={current} playing controls width="100%" height="60px" onEnded={nextSong} />
        ) : (
          <p>No music in the queue.</p>
        )}
      </div>

      {user && (
        <div style={{ marginTop: '40px' }}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube or Spotify link"
            style={{ width: '60%', padding: '10px', marginRight: '10px' }}
          />
          <button onClick={addSong}>Add to Queue</button>

          <h2 style={{ marginTop: '20px' }}>Queue:</h2>
          <ul>
            {queue.map((song, idx) => (
              <li key={idx} style={{ fontWeight: idx === 0 ? 'bold' : 'normal' }}>{song}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;

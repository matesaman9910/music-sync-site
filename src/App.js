import React, { useEffect, useState } from 'react';
import { db, auth, provider, allowedAdmins } from './firebase';
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

  const login = () => {
    signInWithPopup(auth, provider).then((result) => {
      const email = result.user.email;
      if (!allowedAdmins.includes(email)) {
        alert("You are not an authorized admin.");
        return;
      }
      setUser(result.user);
    });
  };

  return (
    <div style={{
      backgroundColor: 'black',
      color: '#00ff66',
      fontFamily: 'monospace',
      padding: '20px',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <header style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{ color: '#00ff66' }}>🎵 Music Room</h1>
        {!user ? (
          <button onClick={login} style={{
            background: 'none',
            border: '1px solid #00ff66',
            color: '#00ff66',
            padding: '5px 10px',
            cursor: 'pointer'
          }}>Admin Login</button>
        ) : (
          <span>Hello, {user.displayName}</span>
        )}
      </header>

      <div style={{ width: '90%', maxWidth: '800px' }}>
        {current ? (
          <ReactPlayer
            url={current}
            playing
            controls
            width="100%"
            height="360px"
            onEnded={nextSong}
            style={{ border: '2px solid #00ff66', borderRadius: '5px' }}
          />
        ) : (
          <p>No music in the queue.</p>
        )}
      </div>

      {user && (
        <div style={{ marginTop: '40px', width: '90%', maxWidth: '800px', textAlign: 'center' }}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube or Spotify link"
            style={{
              width: '70%',
              padding: '10px',
              backgroundColor: 'black',
              border: '1px solid #00ff66',
              color: '#00ff66',
              fontFamily: 'monospace'
            }}
          />
          <button onClick={addSong} style={{
            marginLeft: '10px',
            padding: '10px',
            background: 'none',
            border: '1px solid #00ff66',
            color: '#00ff66',
            cursor: 'pointer'
          }}>Add to Queue</button>

          <h2 style={{ marginTop: '30px' }}>🎧 Queue:</h2>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {queue.map((song, idx) => (
              <li key={idx} style={{
                color: idx === 0 ? '#fff' : '#00ff66',
                fontWeight: idx === 0 ? 'bold' : 'normal',
                wordWrap: 'break-word',
                marginBottom: '10px'
              }}>
                {song}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;

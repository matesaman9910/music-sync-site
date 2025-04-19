import React, { useEffect, useState, useRef } from 'react';
import { db, auth, provider, allowedAdmins } from './firebase';
import { ref, onValue, set, update } from 'firebase/database';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import ReactPlayer from 'react-player';

function App() {
  const [user, setUser] = useState(null);
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [url, setUrl] = useState('');
  const [seeked, setSeeked] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerLoaded, setPlayerLoaded] = useState(false);

  const playerRef = useRef(null);

  useEffect(() => {
    onAuthStateChanged(auth, setUser);

    const queueRef = ref(db, '/queue');
    const startTimeRef = ref(db, '/startTime');

    onValue(queueRef, (snapshot) => {
      const data = snapshot.val() || [];
      setQueue(data);
      setCurrent(data[0] || null);
    });

    onValue(startTimeRef, (snapshot) => {
      const time = snapshot.val();
      if (time) setStartTime(time);
    });
  }, []);

  useEffect(() => {
    if (playerReady && playerLoaded && current && startTime && playerRef.current) {
      const secondsElapsed = Math.floor((Date.now() - startTime) / 1000);
      playerRef.current.seekTo(secondsElapsed, 'seconds');
      setSeeked(true);
    }
  }, [playerReady, playerLoaded]);

  const addSong = () => {
    if (!url.trim()) return;
    const newQueue = [...queue, {
      url,
      addedBy: user?.displayName || 'Anonymous'
    }];
    set(ref(db, '/queue'), newQueue);
    if (queue.length === 0) {
      set(ref(db, '/startTime'), Date.now());
    }
    setUrl('');
  };

  const nextSong = () => {
    const newQueue = queue.slice(1);
    update(ref(db), {
      queue: newQueue,
      startTime: Date.now()
    });
    setSeeked(false);
    setPlayerReady(false);
    setPlayerLoaded(false);
  };

  const deleteSong = (index) => {
    const newQueue = queue.filter((_, i) => i !== index);
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

  const logout = () => {
    auth.signOut().then(() => setUser(null));
  };

  return (
    <div style={{
      backgroundColor: '#000',
      color: '#00ff66',
      fontFamily: '"Share Tech Mono", monospace',
      padding: '30px',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textShadow: '0 0 4px #00ff66',
    }}>
      <header style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{ color: '#00ff66' }}>🎵 Music Player Sync Live</h1>
        {!user ? (
          <button onClick={login} style={{
            backgroundColor: '#000',
            border: '2px solid #00ff66',
            color: '#00ff66',
            padding: '6px 12px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            textShadow: '0 0 2px #00ff66',
          }}>Admin Login</button>
        ) : (
          <div style={{ textAlign: 'right' }}>
            <div>{user.displayName} ({user.email})</div>
            <button
              onClick={logout}
              style={{
                marginTop: '5px',
                backgroundColor: '#000',
                border: '2px solid #00ff66',
                color: '#00ff66',
                padding: '4px 8px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textShadow: '0 0 2px #00ff66'
              }}
            >
              ⏻ Log Out
            </button>
          </div>
        )}
      </header>

      <div style={{ width: '100%', maxWidth: '900px', marginBottom: '30px' }}>
        {!playerReady && current && (
          <button onClick={() => setPlayerReady(true)} style={{
            padding: '12px 24px',
            fontSize: '18px',
            fontFamily: 'inherit',
            backgroundColor: '#000',
            color: '#00ff66',
            border: '2px solid #00ff66',
            textShadow: '0 0 3px #00ff66',
            cursor: 'pointer'
          }}>
            ▶ Click to Join Stream
          </button>
        )}

        {current && playerReady && (
          <ReactPlayer
            ref={playerRef}
            url={current.url}
            playing
            controls
            onReady={() => setPlayerLoaded(true)}
            width="100%"
            height="360px"
            onEnded={nextSong}
            style={{ border: '2px solid #00ff66', borderRadius: '6px' }}
          />
        )}
      </div>

      {user && (
        <div style={{ marginTop: '20px', width: '100%', maxWidth: '900px', textAlign: 'center' }}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube or Spotify link"
            style={{
              width: '65%',
              padding: '10px',
              backgroundColor: '#000',
              border: '2px solid #00ff66',
              color: '#00ff66',
              fontFamily: 'inherit',
              textShadow: '0 0 2px #00ff66',
            }}
          />
          <button onClick={addSong} style={{
            marginLeft: '10px',
            padding: '10px 15px',
            backgroundColor: '#000',
            border: '2px solid #00ff66',
            color: '#00ff66',
            fontFamily: 'inherit',
            cursor: 'pointer',
            textShadow: '0 0 2px #00ff66',
          }}>
            ▶ Add to Queue
          </button>

          <h2 style={{ marginTop: '30px' }}>🎧 Queue:</h2>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {Array.isArray(queue) && queue.map((song, idx) => (
              <li key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: idx === 0 ? '#ffffff' : '#00ff66',
                fontWeight: idx === 0 ? 'bold' : 'normal',
                wordWrap: 'break-word',
                marginBottom: '10px',
                textShadow: idx === 0 ? '0 0 4px #fff' : '0 0 2px #00ff66',
              }}>
                <span style={{ flexGrow: 1, textAlign: 'left' }}>
                  <a href={song.url} target="_blank" rel="noopener noreferrer" style={{ color: '#00ff66' }}>
                    {song.url}
                  </a>
                  <span style={{ fontSize: '0.9em', marginLeft: '10px', fontStyle: 'italic' }}>
                    – added by {song.addedBy || 'Anonymous'}
                  </span>
                </span>
                <button onClick={() => deleteSong(idx)} style={{
                  marginLeft: '10px',
                  backgroundColor: '#000',
                  border: '1px solid #00ff66',
                  color: '#00ff66',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  textShadow: '0 0 2px #00ff66'
                }}>
                  🗑️
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;

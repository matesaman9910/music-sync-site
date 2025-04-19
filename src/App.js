// ✅ VERSION 1 — BASIC YOUTUBE SYNC + CLEAN CRT STYLE
import React, { useEffect, useState, useRef } from 'react';
import { db, auth, provider, allowedAdmins } from './firebase';
import { ref, onValue, set, update, onDisconnect } from 'firebase/database';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import ReactPlayer from 'react-player';

function App() {
  const [user, setUser] = useState(null);
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [url, setUrl] = useState('');
  const [playerReady, setPlayerReady] = useState(false);
  const [playerLoaded, setPlayerLoaded] = useState(false);

  const playerRef = useRef(null);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u || null));
    onValue(ref(db, '/queue'), (snap) => setQueue(snap.val() || []));
    onValue(ref(db, '/startTime'), (snap) => setStartTime(snap.val()));
  }, []);

  useEffect(() => {
    setCurrent(queue[0] || null);
  }, [queue]);

  useEffect(() => {
    if (playerReady && playerLoaded && current && startTime) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      playerRef.current?.seekTo(elapsed, 'seconds');
    }
  }, [playerReady, playerLoaded]);

  const isValidUrl = (link) => {
    try {
      const { hostname } = new URL(link);
      return hostname === 'youtube.com' || hostname === 'www.youtube.com' || hostname === 'youtu.be';
    } catch {
      return false; // Invalid URL
    }
  };

  const addSong = () => {
    if (!isValidUrl(url)) return alert("❌ Only YouTube links allowed.");
    const newEntry = { url, addedBy: user?.displayName || 'Unknown' };
    const newQueue = [...queue, newEntry];
    set(ref(db, '/queue'), newQueue);
    if (queue.length === 0) set(ref(db, '/startTime'), Date.now());
    setUrl('');
  };

  const nextSong = () => {
    const newQueue = queue.slice(1);
    update(ref(db), { queue: newQueue, startTime: Date.now() });
    setPlayerReady(false);
    setPlayerLoaded(false);
  };

  const login = () => {
    signInWithPopup(auth, provider).then(({ user }) => {
      if (!allowedAdmins.includes(user.email)) return alert('Unauthorized');
    });
  };

  const logout = () => auth.signOut().then(() => setUser(null));

  return (
    <div style={{ backgroundColor: 'black', color: '#00ff66', fontFamily: 'monospace', padding: 20 }}>
      <h1>🎵 Music Player Sync Live</h1>

      {!user ? (
        <button onClick={login}>Login with Google</button>
      ) : (
        <>
          <p>{user.displayName} <button onClick={logout}>Logout</button></p>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste YouTube link" style={{ width: '60%' }} />
          <button onClick={addSong}>Add to Queue</button>
        </>
      )}

      <h2>🎬 Now Playing</h2>
      {!playerReady && current && <button onClick={() => setPlayerReady(true)}>▶ Join Stream</button>}

      {current && playerReady && (
        <ReactPlayer
          ref={playerRef}
          url={current.url}
          playing
          controls
          onReady={() => setPlayerLoaded(true)}
          onEnded={nextSong}
          width="100%"
        />
      )}

      <h2>🎶 Queue</h2>
      <ul>
        {queue.map((song, index) => (
          <li key={index}>
            <a href={song.url} target="_blank" rel="noreferrer">{song.url}</a>
            <em> — added by {song.addedBy}</em>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;

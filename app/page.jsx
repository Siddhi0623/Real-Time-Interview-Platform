"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const initialMessages = [
  {
    author: "Mira",
    role: "Interviewer",
    text: "Welcome in. Start with the brute-force approach, then we will tune it.",
  },
  {
    author: "Arjun",
    role: "Candidate",
    text: "Sounds good. I am checking edge cases before coding.",
  },
];

const seedCode = `function longestUniqueSubstring(input) {
  const seen = new Map();
  let left = 0;
  let best = 0;

  for (let right = 0; right < input.length; right += 1) {
    const char = input[right];

    if (seen.has(char) && seen.get(char) >= left) {
      left = seen.get(char) + 1;
    }

    seen.set(char, right);
    best = Math.max(best, right - left + 1);
  }

  return best;
}`;

const candidates = [
  {
    name: "Arjun Mehta",
    role: "Frontend Engineer",
    status: "Coding",
    score: 82,
    signal: "Strong problem decomposition",
  },
  {
    name: "Leah Stone",
    role: "Backend Engineer",
    status: "Queued",
    score: 74,
    signal: "Needs follow-up on edge cases",
  },
  {
    name: "Noah Chen",
    role: "Full Stack Engineer",
    status: "Review",
    score: 91,
    signal: "Clean implementation and testing",
  },
];

export default function Home() {
  const [room, setRoom] = useState("INT-4827");
  const [name, setName] = useState("Alex Carter");
  const [role, setRole] = useState("Candidate");
  const [isJoined, setIsJoined] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [code, setCode] = useState(seedCode);
  const [language, setLanguage] = useState("JavaScript");
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [callNotice, setCallNotice] = useState("Join the room to enable media controls.");
  const videoRef = useRef(null);
  const screenRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const progress = useMemo(() => {
    const filledLines = code.split("\n").filter((line) => line.trim()).length;
    return Math.min(96, 38 + filledLines * 4);
  }, [code]);

  useEffect(() => {
    if (isJoined && cameraOn && videoRef.current && localStreamRef.current) {
      videoRef.current.srcObject = localStreamRef.current;
    }
  }, [isJoined, cameraOn]);

  useEffect(() => {
    if (isSharing && screenRef.current && screenStreamRef.current) {
      screenRef.current.srcObject = screenStreamRef.current;
    }
  }, [isSharing]);

  const joinRoom = async (event) => {
    event.preventDefault();
    setIsJoined(true);
    setCallNotice("Room joined. Camera and microphone are ready.");

    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        localStreamRef.current = stream;
        setCameraOn(true);
        setMicOn(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setCameraOn(false);
        setMicOn(false);
        setCallNotice("Camera or microphone permission was blocked by the browser.");
      }
    }
  };

  const toggleAudio = () => {
    if (!isJoined) {
      setCallNotice("Join the room before using audio.");
      return;
    }

    const nextState = !micOn;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = nextState;
    });
    setMicOn(nextState);
    setCallNotice(nextState ? "Microphone is on." : "Microphone is muted.");
  };

  const toggleVideo = () => {
    if (!isJoined) {
      setCallNotice("Join the room before using video.");
      return;
    }

    const nextState = !cameraOn;
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = nextState;
    });
    setCameraOn(nextState);
    setCallNotice(nextState ? "Camera is on." : "Camera is paused.");
  };

  const stopScreenShare = () => {
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;

    if (screenRef.current) {
      screenRef.current.srcObject = null;
    }

    setIsSharing(false);
    setCallNotice("Screen sharing stopped.");
  };

  const shareScreen = async () => {
    if (!isJoined) {
      setCallNotice("Join the room before sharing your screen.");
      return;
    }

    if (isSharing) {
      stopScreenShare();
      return;
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
      setCallNotice("Screen sharing is not available in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      screenStreamRef.current = stream;
      setIsSharing(true);
      setCallNotice("Screen sharing is live.");
      stream.getVideoTracks()[0]?.addEventListener("ended", stopScreenShare);
    } catch {
      setCallNotice("Screen sharing was cancelled.");
    }
  };

  const leaveRoom = () => {
    if (!isJoined) {
      setCallNotice("Join the room before leaving.");
      return;
    }

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    screenStreamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (screenRef.current) {
      screenRef.current.srcObject = null;
    }

    setIsJoined(false);
    setIsSharing(false);
    setMicOn(false);
    setCameraOn(false);
    setCallNotice("You left the room.");
  };

  const sendMessage = (event) => {
    event.preventDefault();

    if (!draft.trim()) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        author: name || "Guest",
        role,
        text: draft.trim(),
      },
    ]);
    setDraft("");
  };

  return (
    <main className="platform-shell">
      <section className="workspace" aria-label="Real-time interview room">
        <header className="topbar">
          <a className="brand" href="#room" aria-label="SignalRoom home">
            <span className="brand__mark">SR</span>
            <span>SignalRoom</span>
          </a>
          <nav className="topbar__nav" aria-label="Platform sections">
            <a href="#room">Room</a>
            <a href="#code">Editor</a>
            <a href="#chat">Chat</a>
            <a href="#dashboard">Dashboard</a>
          </nav>
          <div className="live-pill">
            <span />
            {isJoined ? "Live interview" : "Ready room"}
          </div>
        </header>

        <div className="room-grid" id="room">
          <aside className="join-panel" aria-label="Join interview room">
            <p className="eyebrow">Users join room</p>
            <h1>Run technical interviews in one live workspace.</h1>
            <p>
              Video, audio, shared code, chat, and interviewer signals stay in
              sync from the first hello to the final decision.
            </p>

            <form className="join-form" onSubmit={joinRoom}>
              <label>
                Room code
                <input
                  value={room}
                  onChange={(event) => setRoom(event.target.value)}
                  aria-label="Room code"
                />
              </label>
              <label>
                Display name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  aria-label="Display name"
                />
              </label>
              <label>
                Role
                <select value={role} onChange={(event) => setRole(event.target.value)}>
                  <option>Candidate</option>
                  <option>Interviewer</option>
                  <option>Observer</option>
                </select>
              </label>
              <button className="button button--primary" type="submit">
                {isJoined ? `Joined ${room}` : "Join room"}
              </button>
            </form>
          </aside>

          <section className="video-stage" aria-label="Video and audio workspace">
            <div className="stage-header">
              <div>
                <p className="eyebrow">Video and audio</p>
                <h2>{room} technical screen</h2>
              </div>
              <span>{isJoined ? "Connected" : "Waiting"}</span>
            </div>

            <div className={`video-grid ${isSharing ? "video-grid--sharing" : ""}`}>
              <article className="video-tile video-tile--local">
                {cameraOn && isJoined ? (
                  <video ref={videoRef} autoPlay muted playsInline aria-label="Local camera" />
                ) : (
                  <img
                    src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80"
                    alt="Candidate preparing for a remote interview"
                  />
                )}
                <div>
                  <strong>{name || "Guest"}</strong>
                  <span>
                    {!isJoined ? "Not joined" : cameraOn ? "Camera on" : "Camera paused"}
                  </span>
                </div>
              </article>
              <article className="video-tile">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80"
                  alt="Interviewer on a video call"
                />
                <div>
                  <strong>Mira Patel</strong>
                  <span>Interviewer online</span>
                </div>
              </article>
              {isSharing && (
                <article className="video-tile video-tile--screen">
                  <video ref={screenRef} autoPlay muted playsInline aria-label="Shared screen" />
                  <div>
                    <strong>Shared screen</strong>
                    <span>Visible to the room</span>
                  </div>
                </article>
              )}
            </div>

            <div className="call-controls" aria-label="Call controls">
              <button
                type="button"
                onClick={toggleAudio}
                className={!micOn ? "is-off" : ""}
                disabled={!isJoined}
              >
                {micOn ? "Mute audio" : "Unmute audio"}
              </button>
              <button
                type="button"
                onClick={toggleVideo}
                className={!cameraOn ? "is-off" : ""}
                disabled={!isJoined}
              >
                {cameraOn ? "Stop video" : "Start video"}
              </button>
              <button
                type="button"
                onClick={shareScreen}
                className={isSharing ? "is-active" : ""}
                disabled={!isJoined}
              >
                {isSharing ? "Stop sharing" : "Share screen"}
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={leaveRoom}
                disabled={!isJoined}
              >
                Leave room
              </button>
            </div>
            <p className="call-notice" aria-live="polite">
              {callNotice}
            </p>
          </section>
        </div>

        <div className="collaboration-grid">
          <section className="code-panel" id="code" aria-label="Collaborative code editor">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Code editor</p>
                <h2>Problem: longest unique substring</h2>
              </div>
              <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                <option>JavaScript</option>
                <option>TypeScript</option>
                <option>Python</option>
                <option>Java</option>
              </select>
            </div>
            <textarea
              value={code}
              onChange={(event) => setCode(event.target.value)}
              spellCheck="false"
              aria-label="Collaborative code editor"
            />
            <div className="editor-footer">
              <span>{language}</span>
              <span>{code.split("\n").length} lines</span>
              <span>Synced editor</span>
            </div>
          </section>

          <section className="chat-panel" id="chat" aria-label="Interview chat">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Chat</p>
                <h2>Room discussion</h2>
              </div>
            </div>
            <div className="messages">
              {messages.map((message, index) => (
                <article className="message" key={`${message.author}-${index}`}>
                  <strong>{message.author}</strong>
                  <span>{message.role}</span>
                  <p>{message.text}</p>
                </article>
              ))}
            </div>
            <form className="chat-form" onSubmit={sendMessage}>
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Send a note, hint, or clarification"
                aria-label="Chat message"
              />
              <button className="button button--primary" type="submit">
                Send
              </button>
            </form>
          </section>
        </div>

        <section className="dashboard" id="dashboard" aria-label="Interviewer dashboard">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Interviewer dashboard</p>
              <h2>Decision signals</h2>
            </div>
            <span className="dashboard-room">{room}</span>
          </div>

          <div className="dashboard-grid">
            <div className="score-card">
              <span>Solution confidence</span>
              <strong>{progress}%</strong>
              <div className="meter">
                <span style={{ width: `${progress}%` }} />
              </div>
              <p>
                Based on editor progress, discussion quality, and completion
                signals during the live session.
              </p>
            </div>

            <div className="candidate-list">
              {candidates.map((candidate) => (
                <article key={candidate.name}>
                  <div>
                    <strong>{candidate.name}</strong>
                    <span>{candidate.role}</span>
                    <small>{candidate.signal}</small>
                  </div>
                  <p>{candidate.status}</p>
                  <b>{candidate.score}</b>
                </article>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

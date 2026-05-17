"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

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

function getInitials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
}

/* ── Toast ── */
function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`} role="alert">
          <span className="toast__icon">
            {t.type === "success" && "✓"}
            {t.type === "error" && "✕"}
            {t.type === "warning" && "⚠"}
            {t.type === "info" && "ℹ"}
          </span>
          <span className="toast__msg">{t.message}</span>
          <button
            className="toast__close"
            onClick={() => onRemove(t.id)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

/* ── Confirm Modal ── */
function ConfirmModal({ isOpen, title, message, confirmLabel, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onCancel} aria-label="Close">×</button>
        <h3 className="modal__title">{title}</h3>
        <p className="modal__body">{message}</p>
        <div className="modal__actions">
          <button className="button button--ghost" onClick={onCancel}>Cancel</button>
          <button className="button button--danger" onClick={onConfirm}>
            {confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Avatar (initials fallback) ── */
function Avatar({ name, imageUrl, size = 48, className = "" }) {
  const [imgError, setImgError] = useState(false);
  if (imageUrl && !imgError) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`avatar-img ${className}`}
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div
      className={`avatar-initials ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}

/* ── Video tile placeholder (no camera / no image) ── */
function VideoPlaceholder({ name, imageUrl }) {
  const [imgError, setImgError] = useState(false);
  if (imageUrl && !imgError) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className="tile-profile-pic"
        onError={() => setImgError(true)}
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div className="tile-placeholder">
      <div className="tile-placeholder__avatar">{getInitials(name)}</div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Main component
══════════════════════════════════════════ */
export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [room, setRoom] = useState("INT-4827");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Candidate");
  const [isJoined, setIsJoined] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [code, setCode] = useState(seedCode);
  const [language, setLanguage] = useState("JavaScript");
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [welcomed, setWelcomed] = useState(false);

  const videoRef = useRef(null);
  const screenRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const toastCounter = useRef(0);

  /* ── Auth redirect ── */
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  /* ── Pre-fill name from Google account ── */
  useEffect(() => {
    if (session?.user?.name && !name) setName(session.user.name);
  }, [session]);

  /* ── Welcome toast ── */
  useEffect(() => {
    if (status === "authenticated" && session?.user && !welcomed) {
      addToast(`Welcome back, ${session.user.name || "friend"}! 👋`, "success");
      setWelcomed(true);
    }
  }, [status, session, welcomed]);

  /* ── Camera srcObject sync ── */
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

  /* ── Toast helpers ── */
  const addToast = (message, type = "info") => {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4500);
  };

  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  /* ── Progress ── */
  const progress = useMemo(() => {
    const filled = code.split("\n").filter((l) => l.trim()).length;
    return Math.min(96, 38 + filled * 4);
  }, [code]);

  /* ── Room actions ── */
  const joinRoom = async (e) => {
    e.preventDefault();
    setIsJoined(true);
    addToast(`Joined room ${room} as ${role}.`, "success");

    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        setCameraOn(true);
        setMicOn(true);
        if (videoRef.current) videoRef.current.srcObject = stream;
        addToast("Camera and microphone are active.", "info");
      } catch {
        setCameraOn(false);
        setMicOn(false);
        addToast("Browser blocked camera or microphone access.", "error");
      }
    }
  };

  const toggleAudio = () => {
    if (!isJoined) { addToast("Join a room first to use the microphone.", "warning"); return; }
    const next = !micOn;
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = next; });
    setMicOn(next);
    addToast(next ? "Microphone is on." : "Microphone muted.", next ? "success" : "info");
  };

  const toggleVideo = () => {
    if (!isJoined) { addToast("Join a room first to use the camera.", "warning"); return; }
    const next = !cameraOn;
    localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = next; });
    setCameraOn(next);
    addToast(next ? "Camera is on." : "Camera paused.", next ? "success" : "info");
  };

  const stopScreenShare = () => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    if (screenRef.current) screenRef.current.srcObject = null;
    setIsSharing(false);
    addToast("Screen sharing stopped.", "info");
  };

  const shareScreen = async () => {
    if (!isJoined) { addToast("Join a room first to share your screen.", "warning"); return; }
    if (isSharing) { stopScreenShare(); return; }
    if (!navigator.mediaDevices?.getDisplayMedia) {
      addToast("Screen sharing is not supported in this browser.", "error");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStreamRef.current = stream;
      setIsSharing(true);
      addToast("Screen sharing is live. No local preview shown to prevent mirror effects.", "success");
      stream.getVideoTracks()[0]?.addEventListener("ended", stopScreenShare);
    } catch {
      addToast("Screen sharing was cancelled.", "info");
    }
  };

  const confirmLeave = () => {
    if (!isJoined) { addToast("You have not joined a room yet.", "warning"); return; }
    setShowLeaveModal(true);
  };

  const leaveRoom = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (screenRef.current) screenRef.current.srcObject = null;
    setIsJoined(false);
    setIsSharing(false);
    setMicOn(false);
    setCameraOn(false);
    setShowLeaveModal(false);
    addToast("You have left the room.", "info");
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!draft.trim()) { addToast("Message cannot be empty.", "warning"); return; }
    setMessages((prev) => [...prev, { author: name || "Guest", role, text: draft.trim() }]);
    setDraft("");
  };

  /* ── Loading / unauthenticated guards ── */
  if (status === "loading") {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading SignalRoom…</p>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const userImage = session?.user?.image ?? null;
  const userName = session?.user?.name || name || "Guest";
  const userEmail = session?.user?.email || "";

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <ConfirmModal
        isOpen={showLeaveModal}
        title="Leave the room?"
        message={`You are about to leave room ${room}. Your camera and microphone will be turned off.`}
        confirmLabel="Leave room"
        onConfirm={leaveRoom}
        onCancel={() => setShowLeaveModal(false)}
      />

      <main className="platform-shell">
        <section className="workspace" aria-label="Real-time interview room">

          {/* ── Top bar ── */}
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

            <div className="topbar__right">
              <div className="live-pill">
                <span />
                {isJoined ? "Live interview" : "Ready room"}
              </div>

              {/* User menu */}
              <div className="user-menu-wrap">
                <button
                  className="user-menu-trigger"
                  onClick={() => setShowUserMenu((v) => !v)}
                  aria-label="Account menu"
                  aria-expanded={showUserMenu}
                >
                  <Avatar name={userName} imageUrl={userImage} size={36} />
                </button>

                {showUserMenu && (
                  <div className="user-dropdown" role="menu">
                    <div className="user-dropdown__info">
                      <Avatar name={userName} imageUrl={userImage} size={44} />
                      <div>
                        <p className="user-dropdown__name">{userName}</p>
                        <p className="user-dropdown__email">{userEmail}</p>
                      </div>
                    </div>
                    <hr className="user-dropdown__divider" />
                    <button
                      className="user-dropdown__signout"
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      role="menuitem"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* ── Room grid ── */}
          <div className="room-grid" id="room">

            {/* Join panel */}
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
                    onChange={(e) => setRoom(e.target.value)}
                    aria-label="Room code"
                  />
                </label>
                <label>
                  Display name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    aria-label="Display name"
                  />
                </label>
                <label>
                  Role
                  <select value={role} onChange={(e) => setRole(e.target.value)}>
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

            {/* Video stage */}
            <section className="video-stage" aria-label="Video and audio workspace">
              <div className="stage-header">
                <div>
                  <p className="eyebrow">Video and audio</p>
                  <h2>{room} technical screen</h2>
                </div>
                <span className={isJoined ? "status-badge status-badge--live" : "status-badge"}>
                  {isJoined ? "Connected" : "Waiting"}
                </span>
              </div>

              <div className={`video-grid ${isSharing ? "video-grid--sharing" : ""}`}>

                {/* Local user tile */}
                <article className="video-tile video-tile--local">
                  {cameraOn && isJoined ? (
                    <video ref={videoRef} autoPlay muted playsInline aria-label="Local camera" />
                  ) : (
                    <VideoPlaceholder name={userName} imageUrl={userImage} />
                  )}
                  <div className="video-tile__info">
                    <strong>{userName}</strong>
                    <span>
                      {!isJoined ? "Not joined" : cameraOn ? "Camera on" : "Camera paused"}
                    </span>
                  </div>
                </article>

                {/* Interviewer tile */}
                <article className="video-tile">
                  <VideoPlaceholder name="Mira Patel" imageUrl={null} />
                  <div className="video-tile__info">
                    <strong>Mira Patel</strong>
                    <span>Interviewer online</span>
                  </div>
                </article>

                {/* Screen share status — no local preview to prevent mirror effect */}
                {isSharing && (
                  <article className="screen-share-status">
                    <div className="screen-share-status__icon">🖥</div>
                    <p className="screen-share-status__title">Screen sharing is live</p>
                    <p className="screen-share-status__sub">
                      Your screen is being shared with the room. No local preview is shown to prevent mirror loops.
                    </p>
                    <button
                      className="button button--danger screen-share-status__stop"
                      type="button"
                      onClick={stopScreenShare}
                    >
                      Stop sharing
                    </button>
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
                  {micOn ? "🎙 Mute" : "🔇 Unmute"}
                </button>
                <button
                  type="button"
                  onClick={toggleVideo}
                  className={!cameraOn ? "is-off" : ""}
                  disabled={!isJoined}
                >
                  {cameraOn ? "📷 Stop video" : "📷 Start video"}
                </button>
                <button
                  type="button"
                  onClick={shareScreen}
                  className={isSharing ? "is-active" : ""}
                  disabled={!isJoined}
                >
                  {isSharing ? "🖥 Stop sharing" : "🖥 Share screen"}
                </button>
                <button
                  type="button"
                  className="danger-button"
                  onClick={confirmLeave}
                  disabled={!isJoined}
                >
                  Leave room
                </button>
              </div>
            </section>
          </div>

          {/* ── Collaboration grid ── */}
          <div className="collaboration-grid">

            {/* Code editor */}
            <section className="code-panel" id="code" aria-label="Collaborative code editor">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Code editor</p>
                  <h2>Problem: longest unique substring</h2>
                </div>
                <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option>JavaScript</option>
                  <option>TypeScript</option>
                  <option>Python</option>
                  <option>Java</option>
                </select>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck="false"
                aria-label="Collaborative code editor"
              />
              <div className="editor-footer">
                <span>{language}</span>
                <span>{code.split("\n").length} lines</span>
                <span>Synced editor</span>
              </div>
            </section>

            {/* Chat */}
            <section className="chat-panel" id="chat" aria-label="Interview chat">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Chat</p>
                  <h2>Room discussion</h2>
                </div>
              </div>
              <div className="messages">
                {messages.map((msg, i) => (
                  <article className="message" key={`${msg.author}-${i}`}>
                    <strong>{msg.author}</strong>
                    <span>{msg.role}</span>
                    <p>{msg.text}</p>
                  </article>
                ))}
              </div>
              <form className="chat-form" onSubmit={sendMessage}>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Send a note, hint, or clarification…"
                  aria-label="Chat message"
                />
                <button className="button button--primary" type="submit">Send</button>
              </form>
            </section>
          </div>

          {/* ── Dashboard ── */}
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
                {candidates.map((c) => (
                  <article key={c.name}>
                    <div>
                      <strong>{c.name}</strong>
                      <span>{c.role}</span>
                      <small>{c.signal}</small>
                    </div>
                    <p>{c.status}</p>
                    <b>{c.score}</b>
                  </article>
                ))}
              </div>
            </div>
          </section>

        </section>

        {/* Mobile bottom nav — hidden on desktop via CSS */}
        <nav className="mobile-nav" aria-label="Mobile navigation">
          <a href="#room">
            <span className="mobile-nav__icon">🏠</span>
            Room
          </a>
          <a href="#code">
            <span className="mobile-nav__icon">💻</span>
            Editor
          </a>
          <a href="#chat">
            <span className="mobile-nav__icon">💬</span>
            Chat
          </a>
          <a href="#dashboard">
            <span className="mobile-nav__icon">📊</span>
            Dashboard
          </a>
        </nav>

      </main>
    </>
  );
}

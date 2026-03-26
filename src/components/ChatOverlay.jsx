import React, { useRef, useEffect, useState } from "react";
import styles from "./ChatOverlay.module.css";

export default function ChatOverlay({
  messages,
  suspicion,
  thought,
  isWaiting,
  onSend,
}) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isWaiting) inputRef.current?.focus();
  }, [isWaiting]);

  const handleSubmit = () => {
    if (!input.trim() || isWaiting) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.suspicionContainer}>
        <div className={styles.suspicionLabel}>SUSPICION: {suspicion}%</div>
        <div className={styles.suspicionBar}>
          <div
            className={styles.suspicionFill}
            style={{ width: `${suspicion}%` }}
          />
        </div>
      </div>

      {thought && (
        <div className={styles.thought}>Robot thinks: "{thought}"</div>
      )}

      <div className={styles.messages}>
        {messages.map((msg, i) => (
          <div key={i} className={`${styles.msg} ${styles[msg.sender]}`}>
            {msg.text}
          </div>
        ))}
        {isWaiting && messages.length > 0 && (
          <div className={`${styles.msg} ${styles.robot}`}>
            ...processing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputArea}>
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder="Say something robot-like..."
          value={input}
          disabled={isWaiting}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <button
          className={styles.sendBtn}
          onClick={handleSubmit}
          disabled={isWaiting}
        >
          SEND
        </button>
      </div>
    </div>
  );
}

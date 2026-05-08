import React, { useRef, useEffect, useMemo, useState } from "react";
import styles from "./ChatOverlay.module.css";
import AchievementToast from "./AchievementToast";
import RobotAnswerPanel from "./RobotAnswerPanel";
import SuspicionGauge from "./SuspicionGauge";
import UserInputBar from "./UserInputBar";

export default function ChatOverlay({
  messages,
  suspicion,
  thought,
  achievement,
  isWaiting,
  phase,
  activeEvent,
  onSend,
}) {
  const [input, setInput] = useState("");
  const [inputOpen, setInputOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isWaiting) {
      setInputOpen(false);
      setInput("");
    }
  }, [isWaiting]);

  useEffect(() => {
    if (inputOpen) {
      inputRef.current?.focus();
    }
  }, [inputOpen]);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") {
        if (historyOpen) {
          setHistoryOpen(false);
          return;
        }
        if (inputOpen) {
          setInputOpen(false);
          setInput("");
        }
        return;
      }
      if (historyOpen || inputOpen || isWaiting) return;
      if (event.key === "e" || event.key === "E") {
        event.preventDefault();
        setInputOpen(true);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [historyOpen, inputOpen, isWaiting]);

  const latestRobotMessage = useMemo(
    () => [...messages].reverse().find((msg) => msg.sender === "robot")?.text,
    [messages],
  );

  const handleSubmit = () => {
    if (!input.trim() || isWaiting) return;
    onSend(input.trim());
    setInput("");
    setInputOpen(false);
  };

  return (
    <div className={styles.overlay}>
      <SuspicionGauge value={suspicion} />

      {achievement && <AchievementToast achievement={achievement} />}

      <div className={styles.phasePill}>
        {activeEvent ? activeEvent.name : phase.replaceAll("_", " ")}
      </div>

      <button
        type="button"
        className={styles.historyBtn}
        onClick={() => setHistoryOpen(true)}
        aria-label="Show conversation log"
      >
        LOG
      </button>

      {thought && (
        <div className={styles.thought}>Robot thinks: "{thought}"</div>
      )}

      {latestRobotMessage && <RobotAnswerPanel message={latestRobotMessage} />}

      {inputOpen ? (
        <UserInputBar
          inputRef={inputRef}
          value={input}
          disabled={isWaiting}
          onChange={setInput}
          onSubmit={handleSubmit}
        />
      ) : (
        <div className={styles.pressHint}>
          Press <span className={styles.pressHintKey}>E</span> to answer
        </div>
      )}

      {historyOpen && (
        <div
          className={styles.historyBackdrop}
          onClick={() => setHistoryOpen(false)}
        >
          <div
            className={styles.historyModal}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.historyHeader}>
              <h2 className={styles.historyTitle}>Conversation Log</h2>
              <button
                type="button"
                className={styles.historyClose}
                onClick={() => setHistoryOpen(false)}
                aria-label="Close conversation log"
              >
                ×
              </button>
            </div>
            <div className={styles.historyBody}>
              {messages.length === 0 ? (
                <div className={styles.historyEmpty}>No messages yet.</div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`${styles.historyMessage} ${
                      msg.sender === "robot"
                        ? styles.historyRobot
                        : styles.historyPlayer
                    }`}
                  >
                    <div className={styles.historySender}>
                      {msg.sender === "robot" ? "MIRA" : "YOU"}
                    </div>
                    <div className={styles.historyText}>{msg.text}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

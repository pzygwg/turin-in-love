import React from "react";
import styles from "./ChatOverlay.module.css";

export default function UserInputBar({
  inputRef,
  value,
  disabled,
  onChange,
  onSubmit,
}) {
  return (
    <div className={styles.inputArea}>
      <input
        ref={inputRef}
        type="text"
        className={styles.input}
        placeholder="Say anything"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => event.key === "Enter" && onSubmit()}
      />
      <button
        className={styles.sendBtn}
        onClick={onSubmit}
        disabled={disabled}
      >
        SEND
      </button>
    </div>
  );
}

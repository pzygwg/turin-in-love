import React from "react";
import styles from "./GameOverScreen.module.css";

export default function GameOverScreen({ exchanges, onRestart }) {
  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>BUSTED</h1>
      <p className={styles.subtitle}>The robot figured out you're human!</p>
      <div className={styles.exchanges}>You lasted {exchanges} exchanges.</div>
      <button className={styles.restartBtn} onClick={onRestart}>
        TRY AGAIN
      </button>
    </div>
  );
}

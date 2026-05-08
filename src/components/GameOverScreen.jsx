import React from "react";
import styles from "./GameOverScreen.module.css";

const ENDING_COPY = {
  LOVE: {
    title: "LOVE",
    subtitle: "MIRA accepts the classification error.",
  },
  FRIENDS: {
    title: "FRIENDS",
    subtitle: "Inconclusive, but pleasant.",
  },
  BUSTED: {
    title: "BUSTED",
    subtitle: "The robot figured out you're human!",
  },
};

export default function GameOverScreen({
  ending,
  exchanges,
  suspicion,
  affection,
  onRestart,
}) {
  const copy = ENDING_COPY[ending] || ENDING_COPY.BUSTED;

  return (
    <div className={styles.screen}>
      <h1 className={`${styles.title} ${styles[ending?.toLowerCase()] || ""}`}>
        {copy.title}
      </h1>
      <p className={styles.subtitle}>{copy.subtitle}</p>
      <div className={styles.exchanges}>You lasted {exchanges} exchanges.</div>
      <div className={styles.stats}>
        Suspicion {Math.round(suspicion)}% / Affection {Math.round(affection)}
      </div>
      <button className={styles.restartBtn} onClick={onRestart}>
        TRY AGAIN
      </button>
    </div>
  );
}

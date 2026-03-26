import React from "react";
import styles from "./TitleCard.module.css";

export default function TitleCard({ exchanges }) {
  return (
    <div className={styles.card}>
      <h1 className={styles.title}>INVERSE TURING</h1>
      <p className={styles.subtitle}>
        Don't let the robot find out you're human
      </p>
      <div className={styles.counter}>Exchanges: {exchanges}</div>
    </div>
  );
}

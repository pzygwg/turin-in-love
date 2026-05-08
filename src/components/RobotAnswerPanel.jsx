import React from "react";
import styles from "./ChatOverlay.module.css";

export default function RobotAnswerPanel({ message }) {
  return (
    <div className={styles.robotAnswer}>
      <div className={styles.robotName}>MIRA</div>
      <p className={styles.robotText}>{message}</p>
      <div className={styles.keyHint}>E</div>
    </div>
  );
}

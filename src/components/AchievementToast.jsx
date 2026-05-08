import React from "react";
import styles from "./ChatOverlay.module.css";

export default function AchievementToast({ achievement }) {
  return (
    <div className={styles.achievement} role="status" aria-live="polite">
      <div className={styles.achievementTitle}>{achievement.title}</div>
      <div className={styles.achievementText}>{achievement.text}</div>
    </div>
  );
}

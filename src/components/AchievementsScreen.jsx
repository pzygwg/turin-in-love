import React from "react";
import {
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENTS,
  SECRET_DISPLAY,
} from "../gameData";
import styles from "./AchievementsScreen.module.css";

export default function AchievementsScreen({ unlockedIds, onBack }) {
  const unlocked = new Set(unlockedIds);
  const progress = `${unlocked.size}/${ACHIEVEMENTS.length}`;

  return (
    <div
      className={styles.screen}
      style={{ backgroundImage: `url(/assets/background.png)` }}
    >
      <div className={styles.panel}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={onBack}>
            Retour
          </button>
          <h1 className={styles.title}>Succès</h1>
          <div className={styles.progress}>{progress}</div>
        </header>

        <main className={styles.grid}>
          {ACHIEVEMENT_CATEGORIES.map((category) => (
            <section key={category.id} className={styles.category}>
              <h2 className={styles.categoryTitle}>{category.title}</h2>
              <div className={styles.categoryGrid}>
                {category.achievements.map((achievement) => {
                  const isUnlocked = unlocked.has(achievement.id);
                  const title =
                    isUnlocked || !achievement.secret
                      ? achievement.title
                      : SECRET_DISPLAY.title;
                  const description =
                    isUnlocked || !achievement.secret
                      ? achievement.description
                      : SECRET_DISPLAY.description;

                  return (
                    <article
                      key={achievement.id}
                      className={`${styles.card} ${isUnlocked ? styles.unlocked : styles.locked}`}
                    >
                      <div className={styles.badge}>{isUnlocked ? "OK" : "??"}</div>
                      <div>
                        <h3 className={styles.cardTitle}>{title}</h3>
                        <p className={styles.cardText}>{description}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}

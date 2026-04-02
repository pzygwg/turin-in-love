import React, { useState } from "react";
import styles from "./LevelSelect.module.css";

export default function LevelSelect({ onStart }) {
  const [selected, setSelected] = useState(0);

  return (
    <div
      className={styles.overlay}
      style={{ backgroundImage: `url(/assets/background.png)` }}
    >
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.btnRetour}>Retour</button>
            <h1 className={styles.titleNiveaux}>Niveaux</h1>
          </div>
          <div className={styles.progressText}>0% Complété</div>
        </header>

        <main className={styles.cardsContainer}>
          {/* Unlocked card */}
          <div
            className={`${styles.card} ${styles.cardUnlocked} ${selected === 0 ? styles.cardSelected : ""}`}
            tabIndex={0}
            onClick={() => setSelected(0)}
            onDoubleClick={() => onStart()}
          >
            <div className={styles.cardWhiteBorder}>
              <div className={styles.cardImageContainer}>
                <div
                  className={styles.levelBg}
                  style={{ backgroundImage: `url(/assets/backgroundlevel.png)` }}
                />
                <div
                  className={styles.robotImg}
                  style={{ backgroundImage: `url(/assets/robot.png)` }}
                />
                <div className={styles.stats}>0/3 fins</div>
                <h2 className={styles.levelName}>Date at the restaurant</h2>
              </div>
            </div>
          </div>

          {/* Locked card */}
          <div
            className={`${styles.card} ${styles.cardLocked} ${selected === 1 ? styles.cardSelected : ""}`}
            tabIndex={0}
            onClick={() => setSelected(1)}
          >
            <h2 className={styles.lockedText}>Locked</h2>
          </div>
        </main>
      </div>
    </div>
  );
}

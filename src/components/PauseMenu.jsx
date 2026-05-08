import React from "react";
import styles from "./PauseMenu.module.css";

export default function PauseMenu({
  isOpen,
  volume,
  onClose,
  onOpen,
  onVolumeChange,
  onAchievements,
  onMainMenu,
}) {
  return (
    <>
      <button
        type="button"
        className={styles.pauseButton}
        onClick={onOpen}
        aria-label="Open pause menu"
      >
        <span />
        <span />
      </button>

      {isOpen && (
        <div className={styles.backdrop} onClick={onClose}>
          <section
            className={styles.panel}
            onClick={(event) => event.stopPropagation()}
            aria-modal="true"
            role="dialog"
            aria-label="Pause menu"
          >
            <header className={styles.header}>
              <h2 className={styles.title}>Pause</h2>
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Close pause menu"
              >
                x
              </button>
            </header>

            <div className={styles.body}>
              <label className={styles.volumeControl}>
                <span>Volume</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(event) =>
                    onVolumeChange(Number(event.target.value))
                  }
                />
                <output>{Math.round(volume * 100)}%</output>
              </label>

              <button
                type="button"
                className={styles.menuButton}
                onClick={onClose}
              >
                Reprendre
              </button>

              <button
                type="button"
                className={styles.menuButton}
                onClick={onAchievements}
              >
                Succès
              </button>

              <button
                type="button"
                className={styles.menuButton}
                onClick={onMainMenu}
              >
                Menu
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

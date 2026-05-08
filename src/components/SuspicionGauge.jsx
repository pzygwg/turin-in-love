import React from "react";
import styles from "./ChatOverlay.module.css";

const CX = 130;
const CY = 130;
const RADIUS = 90;
const START_ANGLE = -130;
const END_ANGLE = 130;
const ANGLE_SPAN = END_ANGLE - START_ANGLE;

function polarPoint(angleDeg, radius) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CX + radius * Math.cos(rad),
    y: CY + radius * Math.sin(rad),
  };
}

const startPoint = polarPoint(START_ANGLE, RADIUS);
const endPoint = polarPoint(END_ANGLE, RADIUS);
const ARC_PATH = `M ${startPoint.x} ${startPoint.y} A ${RADIUS} ${RADIUS} 0 1 1 ${endPoint.x} ${endPoint.y}`;

export default function SuspicionGauge({ value }) {
  const suspicion = Math.min(100, Math.max(0, Number(value) || 0));
  const needleAngle = START_ANGLE + (suspicion / 100) * ANGLE_SPAN;

  return (
    <div
      className={styles.gauge}
      aria-label={`Suspicion ${Math.round(suspicion)} percent`}
    >
      <svg className={styles.gaugeSvg} viewBox="0 0 260 260">
        <defs>
          <linearGradient id="suspicionGradient" x1="0%" y1="100%" x2="100%" y2="20%">
            <stop offset="0%" stopColor="#ff31b6" />
            <stop offset="36%" stopColor="#ffd0f0" />
            <stop offset="64%" stopColor="#d9d9d9" />
            <stop offset="84%" stopColor="#9e9e9e" />
            <stop offset="100%" stopColor="#16000d" />
          </linearGradient>
        </defs>
        <path className={styles.gaugeShadow} d={ARC_PATH} pathLength="100" />
        <path className={styles.gaugeArc} d={ARC_PATH} pathLength="100" />
        <g transform={`rotate(${needleAngle} ${CX} ${CY})`}>
          <polygon
            className={styles.gaugeNeedle}
            points={`${CX - 9},${CY + 6} ${CX + 9},${CY + 6} ${CX},${CY - RADIUS + 6}`}
          />
          <circle className={styles.gaugeHub} cx={CX} cy={CY} r="12" />
          <circle className={styles.gaugeHubInner} cx={CX} cy={CY} r="5" />
        </g>
      </svg>
    </div>
  );
}

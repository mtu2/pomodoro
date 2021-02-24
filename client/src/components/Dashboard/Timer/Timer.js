import React, { useState, useEffect } from "react";
import styles from "./Timer.module.scss";

import { useEntryContext } from "../../../context/EntryContext/EntryContext";
import { formatSecToMinSec } from "../../../utils/times";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { TYPES_DURATION_DICT, TYPES_EMOJIS_DICT } from "../../../utils/types";
import StartTimerAudio from "../../../assets/sounds/notification.mp3";
import EndTimerAudio from "../../../assets/sounds/notification_down.mp3";
// BUG FIX: Bintang's answer https://stackoverflow.com/questions/39807957/countdown-timer-delays-when-tab-is-inactive

const TYPES_STYLES_DICT = {
  p: styles.pomodoro,
  sb: styles.shortBreak,
  lb: styles.longBreak,
};
const FULL_DASH_ARRAY = 283;

// function Timer({ handleCreateEntry })
function Timer() {
  const { addEntry } = useEntryContext();
  const [countdown, setCountdown] = useState(1500000); // ms
  const [counting, setCounting] = useState(false);
  const [timerId, setTimerId] = useState(null);

  const [description, setDescription] = useState("");
  const [type, setType] = useState("p");
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    if (countdown > 0 && counting) {
      // Fix to calculate correct time passed (fix for when tab is inactive in Chrome)
      const lastTime = new Date();

      const id = setTimeout(() => {
        // Calculate and update actual time passed
        const elapsedTime = Date.now() - lastTime;
        setCountdown(countdown - elapsedTime);
      }, 250);

      setTimerId(id);
    } else if (countdown === 0 || countdown < 0) {
      // Submit finished timer

      addEntry(description, type, TYPES_DURATION_DICT[type] / 1000, startTime);
      new Audio(EndTimerAudio).play();

      if (type === "p") {
        // If end of pomodoro timer
        setType("sb");
        setCountdown(TYPES_DURATION_DICT["sb"]);
      } else if (type === "sb" || type === "lb") {
        // If end of short/long break timer
        setType("p");
        setCountdown(TYPES_DURATION_DICT["p"]);
      }
      setCounting(false);
      setStartTime(null);
    }
  }, [countdown, counting, description, type, startTime, addEntry]);

  useEffect(() => {
    if (counting) {
      document.title = `[${formatSecToMinSec(
        Math.floor(countdown / 1000)
      )}] Pomotimer`;
    } else {
      document.title = "Pomotimer";
    }
  }, [counting, countdown]);

  function handleTypeChange(newType) {
    // Change type of timer if not counting
    if (type === newType || counting) return;

    setType(newType);
    setCountdown(TYPES_DURATION_DICT[newType]);
  }
  function handleStartStop() {
    // If just started counting set start time
    if (countdown === TYPES_DURATION_DICT[type]) {
      setStartTime(Date.now());
      new Audio(StartTimerAudio).play();
    }
    // Starts/stops current timer
    if (counting) clearInterval(timerId);
    setCounting(!counting);
  }
  function handleReset() {
    // Stops current timer
    if (counting) clearInterval(timerId);

    // Resets current timer
    setCountdown(TYPES_DURATION_DICT[type]);
    setCounting(false);
    setStartTime(null);
  }
  function handleCancelSave() {
    // Stops current timer
    if (counting) clearInterval(timerId);

    // Resets current timer and submits entry if non-zero
    if (TYPES_DURATION_DICT[type] - countdown > 0) {
      addEntry(
        description,
        type,
        Math.floor((TYPES_DURATION_DICT[type] - countdown) / 1000),
        startTime
      );
    }
    setCountdown(TYPES_DURATION_DICT[type]);
    setCounting(false);
    setStartTime(null);
  }
  function handleDescriptionChange(ev) {
    setDescription(ev.target.value);
  }

  function calcStrokeDasharray() {
    const timeFraction = countdown / TYPES_DURATION_DICT[type];
    const adjustedTimeFraction =
      timeFraction - (1 / TYPES_DURATION_DICT[type]) * (1 - timeFraction);
    return `${((1 - adjustedTimeFraction) * FULL_DASH_ARRAY).toFixed(
      0
    )} ${FULL_DASH_ARRAY}`;
  }

  return (
    <div className={styles.timer}>
      {/* Types Buttons - Pomodoro, SB, LB */}
      <div className={styles.typesButtonContainer}>
        <button
          onClick={() => handleTypeChange("p")}
          title="Pomodoro"
          className={`${type === "p" && styles.active} ${
            styles.pomodoroButton
          }`}
        >
          <p>
            {TYPES_EMOJIS_DICT["p"]}{" "}
            {formatSecToMinSec(TYPES_DURATION_DICT["p"] / 1000)}
          </p>
        </button>
        <button
          onClick={() => handleTypeChange("sb")}
          title="Short Break"
          className={`${type === "sb" && styles.active} ${
            styles.shortBreakButton
          }`}
        >
          <p>
            {TYPES_EMOJIS_DICT["sb"]}{" "}
            {formatSecToMinSec(TYPES_DURATION_DICT["sb"] / 1000)}
          </p>
        </button>
        <button
          onClick={() => handleTypeChange("lb")}
          title="Long Break"
          className={`${type === "lb" && styles.active} ${
            styles.longBreakButton
          }`}
        >
          <p>
            {TYPES_EMOJIS_DICT["lb"]}{" "}
            {formatSecToMinSec(TYPES_DURATION_DICT["lb"] / 1000)}
          </p>
        </button>
      </div>

      {/* Timer */}
      <div className={styles.timerContainer}>
        <h2>{formatSecToMinSec(Math.floor(countdown / 1000))}</h2>
        <p>/ {formatSecToMinSec(TYPES_DURATION_DICT[type] / 1000)}</p>
        <div className={`${styles.innerCircle} ${TYPES_STYLES_DICT[type]}`} />
        <div className={`${styles.outerCircle} ${TYPES_STYLES_DICT[type]}`}>
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <g>
              <circle cx="50" cy="50" r="45" />
              <path
                strokeDasharray={calcStrokeDasharray()}
                d="
                  M 50, 50
                  m -45, 0
                  a 45,45 0 1,0 90,0
                  a 45,45 0 1,0 -90,0
                "
              ></path>
            </g>
          </svg>
        </div>
      </div>

      {/* Control Timer Buttons - Reset, Cancel & Save, Start/Stop */}
      <div className={styles.controlsButtonContainer}>
        <button onClick={handleReset} title="Reset">
          <FontAwesomeIcon icon={["fas", "redo"]} className={styles.icon} />
        </button>
        <button onClick={handleCancelSave} title="Cancel & Save">
          <FontAwesomeIcon icon={["fas", "stop"]} className={styles.icon} />
        </button>
        <button
          onClick={handleStartStop}
          className={styles.startStopButton}
          title="Start/Stop"
        >
          {counting ? (
            <FontAwesomeIcon icon={["fas", "pause"]} className={styles.icon} />
          ) : (
            <FontAwesomeIcon icon={["fas", "play"]} className={styles.icon} />
          )}
        </button>
      </div>

      {/* Description of Entry (optional) */}
      <div className={styles.descriptionContainer}>
        <input
          type="text"
          placeholder="I'm focusing on..."
          value={description}
          onChange={handleDescriptionChange}
        ></input>
      </div>
    </div>
  );
}

export default Timer;

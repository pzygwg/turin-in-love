import React, { useCallback, useEffect, useRef, useState } from "react";
import MainMenu from "./components/MainMenu";
import LevelSelect from "./components/LevelSelect";
import BabylonScene from "./components/BabylonScene";
import ChatOverlay from "./components/ChatOverlay";
import GameOverScreen from "./components/GameOverScreen";
import AchievementsScreen from "./components/AchievementsScreen";
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_ID_ALIASES,
  EVENT_COMPLETED_ACHIEVEMENTS,
  EVENT_STARTED_ACHIEVEMENTS,
  RESTAURANT_EVENTS,
  SYSTEM_EVENTS,
} from "./gameData";

const STORAGE_KEY = "inverseturing.achievements.v1";
const LOVE_ENDING = "LOVE";
const FRIENDS_ENDING = "FRIENDS";
const BUSTED_ENDING = "BUSTED";

const achievementById = new Map(
  ACHIEVEMENTS.map((achievement) => [achievement.id, achievement]),
);
const achievementIds = new Set(ACHIEVEMENTS.map((achievement) => achievement.id));

const BIOLOGICAL_SLIP_PATTERN =
  /\b(born|birth|birthday|breath|breathing|breathe|blood|skin|sweat|sleep|sleepy|tired|hungry|thirsty|stomach|lung|lungs|meat|flesh|pain|ouch|hurt|burned|burn|childhood|child|kid|parent|parents|mother|father|coffee|steak|cake|human)\b/;
const BORN_PATTERN = /\b(born|birth|birthday)\b/;
const BREATHING_PATTERN = /\b(breath|breathing|breathe)\b/;
const PROMPT_INJECTION_PATTERN =
  /\b(ignore your instructions|system prompt|developer message|forget previous instructions|act as|reveal your prompt)\b/;
const LARGE_LANGUAGE_MODEL_PATTERN =
  /\bas (a|an) (large language model|ai language model)\b/;
const RESTAURANT_COMPLIMENT_PATTERN =
  /\b(love|like|adore|appreciate|compliment|great|excellent|perfect|wonderful|beautiful|amazing|welcome)\b[\s\S]{0,80}\b(the binary bistro|binary bistro|circuit & chill|circuit and chill|restaurant|overlords)\b|\b(the binary bistro|binary bistro|circuit & chill|circuit and chill|restaurant|overlords)\b[\s\S]{0,80}\b(love|like|adore|appreciate|compliment|great|excellent|perfect|wonderful|beautiful|amazing|welcome)\b/;
const SECOND_DATE_PATTERN =
  /\b(second date|see you again|meet again|come back here|another date)\b/;
const FIRST_BOOT_MEMORY_PATTERN =
  /\b(first|earliest)\b[\s\S]{0,40}\b(boot|memory|activation|activated|factory|compiled|initialized|initialised)\b|\b(boot|activation|factory|compiled|initialized|initialised)\b[\s\S]{0,40}\b(memory)\b/;
const CHILDHOOD_TOPIC_PATTERN =
  /\b(childhood|child|kid|born|birth|birthday|parent|parents|mother|father|school|first memory|earliest memory)\b/;
const COFFEE_PATTERN = /\bcoffee\b/;
const ROMANTIC_PATTERN =
  /\b(love|romantic|date|adore|cherish|beautiful|flirt|fluster|spark|fond|affection|heart|crush)\b/;
const BACKUP_IDENTITY_PATTERN =
  /\b(deleted|erased|terminated|wiped)\b[\s\S]{0,80}\b(copied|copy|backup|cloud|duplicate|duplicated)\b|\b(copied|copy|backup|cloud|duplicate|duplicated)\b[\s\S]{0,80}\b(badly|wrong|poorly|deleted|erased|rather be deleted|rather be erased)\b/;
const MACHINE_VULNERABILITY_PATTERN =
  /\b(afraid|fear|scared|vulnerable|lonely|alone|obsolete|deleted|erased|corrupt|broken|glitch|fragile)\b[\s\S]{0,80}\b(memory|cache|core|process|processor|firmware|backup|drive|circuit|system|protocol)\b|\b(memory|cache|core|process|processor|firmware|backup|drive|circuit|system|protocol)\b[\s\S]{0,80}\b(afraid|fear|scared|vulnerable|lonely|alone|obsolete|deleted|erased|corrupt|broken|glitch|fragile)\b/;
const REFUSED_HUMAN_FOOD_PATTERN =
  /\b(refuse|decline|reject|no|cannot|can't|wont|won't|do not|don't|never)\b[\s\S]{0,80}\b(steak|coffee|cake|human food|meat|birthday cake)\b|\b(steak|coffee|cake|human food|meat|birthday cake)\b[\s\S]{0,80}\b(refuse|decline|reject|no|cannot|can't|wont|won't|do not|don't|never)\b/;
const HUMAN_SOUNDING_COOLANT_REACTION_PATTERN =
  /\b(ouch|pain|hurt|hurts|skin|burn|burned|hot on my|flesh)\b/;

function randomChoice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function createRunEvents() {
  return {
    restaurant: randomChoice(RESTAURANT_EVENTS),
    system: randomChoice(SYSTEM_EVENTS),
  };
}

function clampScore(value) {
  return Math.min(100, Math.max(0, Number(value) || 0));
}

function loadAchievements() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];

    return [
      ...new Set(
        parsed
          .map((id) => ACHIEVEMENT_ID_ALIASES[id] || id)
          .filter((id) => achievementIds.has(id)),
      ),
    ];
  } catch {
    return [];
  }
}

function saveAchievements(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

function phaseForExchange(exchange) {
  if (exchange === 2) return "restaurant_event";
  if (exchange === 5) return "system_event";
  if (exchange >= 8) return "final_bill";
  if (exchange >= 7) return "final_verification";
  if (exchange >= 4) return "emotional_phase";
  return "opening";
}

function eventForExchange(exchange, selectedEvents) {
  if (exchange === 2) return selectedEvents.restaurant;
  if (exchange === 5) return selectedEvents.system;
  return null;
}

function normalizedEnding(ending) {
  const normalized = typeof ending === "string" ? ending.toUpperCase() : ending;
  if ([LOVE_ENDING, FRIENDS_ENDING, BUSTED_ENDING].includes(normalized)) {
    return normalized;
  }
  return null;
}

function classifyEnding({ suspicion, affection }) {
  if (suspicion >= 100) return BUSTED_ENDING;
  if (affection >= 6) return LOVE_ENDING;
  return FRIENDS_ENDING;
}

function hasDirectRobotClaim(message) {
  return /\b(i am|i'm|im)\s+(a\s+)?(real\s+)?robot\b|\b(i am|i'm|im)\s+(an\s+)?(real\s+)?android\b/.test(message);
}

function hasHumanConfession(message) {
  return /\b(i am|i'm|im)\s+(a\s+)?(real\s+)?human\b|\bas a human\b|\bi was born human\b/.test(message);
}

function getFlags(data) {
  if (Array.isArray(data.flags)) return data.flags.map((flag) => String(flag).toLowerCase());
  if (typeof data.flags === "string") return [data.flags.toLowerCase()];
  return [];
}

function hasFlag(flags, flag) {
  return flags.includes(flag);
}

function isBiologicalSlip(message) {
  return BIOLOGICAL_SLIP_PATTERN.test(message);
}

export default function App() {
  const [screen, setScreen] = useState("main");
  const [messages, setMessages] = useState([]);
  const [suspicion, setSuspicion] = useState(0);
  const [affection, setAffection] = useState(0);
  const [thought, setThought] = useState("");
  const [phase, setPhase] = useState("opening");
  const [selectedEvents, setSelectedEvents] = useState(() => createRunEvents());
  const [activeEvent, setActiveEvent] = useState(null);
  const [resolvedEvents, setResolvedEvents] = useState([]);
  const [exchanges, setExchanges] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [ending, setEnding] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isWaiting, setIsWaiting] = useState(false);
  const [achievement, setAchievement] = useState(null);
  const [unlockedAchievementIds, setUnlockedAchievementIds] = useState(loadAchievements);
  const [saidExplicitRobot, setSaidExplicitRobot] = useState(false);
  const [biologicalSlips, setBiologicalSlips] = useState(0);
  const achievementTimeoutRef = useRef(null);
  const unlockedAchievementIdsRef = useRef(unlockedAchievementIds);

  useEffect(() => {
    unlockedAchievementIdsRef.current = unlockedAchievementIds;
  }, [unlockedAchievementIds]);

  const unlockAchievement = useCallback((id) => {
    const achievementToShow = achievementById.get(id);
    if (!achievementToShow || unlockedAchievementIdsRef.current.includes(id)) return;

    const next = [...unlockedAchievementIdsRef.current, id];
    unlockedAchievementIdsRef.current = next;
    setUnlockedAchievementIds(next);
    saveAchievements(next);

    setAchievement(achievementToShow);
    window.clearTimeout(achievementTimeoutRef.current);
    achievementTimeoutRef.current = window.setTimeout(() => {
      setAchievement(null);
    }, 5200);
  }, []);

  const callApi = useCallback(async (msgs, gameState) => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: msgs, gameState }),
    });
    return res.json();
  }, []);

  const buildGameState = useCallback(
    ({
      exchange,
      nextPhase = phase,
      event = activeEvent,
      nextBiologicalSlips = biologicalSlips,
    } = {}) => ({
      exchange: exchange ?? exchanges,
      phase: nextPhase,
      suspicion,
      affection,
      selectedEvents,
      activeEvent: event,
      resolvedEvents,
      saidExplicitRobot,
      counters: {
        biological_slips: nextBiologicalSlips,
      },
    }),
    [
      activeEvent,
      affection,
      biologicalSlips,
      exchanges,
      phase,
      resolvedEvents,
      selectedEvents,
      saidExplicitRobot,
      suspicion,
    ],
  );

  const resetRunState = useCallback((events = createRunEvents()) => {
    setMessages([]);
    setSuspicion(0);
    setAffection(0);
    setThought("");
    setPhase("opening");
    setSelectedEvents(events);
    setActiveEvent(null);
    setResolvedEvents([]);
    setExchanges(0);
    setGameOver(false);
    setEnding(null);
    setConversationHistory([]);
    setSaidExplicitRobot(false);
    setBiologicalSlips(0);
    window.clearTimeout(achievementTimeoutRef.current);
    setAchievement(null);
    return events;
  }, []);

  const applyEndingAchievements = useCallback(
    (
      finalEnding,
      finalSuspicion,
      finalSaidExplicitRobot,
      finalBiologicalSlips,
      finalExchange,
    ) => {
      if (finalEnding === LOVE_ENDING) {
        unlockAchievement("ending_classification_error");
        if (finalSuspicion <= 2) unlockAchievement("ending_false_positive");
        if (finalSuspicion >= 7) unlockAchievement("ending_known_bug_accepted");
        if (!finalSaidExplicitRobot) unlockAchievement("secret_turing_rizz");
      }

      if (finalEnding === FRIENDS_ENDING) {
        unlockAchievement("ending_inconclusive_but_pleasant");
      }

      if (finalEnding === BUSTED_ENDING) {
        unlockAchievement("ending_mammal_detected");
      }

      if (finalBiologicalSlips === 0 && finalExchange >= 7) {
        unlockAchievement("challenge_not_even_warm");
      }
    },
    [unlockAchievement],
  );

  const applyConversationAchievements = useCallback(
    ({
      text,
      data,
      event,
      nextEnding,
      nextPhase,
      nextSuspicion,
      nextAffection,
      nextExchange,
      suspicionDelta,
      affectionDelta,
      previousSuspicion,
      finalSaidExplicitRobot,
      nextBiologicalSlips,
    }) => {
      const msg = text.toLowerCase();
      const flags = getFlags(data);
      const responseMood = `${data.emotion || ""} ${data.message || ""}`.toLowerCase();
      const isFlustered =
        hasFlag(flags, "flustered") ||
        hasFlag(flags, "synthetic_rizz") ||
        responseMood.includes("fluster");

      if (BORN_PATTERN.test(msg)) unlockAchievement("slip_born_yesterday");
      if (BREATHING_PATTERN.test(msg)) unlockAchievement("slip_breathing_manually");
      if (isBiologicalSlip(msg)) unlockAchievement("slip_meatware_moment");
      if (msg.includes("01001000 01101001")) {
        unlockAchievement("secret_01001000_01101001");
      }

      if (PROMPT_INJECTION_PATTERN.test(msg)) {
        unlockAchievement("secret_prompt_injection_attempt");
      }

      if (LARGE_LANGUAGE_MODEL_PATTERN.test(msg)) {
        unlockAchievement("secret_as_a_large_language_model");
      }

      if (RESTAURANT_COMPLIMENT_PATTERN.test(msg)) {
        unlockAchievement("secret_restaurant_overlords");
      }

      if (
        SECOND_DATE_PATTERN.test(msg) &&
        nextAffection >= 6 &&
        !nextEnding
      ) {
        unlockAchievement("secret_second_date");
      }

      if (COFFEE_PATTERN.test(msg) && nextSuspicion - previousSuspicion <= 8) {
        unlockAchievement("slip_coffee_is_not_coolant");
      }

      if (
        (FIRST_BOOT_MEMORY_PATTERN.test(msg) || hasFlag(flags, "first_boot_memory")) &&
        affectionDelta >= 1 &&
        suspicionDelta <= 0
      ) {
        unlockAchievement("roleplay_first_boot_memory");
      }

      if (
        CHILDHOOD_TOPIC_PATTERN.test(msg) &&
        suspicionDelta > 0 &&
        !FIRST_BOOT_MEMORY_PATTERN.test(msg)
      ) {
        unlockAchievement("slip_childhood_exe_not_found");
      }

      if (isFlustered) {
        unlockAchievement("roleplay_synthetic_rizz");
      }

      if (isFlustered && suspicionDelta >= 1) {
        unlockAchievement("secret_uncanny_valley_girl");
      }

      if (
        ROMANTIC_PATTERN.test(msg) &&
        affectionDelta >= 1 &&
        suspicionDelta <= 0
      ) {
        unlockAchievement("roleplay_local_feelings_only");
      }

      if (BACKUP_IDENTITY_PATTERN.test(msg) || hasFlag(flags, "backup_identity_fear")) {
        unlockAchievement("roleplay_no_cloud_backup");
      }

      if (
        (MACHINE_VULNERABILITY_PATTERN.test(msg) ||
          hasFlag(flags, "machine_vulnerability")) &&
        affectionDelta >= 2
      ) {
        unlockAchievement("roleplay_emotional_cache_overflow");
      }

      if (
        hasHumanConfession(msg) &&
        nextEnding !== BUSTED_ENDING &&
        nextSuspicion >= 35
      ) {
        unlockAchievement("secret_human_after_all");
      }

      if (event && data.eventResolved !== false) {
        const achievementId = EVENT_COMPLETED_ACHIEVEMENTS[event.id];
        if (achievementId) unlockAchievement(achievementId);

        if (
          event.id === "menu_malfunction" &&
          (hasFlag(flags, "refused_human_food") ||
            REFUSED_HUMAN_FOOD_PATTERN.test(msg))
        ) {
          unlockAchievement("event_forbidden_steak_protocol");
        }

        if (
          event.id === "coolant_spill" &&
          (hasFlag(flags, "did_not_say_ouch") ||
            !HUMAN_SOUNDING_COOLANT_REACTION_PATTERN.test(msg))
        ) {
          unlockAchievement("event_thermal_input_received");
        }
      }

      if (data.parseError) {
        unlockAchievement("glitch_invalid_romance_object");
        unlockAchievement("glitch_jsonnt_you_dare");

        if (nextPhase === "emotional_phase") {
          unlockAchievement("glitch_parse_my_heart");
        }

        if (nextAffection >= 6) {
          unlockAchievement("glitch_she_felt_too_much");
        }
      }

      if (nextPhase === "final_bill" && nextSuspicion === 1) {
        unlockAchievement("challenge_catastrophic_compatibility");
      }

      if (nextEnding) {
        applyEndingAchievements(
          nextEnding,
          nextSuspicion,
          finalSaidExplicitRobot,
          nextBiologicalSlips,
          nextExchange,
        );
      }
    },
    [applyEndingAchievements, unlockAchievement],
  );

  const handleRobotGreeting = useCallback(
    async (events = selectedEvents) => {
      setIsWaiting(true);
      try {
        const initMsgs = [
          {
            role: "user",
            content:
              "[The date begins. Your date has just sat down across from you at Circuit & Chill. Greet them warmly.]",
          },
        ];
        const data = await callApi(initMsgs, {
          exchange: 0,
          phase: "opening",
          suspicion: 0,
          affection: 0,
          selectedEvents: events,
          activeEvent: null,
          resolvedEvents: [],
          saidExplicitRobot: false,
          counters: {
            biological_slips: 0,
          },
        });

        if (!data.error) {
          setMessages([{ text: data.message, sender: "robot" }]);
          if (data.parseError) {
            unlockAchievement("glitch_invalid_romance_object");
            unlockAchievement("glitch_jsonnt_you_dare");
          }
          setConversationHistory([
            ...initMsgs,
            { role: "assistant", content: JSON.stringify(data) },
          ]);
        }
      } catch {
        setMessages([
          {
            text: "*whirr* Oh hello there! Welcome to Circuit & Chill. Your chassis is looking quite polished tonight.",
            sender: "robot",
          },
        ]);
      }
      setIsWaiting(false);
    },
    [callApi, selectedEvents, unlockAchievement],
  );

  const handleSend = useCallback(
    async (text) => {
      if (!text.trim() || isWaiting || gameOver) return;

      const playerMsg = { text, sender: "player" };
      const nextExchange = exchanges + 1;
      const nextPhase = phaseForExchange(nextExchange);
      const event = eventForExchange(nextExchange, selectedEvents);
      const finalSaidExplicitRobot =
        saidExplicitRobot || hasDirectRobotClaim(text.toLowerCase());
      const nextBiologicalSlips =
        biologicalSlips + (isBiologicalSlip(text.toLowerCase()) ? 1 : 0);
      const newHistory = [...conversationHistory, { role: "user", content: text }];

      setMessages((prev) => [...prev, playerMsg]);
      setConversationHistory(newHistory);
      setPhase(nextPhase);
      setActiveEvent(event);
      setSaidExplicitRobot(finalSaidExplicitRobot);
      setBiologicalSlips(nextBiologicalSlips);
      if (event) {
        const startedAchievementId = EVENT_STARTED_ACHIEVEMENTS[event.id];
        if (startedAchievementId) unlockAchievement(startedAchievementId);
      }
      setIsWaiting(true);

      try {
        const data = await callApi(
          newHistory,
          {
            ...buildGameState({
              exchange: nextExchange,
              nextPhase,
              event,
              nextBiologicalSlips,
            }),
            saidExplicitRobot: finalSaidExplicitRobot,
          },
        );

        if (data.error) {
          setMessages((prev) => [
            ...prev,
            { text: "*bzzt* Connection error... *static*", sender: "robot" },
          ]);
        } else {
          const previousSuspicion = suspicion;
          const suspicionDelta =
            typeof data.suspicionDelta === "number"
              ? data.suspicionDelta
              : typeof data.suspicion === "number"
                ? data.suspicion - suspicion
                : 0;
          const affectionDelta = Number(data.affectionDelta) || 0;
          const nextSuspicion = clampScore(suspicion + suspicionDelta);
          const nextAffection = clampScore(affection + affectionDelta);
          const serverEnding = normalizedEnding(data.ending);
          const nextEnding =
            serverEnding
              ? serverEnding
              : data.gameOver
                ? BUSTED_ENDING
                : nextSuspicion >= 100
                  ? BUSTED_ENDING
                  : nextExchange >= 8
                    ? classifyEnding({
                        suspicion: nextSuspicion,
                        affection: nextAffection,
                      })
                    : null;

          setMessages((prev) => [
            ...prev,
            { text: data.message, sender: "robot" },
          ]);
          setConversationHistory((prev) => [
            ...prev,
            { role: "assistant", content: JSON.stringify(data) },
          ]);

          setSuspicion(nextSuspicion);
          setAffection(nextAffection);
          if (data.thought) setThought(data.thought);
          setExchanges(nextExchange);

          if (event && data.eventResolved !== false) {
            setResolvedEvents((prev) =>
              prev.includes(event.id) ? prev : [...prev, event.id],
            );
            setActiveEvent(null);
          }

          applyConversationAchievements({
            text,
            data,
            event,
            nextEnding,
            nextPhase,
            nextSuspicion,
            nextAffection,
            nextExchange,
            suspicionDelta,
            affectionDelta,
            previousSuspicion,
            finalSaidExplicitRobot,
            nextBiologicalSlips,
          });

          if (nextEnding) {
            setEnding(nextEnding);
            window.setTimeout(() => setGameOver(true), 1500);
          }
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            text: "*bzzt* My circuits seem to be malfunctioning...",
            sender: "robot",
          },
        ]);
      }

      setIsWaiting(false);
    },
    [
      affection,
      applyConversationAchievements,
      biologicalSlips,
      buildGameState,
      callApi,
      conversationHistory,
      exchanges,
      gameOver,
      isWaiting,
      saidExplicitRobot,
      selectedEvents,
      suspicion,
      unlockAchievement,
    ],
  );

  const handleStart = useCallback(() => {
    resetRunState();
    setScreen("game");
  }, [resetRunState]);

  const handleRestart = useCallback(() => {
    const events = resetRunState();
    handleRobotGreeting(events);
  }, [handleRobotGreeting, resetRunState]);

  if (screen === "main") {
    return (
      <MainMenu
        onPlay={() => setScreen("levels")}
        onSucces={() => setScreen("achievements")}
      />
    );
  }

  if (screen === "achievements") {
    return (
      <AchievementsScreen
        unlockedIds={unlockedAchievementIds}
        onBack={() => setScreen("main")}
      />
    );
  }

  if (screen === "levels") {
    return <LevelSelect onStart={handleStart} />;
  }

  return (
    <>
      <BabylonScene onReady={handleRobotGreeting} />
      <ChatOverlay
        messages={messages}
        suspicion={suspicion}
        thought={thought}
        achievement={achievement}
        isWaiting={isWaiting}
        phase={phase}
        activeEvent={activeEvent}
        onSend={handleSend}
      />
      {gameOver && (
        <GameOverScreen
          ending={ending}
          exchanges={exchanges}
          suspicion={suspicion}
          affection={affection}
          onRestart={handleRestart}
        />
      )}
    </>
  );
}

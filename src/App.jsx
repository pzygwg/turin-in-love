import React, { useState, useCallback } from "react";
import BabylonScene from "./components/BabylonScene";
import ChatOverlay from "./components/ChatOverlay";
import GameOverScreen from "./components/GameOverScreen";
import TitleCard from "./components/TitleCard";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [suspicion, setSuspicion] = useState(0);
  const [thought, setThought] = useState("");
  const [exchanges, setExchanges] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isWaiting, setIsWaiting] = useState(false);

  const callApi = useCallback(async (msgs) => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: msgs }),
    });
    return res.json();
  }, []);

  const handleRobotGreeting = useCallback(async () => {
    setIsWaiting(true);
    try {
      const initMsgs = [
        {
          role: "user",
          content:
            "[The date begins. Your date has just sat down across from you at Circuit & Chill. Greet them warmly.]",
        },
      ];
      const data = await callApi(initMsgs);
      if (!data.error) {
        setMessages([{ text: data.message, sender: "robot" }]);
        setConversationHistory([
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
  }, [callApi]);

  const handleSend = useCallback(
    async (text) => {
      if (!text.trim() || isWaiting) return;

      const playerMsg = { text, sender: "player" };
      const newHistory = [...conversationHistory, { role: "user", content: text }];

      setMessages((prev) => [...prev, playerMsg]);
      setConversationHistory(newHistory);
      setIsWaiting(true);

      try {
        const data = await callApi(newHistory);

        if (data.error) {
          setMessages((prev) => [
            ...prev,
            { text: "*bzzt* Connection error... *static*", sender: "robot" },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            { text: data.message, sender: "robot" },
          ]);
          setConversationHistory((prev) => [
            ...prev,
            { role: "assistant", content: JSON.stringify(data) },
          ]);

          const s = Math.min(100, Math.max(0, data.suspicion || 0));
          setSuspicion(s);
          if (data.thought) setThought(data.thought);

          setExchanges((prev) => {
            const next = prev + 1;
            if (data.gameOver) {
              setTimeout(() => setGameOver(true), 1500);
            }
            return next;
          });
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
    [conversationHistory, isWaiting, callApi],
  );

  const handleRestart = useCallback(() => {
    setMessages([]);
    setSuspicion(0);
    setThought("");
    setExchanges(0);
    setGameOver(false);
    setConversationHistory([]);
    handleRobotGreeting();
  }, [handleRobotGreeting]);

  return (
    <>
      <BabylonScene onReady={handleRobotGreeting} />
      <TitleCard exchanges={exchanges} />
      <ChatOverlay
        messages={messages}
        suspicion={suspicion}
        thought={thought}
        isWaiting={isWaiting}
        onSend={handleSend}
      />
      {gameOver && (
        <GameOverScreen exchanges={exchanges} onRestart={handleRestart} />
      )}
    </>
  );
}

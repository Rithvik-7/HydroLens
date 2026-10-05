"use client";

import { useRef, useState, type FormEvent } from "react";
import { AlertCircle, ArrowUp, BrainCircuit, Check, Cpu, LoaderCircle, LockKeyhole, RotateCcw, Sparkles } from "lucide-react";
import type { PlanningInputs } from "@/lib/hydrology";


const API_URL = process.env.NEXT_PUBLIC_ADVISOR_API_URL || "https://hydrolens-advisor-rithvik7.onrender.com";
const STARTERS = [
  "Explain my water balance",
  "How can I reduce overflow?",
  "What assumptions matter most?",
];
type Message = { role: "user" | "assistant"; content: string };


export function AIWaterAdvisor({
  inputs,
  city,
  neighborhood,
  annualCollection,
  waterSupplied,
  suggestedTank,
}: {
  inputs: PlanningInputs;
  city: string;
  neighborhood: string;
  annualCollection: number;
  waterSupplied: number;
  overflow: number;
  demandMet: number;
  suggestedTank: number | null;
}) {
  const [state, setState] = useState<"ready" | "asking">("ready");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const feed = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || busy.current) return;
    busy.current = true;
    setError(""); setDraft(""); setState("asking");
    const history: Message[] = [...messages, {role: "user", content: trimmed}];
    setMessages([...history, {role: "assistant", content: ""}]);
    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({inputs, messages: history.slice(-7)}),
        signal: AbortSignal.timeout(90000),
      });
      const data = await response.json() as {answer?: string; error?: string};
      if (!response.ok || typeof data.answer !== "string") throw new Error(data.error || "The advisor is unavailable. Please retry shortly.");
      setMessages([...history, {role: "assistant", content: data.answer}]);
    } catch (cause) {
      setMessages(messages); setDraft(trimmed);
      setError(cause instanceof Error && cause.name !== "TimeoutError" ? cause.message : "The server is waking up. Please send your question again shortly.");
    } finally {
      busy.current = false; setState("ready");
      requestAnimationFrame(() => feed.current?.scrollTo({top: feed.current.scrollHeight, behavior: "smooth"}));
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(draft);
  }

  function resetChat() {
    setMessages([]);
    setError("");
    setState("ready");
  }

  const isBusy = state === "asking";

  return (
    <section className="ai-advisor" aria-labelledby="ai-advisor-title">
      <div className="ai-advisor-hero">
        <div className="ai-advisor-copy">
          <div className="ai-pill"><Sparkles size={14} /> GOOGLE GEMINI · CLOUD AI</div>
          <h2 id="ai-advisor-title">Meet your water advisor.</h2>
          <p>Ask about your roof, rain and tank. Your live plan goes into the prompt, so answers are about this scenario.</p>
        </div>
        <div className="ai-orb" aria-hidden="true"><BrainCircuit size={36} strokeWidth={1.35} /><span /></div>
      </div>

      <div className="ai-workspace">
        <div className="ai-chat-panel">
          <header className="ai-chat-header">
            <span className={`ai-presence ${state === "ready" || state === "asking" ? "is-ready" : ""}`} />
            <div><strong>HydroLens AI</strong><small>{state === "ready" || state === "asking" ? "Powered by Google Gemini" : "AI co-pilot for this plan"}</small></div>
            {messages.length > 0 && <button className="ai-reset" type="button" onClick={resetChat} disabled={isBusy} aria-label="Clear conversation"><RotateCcw size={16} /></button>}
          </header>

          <div ref={feed} className="ai-chat-feed" aria-live="polite" aria-label="Conversation with the HydroLens AI advisor">
            {messages.length === 0 ? (
              <div className="ai-welcome">
                <div className="ai-welcome-icon"><BrainCircuit size={23} /></div>
                <strong>Your plan, explained.</strong>
                <p>Ask a question immediately. Gemini explains your current numbers with no model download.</p>
                {STARTERS.map((prompt) => <button className="ai-starter" type="button" key={prompt} onClick={() => state === "ready" ? void ask(prompt) : setDraft(prompt)}>{prompt}<ArrowUp size={14} /></button>)}
              </div>
            ) : messages.map((message, index) => (
              <div key={`${index}-${message.role}`} className={`ai-message ${message.role}`}>
                {message.role === "assistant" && <span className="ai-message-mark"><Sparkles size={13} /></span>}
                <p>{message.content || (isBusy && index === messages.length - 1 ? <><LoaderCircle size={14} className="ai-spin" /> Thinking… The first request may take a minute while the server wakes up.</> : "")}</p>
              </div>
            ))}
            {error && <div className="ai-inline-error" role="status"><AlertCircle size={15} /><span>{error}</span></div>}
          </div>

          {(state === "ready" || state === "asking") && (
            <form className="ai-compose" onSubmit={submit}>
              <label className="sr-only" htmlFor="ai-prompt">Ask the HydroLens AI advisor</label>
              <textarea id="ai-prompt" rows={2} maxLength={500} placeholder="Ask about this water plan…" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} disabled={state === "asking"} />
              <button className="ai-send" type="submit" disabled={state === "asking" || !draft.trim()} aria-label="Send message"><ArrowUp size={18} /></button>
            </form>
          )}
          <div className="ai-privacy"><LockKeyhole size={13} /> Chat and numeric plan data are sent through our server to Google Gemini. Roof images stay in your browser.</div>
        </div>

        <aside className="ai-plan-context" aria-label="Scenario the AI will use">
          <div className="ai-context-title"><Cpu size={15} /><span>THE PLAN IN CONTEXT</span><Check size={15} /></div>
          <strong>{neighborhood}, {city}</strong>
          <p>Roof area <b>{inputs.area.toLocaleString("en-IN")} m²</b></p>
          <p>Annual collection <b>{Math.round(annualCollection).toLocaleString("en-IN")} L</b></p>
          <p>Supplied in simulation <b>{Math.round(waterSupplied).toLocaleString("en-IN")} L</b></p>
          <p>Storage comparison <b>{suggestedTank === null ? "No useful supply" : `${suggestedTank.toLocaleString("en-IN")} L suggested`}</b></p>
          <div className="ai-context-note"><AlertCircle size={15} /> Sample rain and storm timing are illustrative. AI can explain the plan; it cannot verify local weather or building safety.</div>
        </aside>
      </div>
    </section>
  );
}

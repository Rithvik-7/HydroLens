"use client";

import { useRef, useState, type FormEvent } from "react";
import { AlertCircle, ArrowUp, BrainCircuit, Check, Cpu, LoaderCircle, LockKeyhole, RotateCcw, Sparkles } from "lucide-react";
import type { PlanningInputs } from "@/lib/hydrology";
import type { MLCEngineInterface } from "@mlc-ai/web-llm";

const MODEL_ID = "Llama-3.2-1B-Instruct-q4f16_1-MLC";
const STARTERS = [
  "Explain my water balance",
  "How can I reduce overflow?",
  "What assumptions matter most?",
];
type Message = { role: "user" | "assistant"; content: string };
type ModelEngine = MLCEngineInterface;

export function AIWaterAdvisor({
  inputs,
  city,
  neighborhood,
  annualCollection,
  waterSupplied,
  overflow,
  demandMet,
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
  const engine = useRef<ModelEngine | null>(null);
  const [state, setState] = useState<"idle" | "checking" | "loading" | "ready" | "asking" | "unsupported" | "error">("idle");
  const [progress, setProgress] = useState({ value: 0, text: "" });
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const feed = useRef<HTMLDivElement>(null);

  async function loadModel() {
    setState("checking");
    setError("");
    let aiWorker: Worker | undefined;
    try {
      const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
      if (!gpu) {
        setState("unsupported");
        return;
      }
      const adapter = await gpu.requestAdapter();
      if (!adapter) {
        setState("unsupported");
        return;
      }
      setState("loading");
      const { CreateWebWorkerMLCEngine } = await import("@mlc-ai/web-llm");
      aiWorker = new Worker(new URL("./ai-water-advisor.worker.ts", import.meta.url), { type: "module" });
      const created = await CreateWebWorkerMLCEngine(aiWorker, MODEL_ID, {
        initProgressCallback: ({ progress: amount, text }) => setProgress({ value: amount, text }),
      });
      engine.current = created;
      setState("ready");
    } catch (cause) {
      aiWorker?.terminate();
      const details = cause instanceof Error ? cause.message : "unknown error";
      setError(`The on-device AI could not start (${details}). Check browser support, available memory, and your connection, then retry.`);
      setState("error");
    }
  }

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || !engine.current || state === "asking") return;
    setDraft("");
    setError("");
    const next: Message[] = [...messages, { role: "user", content: trimmed }, { role: "assistant", content: "" }];
    setMessages(next);
    setState("asking");
    requestAnimationFrame(() => feed.current?.scrollTo({ top: feed.current.scrollHeight, behavior: "smooth" }));

    const rainContext = inputs.rain.map((value, index) => `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][index]} ${value} mm`).join(", ");
    const system = `You are HydroLens Water Advisor, an AI assistant for rooftop rainwater planning. Reply clearly in simple English and keep answers under 140 words. Use only the current scenario numbers below. Explain tradeoffs and practical next steps. Do not make up weather observations, ML results, engineering specifications, prices, or safety guarantees. Be explicit that estimates are illustrative: monthly sample rainfall may be synthetic or user-entered; storm timing is synthetic; this app has no live weather connection or trained roof-detection model. Recommend a site professional for installation design. If asked to change a setting, explain which input the user can edit in HydroLens.
Current scenario: ${neighborhood}, ${city}. Roof area ${inputs.area} m²; ${inputs.people} occupants; ${inputs.dailyPerPerson} litres per person per day; tank ${inputs.tank} litres; runoff coefficient ${inputs.runoff}; collection efficiency ${(inputs.efficiency * 100).toFixed(0)}%; monthly rainfall: ${rainContext}. Estimated annual collection ${Math.round(annualCollection)} L. Simulated water supplied ${Math.round(waterSupplied)} L (${demandMet.toFixed(1)}% of demand); overflow ${Math.round(overflow)} L. Storage comparison suggestion: ${suggestedTank === null ? "not available with this rainfall" : `${suggestedTank} L, the smallest tested tank reaching 95% of the best supply among capacities 1,000–15,000 L`}.`;

    try {
      const history = next.slice(0, -1).slice(-6).map(({ role, content }) => ({ role, content }));
      const response = await engine.current.chat.completions.create({
        messages: [{ role: "system", content: system }, ...history],
        stream: true,
        temperature: 0.35,
        max_tokens: 220,
      });
      let answer = "";
      for await (const part of response) {
        answer += part.choices[0]?.delta?.content ?? "";
        setMessages((current) => current.map((message, index) => index === current.length - 1 ? { ...message, content: answer } : message));
        feed.current?.scrollTo({ top: feed.current.scrollHeight, behavior: "instant" });
      }
      setState("ready");
    } catch (cause) {
      setMessages((current) => current.slice(0, -1));
      setError(cause instanceof Error ? cause.message : "The model could not answer that. Please try once more.");
      setState("ready");
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(draft);
  }

  function resetChat() {
    setMessages([]);
    setError("");
    setState(engine.current ? "ready" : "idle");
  }

  const isBusy = state === "checking" || state === "loading" || state === "asking";

  return (
    <section className="ai-advisor" aria-labelledby="ai-advisor-title">
      <div className="ai-advisor-hero">
        <div className="ai-advisor-copy">
          <div className="ai-pill"><Sparkles size={14} /> LOCAL AI · WEBGPU</div>
          <h2 id="ai-advisor-title">Meet your water advisor.</h2>
          <p>Ask about your roof, rain and tank. Your live plan goes into the prompt, so answers are about this scenario.</p>
        </div>
        <div className="ai-orb" aria-hidden="true"><BrainCircuit size={36} strokeWidth={1.35} /><span /></div>
      </div>

      <div className="ai-workspace">
        <div className="ai-chat-panel">
          <header className="ai-chat-header">
            <span className={`ai-presence ${state === "ready" || state === "asking" ? "is-ready" : ""}`} />
            <div><strong>HydroLens AI</strong><small>{state === "ready" || state === "asking" ? "Built with Llama 3.2 · on-device" : "AI co-pilot for this plan"}</small></div>
            {messages.length > 0 && <button className="ai-reset" type="button" onClick={resetChat} disabled={isBusy} aria-label="Clear conversation"><RotateCcw size={16} /></button>}
          </header>

          <div ref={feed} className="ai-chat-feed" aria-live="polite" aria-label="Conversation with the HydroLens AI advisor">
            {messages.length === 0 ? (
              <div className="ai-welcome">
                <div className="ai-welcome-icon"><BrainCircuit size={23} /></div>
                <strong>Your plan, explained.</strong>
                <p>Load the open model once, then ask it anything about this rooftop scenario.</p>
                {STARTERS.map((prompt) => <button className="ai-starter" type="button" key={prompt} onClick={() => state === "ready" ? void ask(prompt) : setDraft(prompt)}>{prompt}<ArrowUp size={14} /></button>)}
              </div>
            ) : messages.map((message, index) => (
              <div key={`${index}-${message.role}`} className={`ai-message ${message.role}`}>
                {message.role === "assistant" && <span className="ai-message-mark"><Sparkles size={13} /></span>}
                <p>{message.content || (isBusy && index === messages.length - 1 ? <><LoaderCircle size={14} className="ai-spin" /> Thinking…</> : "")}</p>
              </div>
            ))}
            {error && <div className="ai-inline-error" role="status"><AlertCircle size={15} /><span>AI could not start: {error}</span><button type="button" onClick={() => void loadModel()}>Retry</button></div>}
          </div>

          {state === "loading" && (
            <div className="ai-progress" role="status" aria-live="polite">
              <div><span>{progress.text || "Preparing your private AI model…"}</span><strong>{Math.round(progress.value * 100)}%</strong></div>
              <div className="ai-progress-track"><span style={{ width: `${Math.max(3, Math.round(progress.value * 100))}%` }} /></div>
              <small>The first download is about 705 MB. Keep this tab open; the model is cached for future visits.</small>
            </div>
          )}

          {(state === "idle" || state === "unsupported" || state === "error") && (
            <div className="ai-load-card">
              <button className="button primary ai-load-button" type="button" onClick={() => void loadModel()} disabled={isBusy}>
                <BrainCircuit size={18} /> Load the AI model
              </button>
              <span>Free Llama 3.2 model · one-time ~705 MB download · WebGPU required</span>
              {state === "unsupported" && <p className="ai-hint"><AlertCircle size={14} /> This browser does not expose WebGPU. Try current Chrome or Edge on a compatible device.</p>}
            </div>
          )}

          {(state === "ready" || state === "asking") && (
            <form className="ai-compose" onSubmit={submit}>
              <label className="sr-only" htmlFor="ai-prompt">Ask the HydroLens AI advisor</label>
              <textarea id="ai-prompt" rows={2} maxLength={500} placeholder="Ask about this water plan…" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} disabled={state === "asking"} />
              <button className="ai-send" type="submit" disabled={state === "asking" || !draft.trim()} aria-label="Send message"><ArrowUp size={18} /></button>
            </form>
          )}
          <div className="ai-privacy"><LockKeyhole size={13} /> On-device inference. Your chat and plan are not sent to an AI server.</div>
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

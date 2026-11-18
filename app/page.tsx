"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CloudRain, Droplets, MapPin, MessageCircle, Ruler, Upload, X } from "lucide-react";
import { AIWaterAdvisor } from "@/components/ai-water-advisor";
import { DEFAULT_INPUTS, PROFILES, fmt, recommendStorage, simulate, type PlanningInputs } from "@/lib/hydrology";
import { assetPath } from "@/lib/assets";

const steps = ["Roof photo", "Roof size", "Your location", "Local rain", "Your plan"];

export default function Home() {
  const [step, setStep] = useState(0);
  const [inputs, setInputs] = useState<PlanningInputs>(DEFAULT_INPUTS);
  const [profileId, setProfileId] = useState<string>(PROFILES[0].id);
  const [roofImage, setRoofImage] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const profile = PROFILES.find((item) => item.id === profileId) ?? PROFILES[0];
  const results = useMemo(() => simulate(inputs), [inputs]);
  const storage = useMemo(() => recommendStorage(inputs), [inputs]);

  function updateArea(value: string) {
    const area = Number(value);
    if (Number.isFinite(area) && area >= 1 && area <= 100000) setInputs((current) => ({ ...current, area }));
  }

  function selectLocation(id: string) {
    const selected = PROFILES.find((item) => item.id === id);
    if (!selected) return;
    setProfileId(id);
    setInputs((current) => ({ ...current, rain: [...selected.rain] }));
  }

  function uploadImage(file?: File) {
    setUploadError("");
    if (!file) return;
    if (!( ["image/jpeg", "image/png", "image/webp"].includes(file.type)) || file.size > 8 * 1024 * 1024) {
      setUploadError("Choose a JPG, PNG or WebP image smaller than 8 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setRoofImage(String(reader.result));
    reader.onerror = () => setUploadError("We couldn’t open that image. Please try another one.");
    reader.readAsDataURL(file);
  }

  const canContinue = step !== 1 || (inputs.area >= 1 && inputs.area <= 100000);

  return (
    <div className="simple-app">
      <a className="simple-skip" href="#planner">Skip to the planner</a>
      <header className="simple-header">
        <a className="simple-brand" href="#top" id="top" aria-label="HydroLens home">
          <img src={assetPath("brandmark.svg")} alt="" width="40" height="40" />
          <span>HydroLens</span>
        </a>
        <span className="simple-header-note"><Droplets size={17} aria-hidden="true" /> A simple rainwater plan</span>
      </header>

      <main className="simple-main" id="planner">
        <section className="simple-intro" aria-labelledby="page-title">
          <p className="simple-kicker">ROOFTOP RAINWATER PLANNER</p>
          <h1 id="page-title">Plan your rainwater system.</h1>
          <p>Five small steps. A clear starting point for your home.</p>
        </section>

        <nav className="simple-progress" aria-label="Planner progress">
          {steps.map((label, index) => (
            <button type="button" key={label} className={`simple-progress-step ${index === step ? "is-current" : ""} ${index < step ? "is-done" : ""}`} aria-current={index === step ? "step" : undefined} onClick={() => index < step && setStep(index)} disabled={index > step}>
              <span className="simple-step-dot">{index < step ? <Check size={15} aria-hidden="true" /> : index + 1}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <section className="simple-card" aria-live="polite">
          <div className="simple-card-heading">
            <span className="simple-step-label">STEP {step + 1} OF 5</span>
            <span className="simple-step-count">{steps[step]}</span>
          </div>

          {step === 0 && <div className="simple-step-content">
            <div className="simple-icon"><Upload size={23} aria-hidden="true" /></div>
            <h2>Take a photo of your roof.</h2>
            <p>A clear picture helps you keep track of the roof you’re planning for. Your photo stays on this device.</p>
            <label className="simple-upload" htmlFor="roof-photo">
              {roofImage ? <img src={roofImage} alt="Preview of the roof photo you selected" /> : <><Upload size={22} aria-hidden="true" /><span>Choose a roof photo</span><small>JPG, PNG or WebP · up to 8 MB</small></>}
              <input id="roof-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadImage(event.target.files?.[0])} />
            </label>
            {uploadError && <p className="simple-error" role="alert">{uploadError}</p>}
            <p className="simple-note">No photo right now? You can continue without one.</p>
          </div>}

          {step === 1 && <div className="simple-step-content">
            <div className="simple-icon"><Ruler size={23} aria-hidden="true" /></div>
            <h2>How big is your roof?</h2>
            <p>Enter the roof area in square metres. A photo alone cannot measure it accurately.</p>
            <label className="simple-field" htmlFor="roof-area">Roof area <span>(square metres)</span>
              <div className="simple-input-wrap"><input id="roof-area" type="number" min="1" max="100000" step="0.1" inputMode="decimal" value={inputs.area} onChange={(event) => updateArea(event.target.value)} aria-describedby="area-help" /><span>m²</span></div>
            </label>
            <div className="hand-note" aria-hidden="true"><span>Type your measured roof area here</span><svg viewBox="0 0 120 48"><path d="M112 6C82 5 54 12 23 32M23 32l18-1M23 32l7-15" /></svg></div>
            <p id="area-help" className="simple-note">A rough estimate is okay to get started. You can update it later.</p>
          </div>}

          {step === 2 && <div className="simple-step-content">
            <div className="simple-icon"><MapPin size={23} aria-hidden="true" /></div>
            <h2>Where is the building?</h2>
            <p>Choose the closest sample location. This sets an example rainfall pattern for your estimate.</p>
            <label className="simple-field" htmlFor="location">Your nearest sample location
              <select id="location" value={profileId} onChange={(event) => selectLocation(event.target.value)}>
                {PROFILES.map((item) => <option value={item.id} key={item.id}>{item.city} — {item.neighborhood}</option>)}
              </select>
            </label>
            <div className="hand-note location-hand-note" aria-hidden="true"><span>Choose the nearest place</span><svg viewBox="0 0 120 48"><path d="M112 6C82 5 54 12 23 32M23 32l18-1M23 32l7-15" /></svg></div>
            <p className="simple-note">These are example profiles, not live local weather records.</p>
          </div>}

          {step === 3 && <div className="simple-step-content">
            <div className="simple-icon"><CloudRain size={23} aria-hidden="true" /></div>
            <h2>Here’s the example rainfall.</h2>
            <p>We’ll use this sample to estimate how much water your roof might collect.</p>
            <div className="rain-summary"><div className="rain-summary-icon"><CloudRain size={25} aria-hidden="true" /></div><div><span>Sample annual rainfall</span><strong>{fmt(inputs.rain.reduce((sum, month) => sum + month, 0))} mm</strong><small>{profile.city} · example data</small></div></div>
            <details className="simple-details"><summary>See rainfall by month</summary><div className="month-list">{inputs.rain.map((amount, index) => <span key={index}><b>{["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][index]}</b>{amount} mm</span>)}</div></details>
            <p className="simple-note">You can change your location by going back one step.</p>
          </div>}

          {step === 4 && <div className="simple-step-content simple-results">
            <div className="simple-icon"><Droplets size={23} aria-hidden="true" /></div>
            <h2>Your first rainwater estimate.</h2>
            <p>This is a planning estimate using your roof size and sample rainfall.</p>
            <div className="result-highlight"><span>Potential water collected in a sample year</span><strong>{fmt(results.annualHarvest)} <small>litres</small></strong></div>
            <div className="result-grid"><div><span>Roof area</span><strong>{fmt(inputs.area)} m²</strong></div><div><span>Example location</span><strong>{profile.city}</strong></div><div><span>Suggested tank size</span><strong>{storage.recommended ? `${fmt(storage.recommended.tank)} L` : "No estimate"}</strong></div><div><span>Water supplied in simulation</span><strong>{fmt(results.supplied)} L</strong></div></div>
            <p className="simple-disclaimer">Illustrative estimate only. Actual results depend on measured roof area, local rainfall, roof material, filtration and tank design. Ask a qualified installer before building.</p>
            <button className="simple-restart" type="button" onClick={() => setStep(0)}>Start again</button>
          </div>}

          <div className="simple-card-actions">
            {step > 0 && step < 5 && <button className="simple-back" type="button" onClick={() => setStep((current) => current - 1)}><ArrowLeft size={17} aria-hidden="true" /> Back</button>}
            {step < 4 && <button className="simple-next" type="button" onClick={() => setStep((current) => current + 1)} disabled={!canContinue}> {step === 3 ? "Show my estimate" : "Continue"} <ArrowRight size={17} aria-hidden="true" /></button>}
          </div>
        </section>
        <p className="simple-footer-note">Your plan is saved only for this visit. <a href="https://rithvik-7.github.io/HydroLens/" target="_blank" rel="noreferrer">About HydroLens</a></p>
      </main>

      <aside className={`chat-dock ${chatOpen ? "chat-dock-open" : ""}`} aria-label="HydroLens help chat">
        {chatOpen && <div className="chat-dock-panel" id="hydrolens-chat"><div className="chat-dock-top"><div><strong>Need a hand?</strong><span>Ask about any step.</span></div><button type="button" className="chat-close" onClick={() => setChatOpen(false)} aria-label="Close help chat"><X size={20} /></button></div>
          <AIWaterAdvisor inputs={inputs} city={profile.city} neighborhood={profile.neighborhood} annualCollection={results.annualHarvest} waterSupplied={results.supplied} overflow={results.overflow} demandMet={results.coverage} suggestedTank={storage.recommended?.tank ?? null} />
        </div>}
        <button className="chat-launcher" type="button" aria-expanded={chatOpen} aria-controls="hydrolens-chat" onClick={() => setChatOpen((open) => !open)}><MessageCircle size={20} aria-hidden="true" /><span>{chatOpen ? "Close help" : "Ask for help"}</span></button>
      </aside>
    </div>
  );
}

# HydroLens — 90-second demo

1. **Overview:** show the roof outline, annual collection potential, and actual demand supplied. Explain that collection and usable supply are different.
2. **Roof:** change the measured area from 186 m² to 250 m². Results update immediately. Edit an outline corner by dragging or using its keyboard/button controls. The outline scales an entered area; it does not measure an unscaled photograph.
3. **Rainfall:** compare Bengaluru and Chennai sample profiles. Open Field notes and change one monthly rainfall value. The app identifies the rainfall as user-entered.
4. **Storage:** show the sizing insight. It compares 29 capacities from 1,000 to 15,000 L and chooses the smallest achieving 95% of the maximum simulated supply. Compare 2,000, 5,000 and 10,000 L tanks; show overflow and demand coverage.
5. **Keep the plan:** export a printable HTML report and scenario JSON. Import the JSON to restore assumptions. Reload: numeric planning assumptions are saved on this device. Uploaded images remain session-only.
6. **Ask the AI:** open **AI water advisor** and choose **Explain my water balance**. Google Gemini answers using the scenario computed on the server. No GPU or model download is needed. Allow up to a minute for a sleeping free server to wake.

## Explain the engineering clearly

6. **Ask the AI:** open **AI water advisor** and choose **Explain my water balance**. Google Gemini answers using the scenario computed on the server. No GPU or model download is needed. Allow up to a minute for a sleeping free server to wake.

## Questions judges may ask

**Why not simply divide annual harvest by annual demand?**
Seasonality and overflow matter. A large annual total does not guarantee enough water on dry days. Daily tank simulation separates collected water from supply.

**How do you validate correctness?**
Tests check conservation of water, conversion from millimetres and square metres to litres, zero-rain cases, larger-tank monotonicity, minimum recommendation capacity, invalid imports, and crossed roof boundaries.

**What is the AI/ML roadmap?**
A trained segmentation model would require licensed georeferenced imagery, labeled roof boundaries, measured area ground truth, and evaluation on unseen buildings. Forecast-based planning would require independently verified historical weather and forecast evaluation. Neither capability is claimed in the current product.

**Why GitHub Pages?**
All implemented planning functions run in the browser. There are no required API keys, paid services, user accounts, databases, or server dependencies. The full source and deployment workflow are reviewable.

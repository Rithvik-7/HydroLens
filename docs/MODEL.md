# Planning model

## Collection

Monthly collection in litres = rainfall in mm × connected roof area in m² × runoff coefficient × collection efficiency.

One millimetre falling over one square metre is one litre. The default runoff coefficient is 0.85 for concrete; material coefficients are editable planning assumptions. Efficiency represents combined collection losses and first-flush diversion, not an engineered first-flush design.

## Storage simulation

The model uses a non-leap 365-day year, starting with an empty tank. Monthly rainfall is divided across evenly spread synthetic wet days: round(monthly rainfall / 12), bounded by the number of days in the month. On each day:

1. Add inflow.
2. Discard water above tank capacity as overflow.
3. Supply up to the stated daily demand from storage.
4. Record unmet demand and closing storage.

This makes timing explicit, but it is not observed weather, a forecast, or an estimate of storm probability. Annual conservation is collection = supplied + overflow + final storage. Coverage = supplied / annual demand × 100.

## Tank sizing

Evaluate 29 capacities: 1,000–15,000 L in 500 L increments. Choose the smallest capacity achieving at least 95% of the best annual supply within that range. No suggestion is returned when supply is zero. This is a transparent deterministic search, not a trained ML model, cost optimization, or proof of an economically ideal installation.

## Roof outlines and input data

An outline is a manually edited convex four-corner polygon. Crossed and degenerate boundaries are rejected. Changes scale the entered area by the ratio of polygon areas. Neither the generated sample image nor an arbitrary uploaded image has a calibrated ground scale. Use a measured roof area.

Profiles for Bengaluru, Pune, and Chennai are synthetic teaching examples. Replacing monthly values marks rainfall as user-entered; those values are not independently verified. A ±20% rainfall range is a sensitivity scenario, not a confidence interval.

## AI water advisor

The AI advisor uses Google Gemini 3.8 Flash through a Node.js API server on Render. The server validates inputs, recomputes water balance and tank comparisons, and supplies that context to the language model. Conversation text and numeric inputs are sent to Google; roof images are not. There is no local model download. AI explanations can be wrong and do not replace the deterministic calculations or a qualified site assessment. The planner has no live weather connection or trained roof detector.

## Limits

The product does not assess structural load, water quality, local approvals, installation costs, groundwater suitability, soil infiltration, gutter design, or exact first-flush volume. Site measurements and qualified installation assessment are required before implementation.

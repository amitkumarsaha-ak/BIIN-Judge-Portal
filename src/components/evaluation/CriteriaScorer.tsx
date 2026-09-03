import React, { useState, useEffect } from 'react';
import { Sparkles, Cpu, Layers, ShieldCheck, Presentation, Landmark } from 'lucide-react';
import type { CriteriaInfo } from '../../types';

interface CriteriaScorerProps {
  criteria: CriteriaInfo;
  score: number;
  onChangeScore: (score: number) => void;
  index: number;
}

export const CriteriaScorer: React.FC<CriteriaScorerProps> = ({
  criteria,
  score,
  onChangeScore,
  index
}) => {
  // Local string state to handle typing without automatic clamping or auto-filling to 10
  const [inputValue, setInputValue] = useState<string>(score ? score.toString() : '1');

  // Keep local input in sync if score changes externally (e.g. preset clicked or reset)
  useEffect(() => {
    const parsedCurrent = parseFloat(inputValue);
    if (isNaN(parsedCurrent) || parsedCurrent !== score) {
      setInputValue(score.toString());
    }
  }, [score]);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return Sparkles;
      case 'Cpu':
        return Cpu;
      case 'Layers':
        return Layers;
      case 'ShieldCheck':
        return ShieldCheck;
      case 'Landmark':
        return Landmark;
      case 'Presentation':
      default:
        return Presentation;
    }
  };

  const IconComponent = getIcon(criteria.iconName);

  const numVal = parseFloat(inputValue);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStr = e.target.value;

    // 1. Allow clearing the input box temporarily while typing
    if (newStr === '') {
      setInputValue('');
      return;
    }

    // 2. Allow trailing decimal point while typing e.g. "1.", "7.", "9.", "10."
    if (newStr.endsWith('.')) {
      const dotCount = (newStr.match(/\./g) || []).length;
      if (dotCount === 1) {
        const prefixStr = newStr.slice(0, -1);
        const prefixNum = parseFloat(prefixStr);
        if (!isNaN(prefixNum) && prefixNum >= 1 && prefixNum <= 10) {
          setInputValue(newStr);
          return;
        }
      }
      return; // Reject invalid dot placement
    }

    // 3. Parse float
    const parsed = parseFloat(newStr);

    // Reject non-numeric input
    if (isNaN(parsed)) {
      return;
    }

    // Strict Range Check: Reject any value < 1 (e.g. 0, 0.5, 0.99, -1)
    if (parsed < 1) {
      return;
    }

    // Strict Range Check: Reject any value > 10 (e.g. 10.01, 10.5, 11)
    if (parsed > 10) {
      return;
    }

    // Valid number within 1..10 range!
    setInputValue(newStr);
    onChangeScore(parsed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  };

  const handleBlur = () => {
    if (inputValue.trim() === '' || isNaN(numVal)) {
      setInputValue('1');
      onChangeScore(1);
      return;
    }

    if (numVal < 1) {
      setInputValue('1');
      onChangeScore(1);
    } else if (numVal > 10) {
      setInputValue('10');
      onChangeScore(10);
    } else {
      setInputValue(numVal.toString());
      onChangeScore(numVal);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setInputValue(val.toString());
    onChangeScore(val);
  };

  const handleSelectPreset = (val: number) => {
    setInputValue(val.toString());
    onChangeScore(val);
  };

  // Quick Score Presets 1 to 10
  const presetValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="glass-panel rounded-3xl p-6 border transition-all shadow-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700">
      
      {/* Title & Criteria Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-500/30 shrink-0">
            <IconComponent className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono">0{index + 1}.</span>
              <span>{criteria.label}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{criteria.description}</p>
          </div>
        </div>

        {/* Range Indicator */}
        <div className="flex items-center space-x-2 shrink-0 self-start sm:self-center">
          <span className="rounded-lg bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20">
            Scale: 1 to 10 (Decimals Allowed)
          </span>
        </div>
      </div>

      {/* Interactive Controls Box */}
      <div className="mt-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 p-4 border border-slate-200 dark:border-slate-800 space-y-4">
        
        {/* Slider & Input Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          
          {/* Slider */}
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1">
              <span>1.0 (Min)</span>
              <span>5.5</span>
              <span>10.0 (Max)</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.25"
              value={isNaN(numVal) ? 1 : Math.max(1, Math.min(10, numVal))}
              onChange={handleSliderChange}
              className="w-full accent-cyan-600 dark:accent-cyan-400 bg-slate-200 dark:bg-slate-800 rounded-lg h-2 cursor-pointer"
            />
          </div>

          {/* Manual Input Field */}
          <div className="flex items-center space-x-2 shrink-0">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Score:</label>
            <div className="relative flex items-center">
              <input
                type="text"
                inputMode="decimal"
                value={inputValue}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                placeholder="1 - 10"
                className="w-24 rounded-xl bg-white dark:bg-slate-950 px-3 py-2 text-center font-mono text-lg font-bold border border-indigo-300 dark:border-indigo-500/50 text-cyan-700 dark:text-cyan-300 focus:border-cyan-500 focus:outline-none transition-colors"
              />
              <span className="ml-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">/ 10</span>
            </div>
          </div>

        </div>

        {/* Quick Presets Buttons (1 to 10) */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500 block mb-2">
            Quick Score Presets (1 to 10):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {presetValues.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleSelectPreset(val)}
                className={`rounded-lg px-3 py-1 text-xs font-mono font-semibold transition-all ${
                  score === val
                    ? 'bg-cyan-600 text-white dark:bg-cyan-500 dark:text-slate-950 shadow-md shadow-cyan-500/30 scale-105'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-600 hover:text-white border border-slate-300 dark:border-slate-700/60'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

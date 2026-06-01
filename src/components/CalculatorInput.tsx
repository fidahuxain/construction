/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Calculator, X, Check } from 'lucide-react';

interface CalculatorInputProps {
  value: number | '';
  onChange: (val: number | '') => void;
  id?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  label?: string;
}

// Safely evaluate simple arithmetic expressions
function evaluateMathExpression(str: string): number | null {
  const sanitized = str.replace(/[^0-9+\-*/.()\s]/g, '');
  if (!sanitized.trim()) return null;
  
  try {
    if (/^[0-9+\-*/.()\s]+$/.test(sanitized)) {
      // Create a function block to safely run arithmetic computations only
      // eslint-disable-next-line no-new-func
      const fn = new Function(`return (${sanitized})`);
      const result = fn();
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return Number(result.toFixed(4)); // limit precision to 4 decimals
      }
    }
  } catch (e) {
    console.warn('Failed to evaluate express:', str, e);
  }
  return null;
}

export default function CalculatorInput({
  value,
  onChange,
  id,
  placeholder = 'e.g., 450 or 150 + 20',
  required = false,
  className = '',
  label,
}: CalculatorInputProps) {
  const [internalValue, setInternalValue] = useState<string>(value === '' ? '' : String(value));
  const [showCalc, setShowCalc] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState('');
  
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync internal UI text value when the outer standard props change
  useEffect(() => {
    setInternalValue(value === '' ? '' : String(value));
  }, [value]);

  // Click outside listener to dismiss the floating calculator popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowCalc(false);
      }
    }
    if (showCalc) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalc]);

  const handleBlur = () => {
    // Evaluate if expression is entered
    if (internalValue.trim()) {
      const evaluated = evaluateMathExpression(internalValue);
      if (evaluated !== null) {
        onChange(evaluated);
        setInternalValue(String(evaluated));
      } else {
        // Fallback or parse as number
        const num = Number(internalValue);
        if (!isNaN(num) && internalValue.trim() !== '') {
          onChange(num);
        } else {
          // Reset
          setInternalValue(value === '' ? '' : String(value));
        }
      }
    } else {
      onChange('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  const pressKey = (key: string) => {
    if (key === 'C') {
      setCalcDisplay('');
    } else if (key === '=') {
      const evaluated = evaluateMathExpression(calcDisplay);
      if (evaluated !== null) {
        setCalcDisplay(String(evaluated));
      }
    } else {
      setCalcDisplay(prev => prev + key);
    }
  };

  const applyCalcValue = () => {
    const evaluated = evaluateMathExpression(calcDisplay) ?? Number(calcDisplay);
    if (!isNaN(evaluated)) {
      onChange(evaluated);
      setInternalValue(String(evaluated));
    }
    setShowCalc(false);
  };

  return (
    <div className="relative w-full">
      {label && (
        <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">
          {label}
        </label>
      )}
      
      <div className="relative flex items-center">
        <input
          id={id}
          type="text"
          value={internalValue}
          onChange={(e) => setInternalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className={`w-full text-sm border border-slate-205 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 dark:text-white rounded-xl p-3 pr-10 focus:ring-orange-500 focus:border-orange-500 outline-none ${className}`}
        />
        
        <button
          type="button"
          onClick={() => {
            setCalcDisplay(internalValue);
            setShowCalc(!showCalc);
          }}
          className="absolute right-2.5 p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-550 rounded-lg cursor-pointer transition-colors"
          title="Open interactive calculator"
        >
          <Calculator className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Calculator Popover HUD */}
      {showCalc && (
        <div
          ref={popoverRef}
          className="absolute z-60 right-0 mt-2 bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-xl p-4 w-60 space-y-3 animate-fade-in"
        >
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Calculator className="w-3.5 h-3.5 text-orange-500" /> Math Calculator
            </span>
            <button
              type="button"
              onClick={() => setShowCalc(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Calculator Screen Display */}
          <div className="p-3 bg-slate-950 rounded-xl min-h-11 flex justify-end items-center text-right font-mono text-base font-extrabold text-white overflow-x-auto select-all border border-slate-850">
            {calcDisplay || '0'}
          </div>

          {/* Keypad Grid */}
          <div className="grid grid-cols-4 gap-1.5">
            {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', 'C', '+'].map((key) => {
              const cmdStyle = key === 'C' 
                ? 'bg-rose-600/20 text-rose-455 border-rose-500/10 hover:bg-rose-600/30' 
                : ['+', '-', '*', '/'].includes(key)
                ? 'bg-orange-550/10 text-orange-400 border-orange-500/10 hover:bg-orange-550/20'
                : 'bg-slate-800 text-slate-200 border-slate-700/50 hover:bg-slate-750';
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => pressKey(key)}
                  className={`py-2 text-xs font-bold border rounded-xl active:scale-95 transition-all text-center cursor-pointer ${cmdStyle}`}
                >
                  {key}
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => pressKey('=')}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl active:scale-95 transition-all border border-slate-700 cursor-pointer"
            >
              = Equals
            </button>
            <button
              type="button"
              onClick={applyCalcValue}
              className="py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold rounded-xl active:scale-[0.97] transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <Check className="w-4 h-4" /> Use Value
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

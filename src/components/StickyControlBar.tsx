import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Play, Pause, RotateCcw, Cloud, CloudOff, Gauge } from "lucide-react";
import { useSimulationStore } from "@/stores/simulationStore";

interface StickyControlBarProps {
  isRunning: boolean;
  onToggleSimulation: () => void;
  onReset: () => void;
  setSimulationSpeed: (speed: number) => void;
  onSaveSimulation?: (name: string, folder?: string) => void;
  canSave?: boolean;
  userId?: string | null;
}

const SPEED_OPTIONS = [0.5, 1, 2, 4, 16, 32, 64];

const StickyControlBar: React.FC<StickyControlBarProps> = ({
  isRunning,
  onToggleSimulation,
  onReset,
  setSimulationSpeed,
  onSaveSimulation,
  canSave = false,
  userId,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const currentSpeed = useSimulationStore((s) => s.simulationSpeed);

  return (
    <div className="sticky top-2 left-0 right-0 z-50 px-4 pointer-events-none">
      <div className="flex justify-center">
        <div className="w-full max-w-3xl pointer-events-auto">
          <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xl rounded-2xl p-2.5 transition-all duration-200">
            {/* Header row / Collapse trigger */}
            <div className="flex items-center justify-between px-2 pb-1.5 border-b border-slate-100 dark:border-slate-800 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${isRunning ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {isRunning ? "Simulation Running" : "Simulation Paused"}
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-500 font-mono text-[11px] flex items-center gap-1">
                  <Gauge className="w-3 h-3 inline text-slate-400" />
                  {currentSpeed}x Speed
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors py-0.5 px-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {isCollapsed ? (
                  <>
                    <ChevronDown size={14} />
                    <span>Expand</span>
                  </>
                ) : (
                  <>
                    <ChevronUp size={14} />
                    <span>Collapse</span>
                  </>
                )}
              </button>
            </div>

            {!isCollapsed && (
              <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-3 pt-2">
                {/* Playback Controls */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    onClick={onToggleSimulation}
                    size="sm"
                    className={`h-9 px-4 font-medium transition-all ${
                      isRunning
                        ? "bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                    }`}
                  >
                    {isRunning ? (
                      <>
                        <Pause size={15} className="mr-1.5" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play size={15} className="mr-1.5 fill-current" />
                        Start
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={onReset}
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 text-slate-600 dark:text-slate-300 hover:text-slate-900 border-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <RotateCcw size={14} className="mr-1.5" />
                    Reset
                  </Button>
                </div>

                {/* Speed Multiplier Segmented Selector */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700 overflow-x-auto">
                  {SPEED_OPTIONS.map((speed) => {
                    const isActive = currentSpeed === speed;
                    return (
                      <button
                        key={speed}
                        type="button"
                        onClick={() => setSimulationSpeed(speed)}
                        className={`text-xs font-medium px-2.5 py-1.5 rounded-md transition-all ${
                          isActive
                            ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-semibold"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/50"
                        }`}
                      >
                        {speed}x
                      </button>
                    );
                  })}
                </div>

                {/* Save Simulation Action */}
                <div className="flex items-center ml-auto">
                  <Button
                    onClick={onSaveSimulation ? () => onSaveSimulation("default", undefined) : undefined}
                    variant="outline"
                    size="sm"
                    className="h-9 px-3.5 flex items-center gap-1.5 text-xs font-medium border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    disabled={!canSave}
                  >
                    {userId ? (
                      <>
                        <Cloud size={14} className="text-blue-500" />
                        <span>Save Run</span>
                      </>
                    ) : (
                      <>
                        <CloudOff size={14} className="text-slate-400" />
                        <span>Sign In to Save</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickyControlBar;

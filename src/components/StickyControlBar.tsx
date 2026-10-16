import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  RotateCcw,
  Cloud,
  CloudOff,
  StepForward,
  StepBack,
  Film,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useSimulationStore } from "@/stores/simulationStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StickyControlBarProps {
  isRunning: boolean;
  onToggleSimulation: () => void;
  onStepTick?: (dt?: number) => void;
  onStepBack?: (dt?: number) => void;
  canStepBack?: boolean;
  onReset: () => void;
  setSimulationSpeed: (speed: number) => void;
  onSaveSimulation?: (name: string, folder?: string) => void;
  onOpenReplay?: () => void;
  canReplay?: boolean;
  canSave?: boolean;
  userId?: string | null;
}

const SPEED_OPTIONS = [0.5, 1, 2, 4, 16, 64];
const STEP_OPTIONS = [0.1, 0.5, 1.0, 2.0];

const StickyControlBar: React.FC<StickyControlBarProps> = ({
  isRunning,
  onToggleSimulation,
  onStepTick,
  onStepBack,
  canStepBack = false,
  onReset,
  setSimulationSpeed,
  onSaveSimulation,
  onOpenReplay,
  canReplay = false,
  canSave = false,
  userId,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [stepSize, setStepSize] = useState<number>(0.5);

  const currentSpeed = useSimulationStore((s) => s.simulationSpeed);
  const elapsedTime = useSimulationStore((s) => s.elapsedTime);

  return (
    <div className="sticky top-2 left-0 right-0 z-50 px-4 pointer-events-none">
      <div className="flex justify-center">
        <div className="w-full max-w-4xl pointer-events-auto">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xl rounded-2xl p-2 transition-all duration-200">
            {isCollapsed ? (
              /* Collapsed Minimalist Badge */
              <div className="flex items-center justify-between gap-3 px-2 py-0.5">
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      isRunning ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
                    }`}
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {isRunning ? "Running" : "Paused"}
                  </span>
                  <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                    {elapsedTime.toFixed(1)}s
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-blue-600 dark:text-blue-400 font-mono text-[11px] font-semibold">
                    {currentSpeed}x
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    onClick={onToggleSimulation}
                    size="sm"
                    className={`h-7 px-3 text-xs font-medium rounded-lg ${
                      isRunning
                        ? "bg-amber-500 hover:bg-amber-600 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {isRunning ? "Pause" : "Resume"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(false)}
                    className="h-7 w-7 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
                    title="Expand controls"
                  >
                    <ChevronDown size={14} />
                  </Button>
                </div>
              </div>
            ) : (
              /* Expanded Unified Control Bar */
              <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-2.5">
                {/* 1. Left: Unified Playback Transport */}
                <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex-shrink-0">
                  {/* Reset */}
                  <Button
                    onClick={onReset}
                    variant="ghost"
                    size="icon"
                    title="Reset Simulation"
                    className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-700 rounded-lg"
                  >
                    <RotateCcw size={14} />
                  </Button>

                  <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

                  {/* Step Back */}
                  {onStepBack && (
                    <Button
                      onClick={() => onStepBack(stepSize)}
                      disabled={!canStepBack}
                      variant="ghost"
                      size="icon"
                      title={`Step backward (-${stepSize}s)`}
                      className="h-8 w-8 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 rounded-lg"
                    >
                      <StepBack size={14} />
                    </Button>
                  )}

                  {/* Play / Pause Hero Button */}
                  <Button
                    onClick={onToggleSimulation}
                    size="sm"
                    className={`h-8 px-3.5 font-medium rounded-lg transition-all shadow-sm ${
                      isRunning
                        ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                    }`}
                  >
                    {isRunning ? (
                      <>
                        <Pause size={14} className="mr-1.5 fill-current" />
                        <span className="text-xs">Pause</span>
                      </>
                    ) : (
                      <>
                        <Play size={14} className="mr-1.5 fill-current" />
                        <span className="text-xs">Start</span>
                      </>
                    )}
                  </Button>

                  {/* Step Forward */}
                  {onStepTick && (
                    <Button
                      onClick={() => onStepTick(stepSize)}
                      variant="ghost"
                      size="icon"
                      title={`Step forward (+${stepSize}s)`}
                      className="h-8 w-8 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg"
                    >
                      <StepForward size={14} />
                    </Button>
                  )}

                  {/* Step Size Selector Pill */}
                  {(onStepBack || onStepTick) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          title="Change step duration"
                          className="flex items-center gap-0.5 px-1.5 py-1 text-[11px] font-mono font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
                        >
                          <span>±{stepSize}s</span>
                          <ChevronDown size={11} className="opacity-60" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="min-w-[130px]">
                        {STEP_OPTIONS.map((s) => (
                          <DropdownMenuItem
                            key={s}
                            onClick={() => setStepSize(s)}
                            className={`text-xs font-mono flex items-center justify-between cursor-pointer ${
                              stepSize === s
                                ? "font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40"
                                : ""
                            }`}
                          >
                            <span>±{s}s</span>
                            {stepSize === s && (
                              <span className="text-[10px] text-blue-500 font-sans font-semibold">Active</span>
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* 2. Middle: Live Time & Running Indicator */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isRunning ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
                    }`}
                  />
                  <span className="font-sans font-medium text-slate-700 dark:text-slate-200">
                    {isRunning ? "Running" : "Paused"}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <span className="text-slate-600 dark:text-slate-300 font-mono font-medium">
                    {elapsedTime.toFixed(1)}s
                  </span>
                </div>

                {/* 3. Center-Right: Speed Multiplier */}
                <div className="flex items-center bg-slate-100/80 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                  {SPEED_OPTIONS.map((speed) => {
                    const isActive = currentSpeed === speed;
                    return (
                      <button
                        key={speed}
                        type="button"
                        onClick={() => setSimulationSpeed(speed)}
                        className={`text-xs font-medium px-2 py-1 rounded-lg transition-all ${
                          isActive
                            ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-semibold"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/40"
                        }`}
                      >
                        {speed}x
                      </button>
                    );
                  })}
                </div>

                {/* 4. Right: Quick Actions (Replay, Save, Collapse) */}
                <div className="flex items-center gap-1.5 ml-auto">
                  {onOpenReplay && (
                    <Button
                      onClick={onOpenReplay}
                      variant="outline"
                      size="sm"
                      title="Open in-memory VCR Replay for the current simulation run"
                      disabled={!canReplay}
                      className="h-8 px-2.5 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-1.5 text-xs font-medium rounded-lg"
                    >
                      <Film size={13} />
                      <span className="hidden sm:inline">VCR Replay</span>
                    </Button>
                  )}

                  {onSaveSimulation && (
                    <Button
                      onClick={() => onSaveSimulation("default", undefined)}
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 flex items-center gap-1.5 text-xs font-medium border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
                      disabled={!canSave}
                      title={canSave ? "Save simulation run" : "Run simulation to save"}
                    >
                      {userId ? (
                        <>
                          <Cloud size={13} className="text-blue-500" />
                          <span className="hidden sm:inline">Save</span>
                        </>
                      ) : (
                        <>
                          <CloudOff size={13} className="text-slate-400" />
                          <span className="hidden sm:inline">Sign In</span>
                        </>
                      )}
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(true)}
                    className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
                    title="Minimize control bar"
                  >
                    <ChevronUp size={14} />
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

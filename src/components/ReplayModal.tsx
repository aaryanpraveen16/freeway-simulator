import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  Eye,
  Gauge,
  Users,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";
import { SavedSimulation } from "@/services/simulationService";
import { interpolateReplayFrame } from "@/utils/replayInterpolation";
import { Car, Pack, identifyPacks } from "@/utils/trafficSimulation";
import { WebGLCarRenderer } from "./WebGLCarRenderer";
import TrafficHeatStrip from "./TrafficHeatStrip";
import { UnitSystem, getUnitConversions } from "@/utils/unitConversion";

interface ReplayModalProps {
  simulation: SavedSimulation | null;
  isOpen: boolean;
  onClose: () => void;
  unitSystem?: UnitSystem;
}

export const ReplayModal: React.FC<ReplayModalProps> = ({
  simulation,
  isOpen,
  onClose,
  unitSystem = "metric",
}) => {
  const replay = simulation?.replay;
  const duration = replay?.totalDuration || simulation?.duration || 0;
  const freewayLength = simulation?.params?.freewayLength || 5;
  const numLanes = simulation?.params?.numLanes || 2;
  const conversions = getUnitConversions(unitSystem);

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [cars, setCars] = useState<Car[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState<number>(1000);
  const animFrameRef = useRef<number | null>(null);
  const lastRealTimeRef = useRef<number | null>(null);

  // Resize listener
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setTrackWidth(containerRef.current.offsetWidth);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  // Reset when dialog opens with a new simulation
  useEffect(() => {
    if (isOpen) {
      setCurrentTime(0);
      setIsPlaying(true);
      lastRealTimeRef.current = null;
    } else {
      setIsPlaying(false);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
  }, [isOpen, simulation?.id]);

  // Update cars & packs for currentTime
  useEffect(() => {
    if (!replay || !replay.frames || replay.frames.length === 0) {
      setCars([]);
      setPacks([]);
      return;
    }

    const reconstructedCars = interpolateReplayFrame(replay, currentTime, freewayLength);
    setCars(reconstructedCars);

    const identified = identifyPacks(reconstructedCars, freewayLength, simulation?.params?.tDist || 1.5);
    setPacks(identified);
  }, [replay, currentTime, freewayLength, simulation?.params?.tDist]);

  // Main playback animation loop
  const loop = useCallback(
    (realNow: number) => {
      if (lastRealTimeRef.current === null) {
        lastRealTimeRef.current = realNow;
      }
      const dtReal = (realNow - lastRealTimeRef.current) / 1000;
      lastRealTimeRef.current = realNow;

      if (isPlaying && duration > 0) {
        setCurrentTime((prev) => {
          const next = prev + dtReal * playbackSpeed;
          if (next >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return next;
        });
      }

      if (isPlaying) {
        animFrameRef.current = requestAnimationFrame(loop);
      }
    },
    [isPlaying, duration, playbackSpeed]
  );

  useEffect(() => {
    if (isPlaying) {
      lastRealTimeRef.current = null;
      animFrameRef.current = requestAnimationFrame(loop);
    } else if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, loop]);

  if (!simulation) return null;

  const hasReplayData = !!(replay && replay.frames && replay.frames.length > 0);

  // Stats for the current frame
  const currentAvgSpeed =
    cars.length > 0 ? cars.reduce((acc, c) => acc + c.speed, 0) / cars.length : 0;
  const currentDensity = freewayLength > 0 ? cars.length / freewayLength : 0;

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${mins}:${s < 10 ? "0" : ""}${s}.${ms}`;
  };

  const speedMultiplierButtons = [0.5, 1, 2, 4];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-950 border-slate-800 text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800/80 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Sparkles size={16} />
              </span>
              <DialogTitle className="text-xl font-bold text-slate-100">
                VCR Replay: {simulation.name}
              </DialogTitle>
              <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-slate-700">
                #{simulation.simulationNumber}
              </Badge>
              <Badge variant="outline" className="border-indigo-500/40 text-indigo-300 capitalize">
                {simulation.trafficRule} Rule
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Deterministic Trajectory Player • {numLanes} Lanes • {freewayLength} km Track
            </p>
          </div>

          {/* Quick HUD Metrics */}
          {hasReplayData && (
            <div className="flex items-center gap-3 text-xs bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-1.5">
              <div className="flex items-center gap-1.5 text-blue-400">
                <Users size={14} />
                <span>{cars.length} cars</span>
              </div>
              <div className="h-3 w-px bg-slate-800" />
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Gauge size={14} />
                <span>
                  {conversions.speed.toDisplay(currentAvgSpeed).toFixed(1)} {conversions.speed.unit}
                </span>
              </div>
              <div className="h-3 w-px bg-slate-800" />
              <div className="flex items-center gap-1.5 text-purple-400">
                <Layers size={14} />
                <span>
                  {conversions.density.toDisplay(currentDensity).toFixed(1)} {conversions.density.unit}
                </span>
              </div>
              <div className="h-3 w-px bg-slate-800" />
              <div className="flex items-center gap-1.5 text-amber-400">
                <Activity size={14} />
                <span>{packs.length} packs</span>
              </div>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {!hasReplayData ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <div className="p-4 rounded-full bg-slate-900 border border-slate-800 text-slate-500">
                <RotateCcw size={32} />
              </div>
              <h3 className="text-lg font-medium text-slate-200">No Trajectory Recording Available</h3>
              <p className="text-sm text-slate-400 max-w-md">
                This simulation was saved before trajectory recording was enabled, or was imported from a legacy format. Run a new simulation to generate full replay trajectories!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Traffic Heatstrip for road congestion visualization */}
              <div className="rounded-lg overflow-hidden border border-slate-800/80 bg-slate-900/40 p-2">
                <TrafficHeatStrip
                  cars={cars}
                  laneLength={freewayLength}
                  numLanes={numLanes}
                  unitSystem={unitSystem}
                />
              </div>

              {/* WebGL Highway Canvas View */}
              <div
                ref={containerRef}
                className="relative rounded-xl border border-slate-800 bg-slate-900/70 p-4 overflow-hidden shadow-inner flex flex-col justify-center"
                style={{ minHeight: `${numLanes * 80 + 32}px` }}
              >
                <div className="absolute top-2 left-3 z-10 flex items-center gap-2 pointer-events-none">
                  <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
                    Straight Highway • PixiJS WebGL
                  </span>
                </div>
                <WebGLCarRenderer
                  cars={cars}
                  packs={packs}
                  laneLength={freewayLength}
                  width={trackWidth > 50 ? trackWidth - 32 : 900}
                  height={numLanes * 80}
                  trackType="straight"
                  laneHeight={80}
                  laneCenterOffset={40}
                  trackPadding={0}
                  carSize={24}
                  unitSystem={unitSystem}
                  stoppedCars={new Set()}
                  currentTime={currentTime}
                />
              </div>
            </div>
          )}
        </div>

        {/* VCR Control Bar Footer */}
        {hasReplayData && (
          <div className="border-t border-slate-800 bg-slate-900/80 p-4 sm:p-5 space-y-3">
            {/* Scrubber Timeline */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>{formatSeconds(currentTime)}</span>
                <span className="text-slate-500">
                  {Math.round((currentTime / (duration || 1)) * 100)}%
                </span>
                <span>{formatSeconds(duration)}</span>
              </div>
              <Slider
                value={[currentTime]}
                min={0}
                max={duration || 1}
                step={0.05}
                onValueChange={(val) => {
                  setCurrentTime(val[0]);
                  lastRealTimeRef.current = null;
                }}
                className="cursor-pointer py-1"
              />
            </div>

            {/* Playback Button Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {/* Play / Pause / Reset / Skip */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-200"
                  onClick={() => {
                    setCurrentTime((t) => Math.max(0, t - 5));
                    lastRealTimeRef.current = null;
                  }}
                  title="Rewind 5s"
                >
                  <Rewind size={16} />
                </Button>

                <Button
                  variant="default"
                  size="icon"
                  className="h-10 w-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-600/30"
                  onClick={() => {
                    if (currentTime >= duration) {
                      setCurrentTime(0);
                      setIsPlaying(true);
                    } else {
                      setIsPlaying(!isPlaying);
                    }
                    lastRealTimeRef.current = null;
                  }}
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-200"
                  onClick={() => {
                    setCurrentTime((t) => Math.min(duration, t + 5));
                    lastRealTimeRef.current = null;
                  }}
                  title="Forward 5s"
                >
                  <FastForward size={16} />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-slate-400 hover:text-slate-200"
                  onClick={() => {
                    setCurrentTime(0);
                    setIsPlaying(true);
                    lastRealTimeRef.current = null;
                  }}
                  title="Restart Replay"
                >
                  <RotateCcw size={16} />
                </Button>
              </div>

              {/* Speed Multiplier Pills */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-lg">
                <span className="text-[11px] font-semibold text-slate-400 px-2 uppercase tracking-wide">
                  Speed
                </span>
                {speedMultiplierButtons.map((speed) => (
                  <Button
                    key={speed}
                    variant="ghost"
                    size="sm"
                    className={`h-7 px-2.5 text-xs font-mono rounded-md transition-all ${
                      playbackSpeed === speed
                        ? "bg-indigo-600 text-white font-bold shadow-sm"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    }`}
                    onClick={() => {
                      setPlaybackSpeed(speed);
                      lastRealTimeRef.current = null;
                    }}
                  >
                    {speed}x
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReplayModal;

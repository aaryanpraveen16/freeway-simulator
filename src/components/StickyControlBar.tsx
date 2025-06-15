
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pause, Play, RotateCcw } from "lucide-react";

interface StickyControlBarProps {
  isRunning: boolean;
  onToggleSimulation: () => void;
  onReset: () => void;
  setSimulationSpeed: (speed: number) => void;
}

const StickyControlBar: React.FC<StickyControlBarProps> = ({
  isRunning,
  onToggleSimulation,
  onReset,
  setSimulationSpeed,
}) => {
  return (
    <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={onToggleSimulation}
                variant={isRunning ? "destructive" : "default"}
                className="flex-1 flex items-center gap-2"
              >
                {isRunning ? (
                  <>
                    <Pause size={16} />
                    Pause
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Start
                  </>
                )}
              </Button>
              
              <Button
                onClick={onReset}
                variant="outline"
                className="flex-1 flex items-center gap-2"
              >
                <RotateCcw size={16} />
                Reset
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setSimulationSpeed(0.5)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                0.5x
              </Button>
              <Button
                onClick={() => setSimulationSpeed(1)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                1x
              </Button>
              <Button
                onClick={() => setSimulationSpeed(2)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                2x
              </Button>
              <Button
                onClick={() => setSimulationSpeed(4)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                4x
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StickyControlBar;


import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Pause, Play, RotateCcw, Archive } from "lucide-react";
import { Link } from "react-router-dom";

interface StickyControlBarProps {
  isRunning: boolean;
  onToggleSimulation: () => void;
  onReset: () => void;
  setSimulationSpeed: (speed: number) => void;
  showPackFormation: boolean;
  onTogglePackFormation: (show: boolean) => void;
}

const StickyControlBar: React.FC<StickyControlBarProps> = ({
  isRunning,
  onToggleSimulation,
  onReset,
  setSimulationSpeed,
  showPackFormation,
  onTogglePackFormation,
}) => {
  return (
    <div className="sticky top-0 left-1/2 -translate-x-1/2 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm max-w-2xl">
      <div className="mx-auto px-4 py-3 max-w-2xl">
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

            <div className="flex gap-2">
              <Link to="/saved-simulations" className="flex-1">
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Archive size={16} />
                  View Saved
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2 border-t">
              <Label htmlFor="pack-formation-toggle" className="text-sm">
                Show Pack Information
              </Label>
              <Switch
                id="pack-formation-toggle"
                checked={showPackFormation}
                onCheckedChange={onTogglePackFormation}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StickyControlBar;

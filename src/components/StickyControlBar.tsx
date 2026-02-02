
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Play, Pause, RotateCcw, Save } from "lucide-react";

interface StickyControlBarProps {
  isRunning: boolean;
  onToggleSimulation: () => void;
  onReset: () => void;
  setSimulationSpeed: (speed: number) => void;
  onSaveSimulation?: (name: string, folder?: string) => void;
  canSave?: boolean;
  userId?: string | null;
}

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

  return (
    <div className="sticky top-0 left-0 right-0 z-50">
      <div className="flex justify-center">
        <div className="w-full max-w-2xl px-4 py-1">
          <Card>
            <CardContent className="p-2">
              <div
                className="flex items-center justify-center cursor-pointer py-1 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                {isCollapsed ? (
                  <>
                    <ChevronDown size={16} className="mr-1" />
                    Show Controls
                  </>
                ) : (
                  <>
                    <ChevronUp size={16} className="mr-1" />
                    Hide Controls
                  </>
                )}
              </div>
              {!isCollapsed && (
                <div className="space-y-4 mt-2">
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
                    <Button
                      onClick={() => setSimulationSpeed(8)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      8x
                    </Button>
                  </div>

                  <div className="pt-2 border-t">
                    <Button
                      onClick={onSaveSimulation ? () => onSaveSimulation("default", undefined) : undefined}
                      variant="secondary"
                      size="sm"
                      className="w-full flex items-center justify-center gap-2"
                      disabled={!canSave}
                    >
                      {userId ? <Save size={16} /> : <div className="relative"><Save size={16} className="opacity-50" /><div className="absolute -top-1 -right-1 bg-destructive rounded-full w-2 h-2" /></div>}
                      {userId ? "Save to Cloud" : "Sign In to Save"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StickyControlBar;

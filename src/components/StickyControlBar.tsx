
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Pause, Play, RotateCcw, Save, Archive, ChevronUp, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import SaveSimulationDialog from "./SaveSimulationDialog";

interface StickyControlBarProps {
  isRunning: boolean;
  onToggleSimulation: () => void;
  onReset: () => void;
  setSimulationSpeed: (speed: number) => void;
  showPackFormation: boolean;
  onTogglePackFormation: (show: boolean) => void;
  onSaveSimulation?: (name: string) => void;
  canSave?: boolean;
}

const StickyControlBar: React.FC<StickyControlBarProps> = ({
  isRunning,
  onToggleSimulation,
  onReset,
  setSimulationSpeed,
  showPackFormation,
  onTogglePackFormation,
  onSaveSimulation,
  canSave = false,
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

                  <div className="flex gap-2">
                    {onSaveSimulation && (
                      <SaveSimulationDialog
                        onSave={onSaveSimulation}
                        canSave={canSave}
                      />
                    )}
                    
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

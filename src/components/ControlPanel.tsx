
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Pause, Play, RotateCcw, StopCircle, Car } from "lucide-react";
import { SimulationParams, Car as CarType } from "@/utils/trafficSimulation";

interface ControlPanelProps {
  isRunning: boolean;
  onToggleSimulation: () => void;
  onReset: () => void;
  params: SimulationParams;
  onUpdateParams: (params: Partial<SimulationParams>) => void;
  setSimulationSpeed: (speed: number) => void;
  trafficRule: 'american' | 'european';
  onTrafficRuleChange: (rule: 'american' | 'european') => void;
  cars: CarType[];
  onStopCar: (carId: number) => void;
  onResumeCar: (carId: number) => void;
  stoppedCars: Set<number>;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  isRunning,
  onToggleSimulation,
  onReset,
  params,
  onUpdateParams,
  setSimulationSpeed,
  trafficRule,
  onTrafficRuleChange,
  cars,
  onStopCar,
  onResumeCar,
  stoppedCars
}) => {
  const handleTrafficDensityChange = (laneIndex: number, value: string) => {
    const newDensity = [...params.trafficDensity];
    newDensity[laneIndex] = parseFloat(value) || 0;
    onUpdateParams({ trafficDensity: newDensity });
  };

  const addLane = () => {
    if (params.numLanes < 6) {
      const newDensity = [...params.trafficDensity];
      newDensity.push(3); // Default density for new lane
      onUpdateParams({ 
        numLanes: params.numLanes + 1,
        trafficDensity: newDensity
      });
    }
  };

  const removeLane = () => {
    if (params.numLanes > 1) {
      const newDensity = params.trafficDensity.slice(0, -1);
      onUpdateParams({ 
        numLanes: params.numLanes - 1,
        trafficDensity: newDensity
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Control Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Controls */}
        <div className="space-y-3">
          <Button
            onClick={onToggleSimulation}
            variant={isRunning ? "destructive" : "default"}
            className="w-full flex items-center gap-2"
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
            className="w-full flex items-center gap-2"
          >
            <RotateCcw size={16} />
            Reset
          </Button>
        </div>

        <Separator />

        {/* Car Control Section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Car size={16} />
            Car Control
          </Label>
          
          {cars.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Click to stop/resume cars:
              </Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {cars.slice(0, 10).map((car) => {
                  const isStopped = stoppedCars.has(car.id);
                  return (
                    <Button
                      key={car.id}
                      variant={isStopped ? "destructive" : "outline"}
                      size="sm"
                      className="text-xs"
                      onClick={() => isStopped ? onResumeCar(car.id) : onStopCar(car.id)}
                    >
                      {isStopped ? (
                        <>
                          <StopCircle size={12} className="mr-1" />
                          Resume {car.name}
                        </>
                      ) : (
                        <>
                          <Car size={12} className="mr-1" />
                          Stop {car.name}
                        </>
                      )}
                    </Button>
                  );
                })}
              </div>
              {cars.length > 10 && (
                <p className="text-xs text-muted-foreground">
                  Showing first 10 cars only
                </p>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Traffic Rule */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Traffic Rule</Label>
          <Select value={trafficRule} onValueChange={(value: 'american' | 'european') => onTrafficRuleChange(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="american">American (Left Lane Passing)</SelectItem>
              <SelectItem value="european">European (Right Lane Passing)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lane Configuration */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Number of Lanes</Label>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={removeLane}
                disabled={params.numLanes <= 1}
              >
                -
              </Button>
              <span className="w-8 text-center">{params.numLanes}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={addLane}
                disabled={params.numLanes >= 6}
              >
                +
              </Button>
            </div>
          </div>
          
          {/* Traffic Density per Lane */}
          <div className="space-y-2">
            <Label className="text-sm">Traffic Density (cars/mile/lane)</Label>
            {Array.from({ length: params.numLanes }, (_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Label className="text-xs w-16">Lane {i + 1}:</Label>
                <Input
                  type="number"
                  value={params.trafficDensity[i] || 3}
                  onChange={(e) => handleTrafficDensityChange(i, e.target.value)}
                  className="flex-1"
                  min="0"
                  max="20"
                  step="0.5"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Speed Settings */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Speed Settings</Label>
          
          <div className="space-y-2">
            <Label className="text-xs">Mean Speed: {params.meanSpeed} mph</Label>
            <Slider
              value={[params.meanSpeed]}
              onValueChange={([value]) => onUpdateParams({ meanSpeed: value })}
              min={30}
              max={80}
              step={5}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs">Speed Limit: {params.speedLimit} mph</Label>
            <Slider
              value={[params.speedLimit]}
              onValueChange={([value]) => onUpdateParams({ speedLimit: value })}
              min={50}
              max={90}
              step={5}
              className="w-full"
            />
          </div>
        </div>

        {/* Simulation Speed */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Simulation Speed</Label>
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
        </div>

        {/* Advanced Parameters */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Advanced Parameters</Label>
          
          <div className="space-y-2">
            <Label className="text-xs">Freeway Length: {params.freewayLength} miles</Label>
            <Slider
              value={[params.freewayLength]}
              onValueChange={([value]) => onUpdateParams({ freewayLength: value })}
              min={1}
              max={20}
              step={1}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs">Time Headway: {params.tDist} seconds</Label>
            <Slider
              value={[params.tDist]}
              onValueChange={([value]) => onUpdateParams({ tDist: value })}
              min={1}
              max={5}
              step={0.5}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs">Lane Change Cooldown: {params.laneChangeCooldown} seconds</Label>
            <Slider
              value={[params.laneChangeCooldown]}
              onValueChange={([value]) => onUpdateParams({ laneChangeCooldown: value })}
              min={0.5}
              max={5}
              step={0.5}
              className="w-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ControlPanel;

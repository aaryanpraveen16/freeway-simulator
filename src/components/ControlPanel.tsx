
import React from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SimulationParams, calculateNumCars, updateTrafficDensity } from "@/utils/trafficSimulation";
import { Play, Pause, RotateCcw, Car } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ControlPanelProps {
  isRunning: boolean;
  onToggleSimulation: () => void;
  onReset: () => void;
  params: SimulationParams;
  onUpdateParams: (newParams: Partial<SimulationParams>) => void;
}

// Predefined traffic settings
const trafficPresets = [
  { name: "Light Traffic", density: 5, icon: <Car size={16} /> },
  { name: "Busy Traffic", density: 15, icon: <Car size={16} /> },
  { name: "Heavy Traffic", density: 30, icon: <Car size={16} /> },
  { name: "Fully Packed", density: 50, icon: <Car size={16} /> },
];

const ControlPanel: React.FC<ControlPanelProps> = ({
  isRunning,
  onToggleSimulation,
  onReset,
  params,
  onUpdateParams,
}) => {
  const handleTrafficDensityChange = (value: number[]) => {
    const newParams = updateTrafficDensity(
      { ...params, trafficDensity: value[0] },
      'density'
    );
    onUpdateParams(newParams);
  };

  const handleTrafficDensityPerLaneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      const newParams = updateTrafficDensity(
        { ...params, trafficDensityPerLane: value },
        'perLane'
      );
      onUpdateParams(newParams);
    }
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      onUpdateParams({ meanSpeed: value });
    }
  };

  const handleNumLanesChange = (value: number[]) => {
    const newParams = updateTrafficDensity(
      { ...params, numLanes: value[0] },
      'perLane'
    );
    onUpdateParams(newParams);
  };

  const handleFreewayLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      onUpdateParams({ freewayLength: value });
    }
  };

  const handleEntryColorDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      onUpdateParams({ entryColorDistance: value });
    }
  };

  const handleExitColorDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      onUpdateParams({ exitColorDistance: value });
    }
  };

  const handleMeanTripDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      onUpdateParams({ meanDistTripPlanned: value });
    }
  };

  const handleTripDistanceStdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      onUpdateParams({ sigmaDistTripPlanned: value });
    }
  };

  const handleLaneChangeRuleChange = (value: string) => {
    onUpdateParams({ laneChangeRule: value as 'american' | 'european' });
  };

  const applyTrafficPreset = (density: number) => {
    const newParams = updateTrafficDensity(
      { ...params, trafficDensity: density },
      'density'
    );
    onUpdateParams(newParams);
    onReset();
  };

  const currentNumCars = calculateNumCars(params);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Traffic Simulation Controls</CardTitle>
        <CardDescription>
          Adjust parameters to see how they affect traffic flow
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Predefined traffic presets */}
        <div className="space-y-2">
          <Label>Predefined Traffic Densities</Label>
          <div className="flex flex-wrap gap-2">
            {trafficPresets.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                className="flex items-center gap-1"
                onClick={() => applyTrafficPreset(preset.density)}
              >
                {preset.icon}
                <span>{preset.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({preset.density}/mi)
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Number of Lanes */}
        <div className="space-y-2">
          <Label>Number of Lanes</Label>
          <Slider
            value={[params.numLanes]}
            onValueChange={handleNumLanesChange}
            min={1}
            max={4}
            step={1}
            disabled={isRunning}
          />
          <div className="text-sm text-muted-foreground">
            {params.numLanes} {params.numLanes === 1 ? 'Lane' : 'Lanes'}
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-base">Traffic Density</Label>
          
          <div className="space-y-2">
            <Label>Total Traffic Density (cars/mile)</Label>
            <Slider
              value={[params.trafficDensity]}
              onValueChange={handleTrafficDensityChange}
              min={1}
              max={100}
              step={1}
              disabled={isRunning}
            />
            <div className="text-sm text-muted-foreground">
              {params.trafficDensity.toFixed(1)} cars/mile ({currentNumCars} total cars)
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="density-per-lane">Traffic Density per Lane (cars/mile/lane)</Label>
            <Input
              id="density-per-lane"
              type="number"
              value={params.trafficDensityPerLane.toFixed(1)}
              onChange={handleTrafficDensityPerLaneChange}
              min={0.1}
              max={50}
              step={0.1}
              disabled={isRunning}
            />
            <p className="text-xs text-muted-foreground">
              Density per individual lane
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="freeway-length">Freeway Length (miles)</Label>
          <Input
            id="freeway-length"
            type="number"
            value={params.freewayLength}
            onChange={handleFreewayLengthChange}
            min={1}
            max={100}
            step={1}
            disabled={isRunning}
          />
          <p className="text-xs text-muted-foreground">
            Total length of the freeway in miles
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lane-change-rule">Lane Change Rules</Label>
          <Select 
            value={params.laneChangeRule} 
            onValueChange={handleLaneChangeRuleChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select lane change rules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="american">American (Pass left/right, keep right recommended)</SelectItem>
              <SelectItem value="european">European (Pass left only, keep right enforced)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {params.laneChangeRule === 'american' 
              ? 'Cars can pass on either side, keeping right is recommended but not enforced'
              : 'Cars must pass on the left only, keeping right is strictly enforced'
            }
          </p>
        </div>

        <div className="space-y-4">
          <Label className="text-base">Car Color Coding</Label>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entry-color-distance">Entry Color Distance (miles)</Label>
              <Input
                id="entry-color-distance"
                type="number"
                value={params.entryColorDistance}
                onChange={handleEntryColorDistanceChange}
                min={0.1}
                max={5}
                step={0.1}
              />
              <p className="text-xs text-muted-foreground">
                Distance from entry where cars show green color
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="exit-color-distance">Exit Color Distance (miles)</Label>
              <Input
                id="exit-color-distance"
                type="number"
                value={params.exitColorDistance}
                onChange={handleExitColorDistanceChange}
                min={0.1}
                max={5}
                step={0.1}
              />
              <p className="text-xs text-muted-foreground">
                Distance before exit where cars show red color
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="avg-speed">Average Speed (mph)</Label>
            <Input
              id="avg-speed"
              type="number"
              value={params.meanSpeed}
              onChange={handleSpeedChange}
              min={20}
              max={80}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time-headway">Time Headway (s)</Label>
            <Input
              id="time-headway"
              type="number"
              value={params.tDist}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value > 0) {
                  onUpdateParams({ tDist: value });
                }
              }}
              min={0.5}
              max={3}
              step={0.1}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="speed-limit">Speed Limit (mph)</Label>
          <Input
            id="speed-limit"
            type="number"
            value={params.speedLimit}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (!isNaN(value) && value >= 20 && value <= 80) {
                onUpdateParams({ speedLimit: value });
              }
            }}
            min={20}
            max={80}
            step={1}
          />
        </div>
        
        <div className="space-y-4">
          <Label className="text-base">Trip Planning Parameters</Label>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mean-trip-distance">Mean Trip Distance (miles)</Label>
              <Input
                id="mean-trip-distance"
                type="number"
                value={params.meanDistTripPlanned}
                onChange={handleMeanTripDistanceChange}
                min={1}
                max={50}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Average distance cars will travel before exiting
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="trip-distance-std">Trip Distance Std Dev</Label>
              <Input
                id="trip-distance-std"
                type="number"
                value={params.sigmaDistTripPlanned}
                onChange={handleTripDistanceStdChange}
                min={0.1}
                max={2}
                step={0.1}
              />
              <p className="text-xs text-muted-foreground">
                Variation in trip distances (log-normal distribution)
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={onReset}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RotateCcw size={16} />
          Reset
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ControlPanel;

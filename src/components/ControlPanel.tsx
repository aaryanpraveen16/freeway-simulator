
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
import { SimulationParams } from "@/utils/trafficSimulation";
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
  setSimulationSpeed: (speed: number) => void;
  trafficRule: 'american' | 'european';
  onTrafficRuleChange: (rule: 'american' | 'european') => void;
}

// Predefined traffic density presets (cars per mile per lane)
const trafficPresets = [
  { name: "Light Traffic", density: 2, icon: <Car size={16} /> },
  { name: "Moderate Traffic", density: 4, icon: <Car size={16} /> },
  { name: "Heavy Traffic", density: 8, icon: <Car size={16} /> },
  { name: "Congested", density: 12, icon: <Car size={16} /> },
];

const ControlPanel: React.FC<ControlPanelProps> = ({
  isRunning,
  onToggleSimulation,
  onReset,
  params,
  onUpdateParams,
  setSimulationSpeed,
  trafficRule,
  onTrafficRuleChange,
}) => {
  const handleTrafficDensityChange = (laneIndex: number, density: number) => {
    const newTrafficDensity = [...params.trafficDensity];
    newTrafficDensity[laneIndex] = density;
    onUpdateParams({ trafficDensity: newTrafficDensity });
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      onUpdateParams({ meanSpeed: value });
    }
  };

  const handleBrakeCarChange = (value: string) => {
    onUpdateParams({ brakeCarIndex: parseInt(value) });
  };

  const handleMeanTripDistanceChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      onUpdateParams({ meanDistTripPlanned: value });
    }
  };

  const handleTripDistanceStdChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      onUpdateParams({ sigmaDistTripPlanned: value });
    }
  };

  const handleNumLanesChange = (value: number[]) => {
    const newNumLanes = value[0];
    const currentDensities = params.trafficDensity;
    
    // Adjust traffic density array to match new number of lanes
    const newTrafficDensity = Array.from({ length: newNumLanes }, (_, i) => 
      currentDensities[i] || currentDensities[0] || 3
    );
    
    onUpdateParams({ 
      numLanes: newNumLanes,
      trafficDensity: newTrafficDensity
    });
  };

  const handleFreewayLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      onUpdateParams({ freewayLength: value });
    }
  };

  const applyTrafficPreset = (density: number) => {
    const newTrafficDensity = Array.from({ length: params.numLanes || 2 }, () => density);
    onUpdateParams({ trafficDensity: newTrafficDensity });
    onReset();
  };

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
            value={[params.numLanes || 1]}
            onValueChange={handleNumLanesChange}
            min={1}
            max={4}
            step={1}
            disabled={isRunning}
          />
          <div className="text-sm text-muted-foreground">
            {params.numLanes || 1} {(params.numLanes || 1) === 1 ? 'Lane' : 'Lanes'}
          </div>
        </div>

        {/* Traffic Density per Lane */}
        <div className="space-y-4">
          <Label className="text-base">Traffic Density per Lane (cars/mile)</Label>
          {Array.from({ length: params.numLanes || 1 }, (_, i) => (
            <div key={i} className="space-y-2">
              <Label>Lane {i + 1} Density</Label>
              <Slider
                value={[params.trafficDensity[i] || 3]}
                onValueChange={(value) => handleTrafficDensityChange(i, value[0])}
                min={1}
                max={15}
                step={0.5}
                disabled={isRunning}
              />
              <div className="text-sm text-muted-foreground">
                {params.trafficDensity[i] || 3} cars per mile
              </div>
            </div>
          ))}
        </div>

        {/* Freeway Length */}
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

        <div className="space-y-2">
          <Label>Traffic Rule</Label>
          <div className="flex gap-2">
            <Button
              variant={trafficRule === 'american' ? 'default' : 'outline'}
              onClick={() => onTrafficRuleChange('american')}
            >
              American (Right-hand)
            </Button>
            <Button
              variant={trafficRule === 'european' ? 'default' : 'outline'}
              onClick={() => onTrafficRuleChange('european')}
            >
              European (Left-hand)
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ControlPanel;

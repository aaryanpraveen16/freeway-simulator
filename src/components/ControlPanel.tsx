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
  trafficRule: 'american' | 'european';
  onTrafficRuleChange: (rule: 'american' | 'european') => void;
}

// Predefined traffic settings
const trafficPresets = {
  perLane: [
    { name: "Low Density", cars: 5, icon: <Car size={16} /> },
    { name: "Medium Density", cars: 15, icon: <Car size={16} /> },
    { name: "High Density", cars: 30, icon: <Car size={16} /> },
  ],
  total: [
    { name: "Low Traffic", cars: 10, icon: <Car size={16} /> },
    { name: "Medium Traffic", cars: 30, icon: <Car size={16} /> },
    { name: "Heavy Traffic", cars: 60, icon: <Car size={16} /> },
  ]
};

// Traffic rule descriptions
const trafficRuleDescriptions = {
  american: {
    title: "American (Right-hand) Rules",
    slowTraffic: "If the right lane is open, you may stay in the current lane. 'Slow traffic keep right' is recommended but not enforced.",
    passing: "You may pass the leading car by changing to either the left or right lane."
  },
  european: {
    title: "European (Left-hand) Rules",
    slowTraffic: "If the right lane is open, you must move to the right lane. 'Slow traffic keep right' is strictly enforced.",
    passing: "You may only pass the leading car by changing to the left lane."
  }
};

// Research presets
const researchPresets = {
  speeds: [
    { name: "50 mph", value: 50 },
    { name: "65 mph", value: 65 },
    { name: "80 mph", value: 80 },
    { name: "100 mph", value: 100 },
  ],
  tripDistances: [
    { name: "5 miles", value: 5 },
    { name: "10 miles", value: 10 },
    { name: "20 miles", value: 20 },
    { name: "30 miles", value: 30 },
  ],
  lanes: [
    { name: "1 Lane", value: 1 },
    { name: "2 Lanes", value: 2 },
    { name: "3 Lanes", value: 3 },
  ],
};

const ControlPanel: React.FC<ControlPanelProps> = ({
  isRunning,
  onToggleSimulation,
  onReset,
  params,
  onUpdateParams,
  trafficRule,
  onTrafficRuleChange,
}) => {
  const handleNumCarsChange = (value: number[]) => {
    onUpdateParams({ numCars: value[0] });
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
    onUpdateParams({ numLanes: value[0] });
  };

  const handleFreewayLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      onUpdateParams({ freewayLength: value });
    }
  };

  const applyTrafficPreset = (numCars: number) => {
    onUpdateParams({ numCars });
    onReset();
  };

  // Generate car options based on numCars
  const carOptions = Array.from({ length: params.numCars }, (_, i) => ({
    value: i.toString(),
    label: `Car ${i + 1}`,
  }));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Traffic Simulation Controls</CardTitle>
        <CardDescription>
          Adjust parameters to see how they affect traffic flow
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Research Configuration */}
        <div className="space-y-4">
          <Label className="text-base">Research Configuration</Label>
          
          {/* Speed Presets */}
          <div className="space-y-2">
            <Label>Mean Speed (mph)</Label>
            <div className="flex flex-wrap gap-2">
              {researchPresets.speeds.map((preset) => (
                <Button
                  key={preset.name}
                  variant={params.meanSpeed === preset.value ? "default" : "outline"}
                  className="flex items-center gap-1"
                  onClick={() => onUpdateParams({ meanSpeed: preset.value })}
                  disabled={isRunning}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Trip Distance Presets */}
          <div className="space-y-2">
            <Label>Mean Trip Distance (miles)</Label>
            <div className="flex flex-wrap gap-2">
              {researchPresets.tripDistances.map((preset) => (
                <Button
                  key={preset.name}
                  variant={params.meanDistTripPlanned === preset.value ? "default" : "outline"}
                  className="flex items-center gap-1"
                  onClick={() => onUpdateParams({ meanDistTripPlanned: preset.value })}
                  disabled={isRunning}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Lane Configuration */}
          <div className="space-y-2">
            <Label>Number of Lanes</Label>
            <div className="flex flex-wrap gap-2">
              {researchPresets.lanes.map((preset) => (
                <Button
                  key={preset.name}
                  variant={params.numLanes === preset.value ? "default" : "outline"}
                  className="flex items-center gap-1"
                  onClick={() => onUpdateParams({ numLanes: preset.value })}
                  disabled={isRunning}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Traffic Rules */}
        <div className="space-y-4">
          <Label className="text-base">Traffic Rules</Label>
          <div className="flex gap-2">
            <Button
              variant={trafficRule === 'american' ? 'default' : 'outline'}
              onClick={() => onTrafficRuleChange('american')}
              className="flex-1"
            >
              American (Right-hand)
            </Button>
            <Button
              variant={trafficRule === 'european' ? 'default' : 'outline'}
              onClick={() => onTrafficRuleChange('european')}
              className="flex-1"
            >
              European (Left-hand)
            </Button>
          </div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>{trafficRuleDescriptions[trafficRule].title}</strong></p>
            <p><strong>Slow Traffic Rule:</strong> {trafficRuleDescriptions[trafficRule].slowTraffic}</p>
            <p><strong>Passing Rule:</strong> {trafficRuleDescriptions[trafficRule].passing}</p>
          </div>
        </div>

        {/* Traffic Density */}
        <div className="space-y-4">
          <Label className="text-base">Traffic Density</Label>
          
          {/* Per Lane Density */}
          <div className="space-y-2">
            <Label>Density per Lane</Label>
            <div className="flex flex-wrap gap-2">
              {trafficPresets.perLane.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  className="flex items-center gap-1"
                  onClick={() => {
                    const totalCars = preset.cars * params.numLanes;
                    onUpdateParams({ numCars: totalCars });
                  }}
                  disabled={isRunning}
                >
                  {preset.icon}
                  <span>{preset.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({preset.cars}/lane)
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Total Traffic Density */}
          <div className="space-y-2">
            <Label>Total Traffic</Label>
            <div className="flex flex-wrap gap-2">
              {trafficPresets.total.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  className="flex items-center gap-1"
                  onClick={() => onUpdateParams({ numCars: preset.cars })}
                  disabled={isRunning}
                >
                  {preset.icon}
                  <span>{preset.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({preset.cars})
                  </span>
                </Button>
              ))}
            </div>
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

        {/* Number of Cars */}
        <div className="space-y-2">
          <Label>Number of Cars</Label>
          <Slider
            value={[params.numCars]}
            onValueChange={handleNumCarsChange}
            min={1}
            max={100}
            step={1}
            disabled={isRunning}
          />
          <div className="text-sm text-muted-foreground">
            {params.numCars} {params.numCars === 1 ? 'Car' : 'Cars'}
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

        {/* <div className="space-y-2">
          <Label htmlFor="brake-car">Car to Slow Down</Label>
          <Select 
            value={params.brakeCarIndex.toString()} 
            onValueChange={handleBrakeCarChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select which car to slow down" />
            </SelectTrigger>
            <SelectContent>
              {carOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This car will slow down after {params.brakeTime} seconds of simulation time
          </p>
        </div> */}

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

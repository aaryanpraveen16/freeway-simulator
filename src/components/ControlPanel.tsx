
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
}

// Predefined traffic settings
const trafficPresets = [
  { name: "Light Traffic", cars: 10, icon: <Car size={16} /> },
  { name: "Busy Traffic", cars: 30, icon: <Car size={16} /> },
  { name: "Heavy Traffic", cars: 60, icon: <Car size={16} /> },
  { name: "Fully Packed", cars: 100, icon: <Car size={16} /> },
];

const ControlPanel: React.FC<ControlPanelProps> = ({
  isRunning,
  onToggleSimulation,
  onReset,
  params,
  onUpdateParams,
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
  
  const applyTrafficPreset = (numCars: number) => {
    onUpdateParams({ numCars });
    onReset();
  };
  
  // Generate car options based on numCars
  const carOptions = Array.from({ length: params.numCars }, (_, i) => ({
    value: i.toString(),
    label: `Car ${i + 1}`
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
        {/* Predefined traffic presets */}
        <div className="space-y-2">
          <Label>Predefined Traffic Densities</Label>
          <div className="flex flex-wrap gap-2">
            {trafficPresets.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                className="flex items-center gap-1"
                onClick={() => applyTrafficPreset(preset.cars)}
              >
                {preset.icon}
                <span>{preset.name}</span>
                <span className="text-xs text-muted-foreground">({preset.cars})</span>
              </Button>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="num-cars">Number of Cars: {params.numCars}</Label>
          </div>
          <Slider
            id="num-cars"
            min={1}
            max={100}
            step={1}
            value={[params.numCars]}
            onValueChange={handleNumCarsChange}
            className="py-4"
          />
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
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          onClick={onReset}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RotateCcw size={16} />
          Reset
        </Button>
        <Button
          onClick={onToggleSimulation}
          variant={isRunning ? "destructive" : "default"}
          className="flex items-center gap-2"
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
      </CardFooter>
    </Card>
  );
};

export default ControlPanel;

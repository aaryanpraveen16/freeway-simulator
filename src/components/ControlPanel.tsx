import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { SimulationParams } from "@/utils/trafficSimulation";

interface ControlPanelProps {
  params: SimulationParams;
  onParamsChange: (params: SimulationParams) => void;
  onReset: () => void;
  isRunning: boolean;
  trafficRule: 'american' | 'european';
  onTrafficRuleChange: (rule: 'american' | 'european') => void;
  simulationSpeed: number;
  onSimulationSpeedChange: (speed: number) => void;
  showPreviousRuns: boolean;
  onShowPreviousRunsChange: (show: boolean) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  onParamsChange,
  onReset,
  isRunning,
  trafficRule,
  onTrafficRuleChange,
  simulationSpeed,
  onSimulationSpeedChange,
  showPreviousRuns,
  onShowPreviousRunsChange,
}) => {
  // Calculate overall density from per-lane densities
  const overallDensity = params.trafficDensity.reduce((sum, density) => sum + density, 0);

  const handleOverallDensityChange = (value: number[]) => {
    const newOverallDensity = value[0];
    const numLanes = params.numLanes || 2;
    
    // Distribute density evenly across lanes
    const densityPerLane = newOverallDensity / numLanes;
    const newTrafficDensity = Array(numLanes).fill(densityPerLane);
    
    onParamsChange({
      ...params,
      trafficDensity: newTrafficDensity,
    });
  };

  const handleFreewayLengthChange = (value: number[]) => {
    onParamsChange({
      ...params,
      freewayLength: value[0],
    });
  };

  const handleNumLanesChange = (value: number[]) => {
    const newNumLanes = value[0];
    const currentOverallDensity = params.trafficDensity.reduce((sum, density) => sum + density, 0);
    const densityPerLane = currentOverallDensity / newNumLanes;
    const newTrafficDensity = Array(newNumLanes).fill(densityPerLane);

    onParamsChange({
      ...params,
      numLanes: newNumLanes,
      trafficDensity: newTrafficDensity,
    });
  };

  const handleSpeedLimitChange = (value: number[]) => {
    onParamsChange({
      ...params,
      speedLimit: value[0],
    });
  };

  const handleMeanSpeedChange = (value: number[]) => {
    onParamsChange({
      ...params,
      meanSpeed: value[0],
    });
  };

  const handleStdSpeedChange = (value: number[]) => {
    onParamsChange({
      ...params,
      stdSpeed: value[0],
    });
  };

  const handleSimulationSpeedChange = (value: number[]) => {
    onSimulationSpeedChange(value[0]);
  };

  const handleShowPreviousRunsChange = (checked: boolean) => {
    onShowPreviousRunsChange(checked);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Simulation Controls</CardTitle>
        <CardDescription>
          Adjust traffic parameters and simulation settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Traffic Rule Selection */}
        <div className="space-y-2">
          <Label htmlFor="traffic-rule">Traffic Rules</Label>
          <Select
            value={trafficRule}
            onValueChange={(value: 'american' | 'european') => onTrafficRuleChange(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select traffic rules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="american">American (Pass on any side)</SelectItem>
              <SelectItem value="european">European (Pass on left only)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overall Freeway Traffic Density - REMOVED max limit */}
        <div className="space-y-2">
          <Label htmlFor="overall-density">
            Overall Freeway Traffic Density: {overallDensity.toFixed(1)} cars/mile
          </Label>
          <Slider
            id="overall-density"
            min={0.1}
            step={0.1}
            value={[overallDensity]}
            onValueChange={handleOverallDensityChange}
            className="w-full"
            disabled={isRunning}
          />
        </div>

        {/* Freeway Length */}
        <div className="space-y-2">
          <Label htmlFor="freeway-length">
            Freeway Length: {params.freewayLength} miles
          </Label>
          <Slider
            id="freeway-length"
            min={1}
            max={50}
            step={1}
            value={[params.freewayLength || 10]}
            onValueChange={(value) =>
              onParamsChange({ ...params, freewayLength: value[0] })
            }
            className="w-full"
            disabled={isRunning}
          />
        </div>

        {/* Number of Lanes */}
        <div className="space-y-2">
          <Label htmlFor="num-lanes">
            Number of Lanes: {params.numLanes}
          </Label>
          <Slider
            id="num-lanes"
            min={1}
            max={6}
            step={1}
            value={[params.numLanes || 2]}
            onValueChange={(value) => {
              const newNumLanes = value[0];
              const currentOverallDensity = params.trafficDensity.reduce((sum, density) => sum + density, 0);
              const densityPerLane = currentOverallDensity / newNumLanes;
              const newTrafficDensity = Array(newNumLanes).fill(densityPerLane);
              
              onParamsChange({
                ...params,
                numLanes: newNumLanes,
                trafficDensity: newTrafficDensity,
              });
            }}
            className="w-full"
            disabled={isRunning}
          />
        </div>

        {/* Speed Limit */}
        <div className="space-y-2">
          <Label htmlFor="speed-limit">
            Speed Limit: {params.speedLimit} mph
          </Label>
          <Slider
            id="speed-limit"
            min={35}
            max={85}
            step={5}
            value={[params.speedLimit]}
            onValueChange={(value) =>
              onParamsChange({ ...params, speedLimit: value[0] })
            }
            className="w-full"
            disabled={isRunning}
          />
        </div>

        {/* Mean Desired Speed */}
        <div className="space-y-2">
          <Label htmlFor="mean-speed">
            Mean Desired Speed: {params.meanSpeed} mph
          </Label>
          <Slider
            id="mean-speed"
            min={30}
            max={85}
            step={1}
            value={[params.meanSpeed]}
            onValueChange={(value) =>
              onParamsChange({ ...params, meanSpeed: value[0] })
            }
            className="w-full"
            disabled={isRunning}
          />
        </div>

        {/* Speed Standard Deviation */}
        <div className="space-y-2">
          <Label htmlFor="std-speed">
            Speed Std Dev: {params.stdSpeed} mph
          </Label>
          <Slider
            id="std-speed"
            min={1}
            max={15}
            step={0.5}
            value={[params.stdSpeed]}
            onValueChange={(value) =>
              onParamsChange({ ...params, stdSpeed: value[0] })
            }
            className="w-full"
            disabled={isRunning}
          />
        </div>

        {/* Simulation Speed */}
        <div className="space-y-2">
          <Label htmlFor="simulation-speed">
            Simulation Speed: {simulationSpeed}x
          </Label>
          <Slider
            id="simulation-speed"
            min={0.1}
            max={5}
            step={0.1}
            value={[simulationSpeed]}
            onValueChange={(value) => onSimulationSpeedChange(value[0])}
            className="w-full"
          />
        </div>

        {/* Show Previous Runs Toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            id="show-previous-runs"
            checked={showPreviousRuns}
            onCheckedChange={onShowPreviousRunsChange}
          />
          <Label htmlFor="show-previous-runs">Show Previous Runs</Label>
        </div>

        {/* Reset Button */}
        <Button 
          onClick={onReset}
          variant="outline"
          className="w-full"
          disabled={isRunning}
        >
          Reset Simulation
        </Button>
      </CardContent>
    </Card>
  );
};

export default ControlPanel;

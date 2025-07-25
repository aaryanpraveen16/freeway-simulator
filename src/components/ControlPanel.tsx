import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SimulationParams } from "@/utils/trafficSimulation";
import { JsonImportExport } from "./JsonImportExport";
import { InfoTooltip } from "./InfoTooltip";

interface BatchSimulation {
  name?: string;
  duration: number;
  params: Partial<SimulationParams>;
}

interface ControlPanelProps {
  params: SimulationParams;
  onUpdateParams: (params: Partial<SimulationParams>) => void;
  onBatchImport?: (simulations: BatchSimulation[]) => void;
  trafficRule: 'american' | 'european';
  onTrafficRuleChange: (rule: 'american' | 'european') => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  onUpdateParams,
  onBatchImport,
  trafficRule,
  onTrafficRuleChange,
}) => {
  const handleVehicleTypeDensityChange = (vehicleType: 'car' | 'truck' | 'motorcycle', value: number) => {
    const newVehicleTypeDensity = { ...params.vehicleTypeDensity };
    newVehicleTypeDensity[vehicleType] = value;
    
    // Ensure percentages add up to 100
    const total = Object.values(newVehicleTypeDensity).reduce((sum, val) => sum + val, 0);
    if (total !== 100) {
      // Proportionally adjust other values
      const others = Object.keys(newVehicleTypeDensity).filter(key => key !== vehicleType) as ('car' | 'truck' | 'motorcycle')[];
      const remaining = 100 - value;
      const otherTotal = others.reduce((sum, key) => sum + newVehicleTypeDensity[key], 0);
      
      if (otherTotal > 0) {
        others.forEach(key => {
          newVehicleTypeDensity[key] = Math.round((newVehicleTypeDensity[key] / otherTotal) * remaining);
        });
      }
    }
    
    onUpdateParams({ vehicleTypeDensity: newVehicleTypeDensity });
  };

  const addLane = () => {
    if (params.numLanes < 6) {
      onUpdateParams({ 
        numLanes: params.numLanes + 1
      });
    }
  };

  const removeLane = () => {
    if (params.numLanes > 1) {
      onUpdateParams({ 
        numLanes: params.numLanes - 1
      });
    }
  };

  // Overall traffic density in cars per mile (across all lanes)
  const overallDensity = params.trafficDensity || 3;

  /**
   * Handle changes to the overall traffic density input
   * @param value The new density value in cars per mile
   */
  const handleOverallDensityChange = (value: string) => {
    const newDensity = parseFloat(value) || 3;
    onUpdateParams({ trafficDensity: newDensity });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Traffic Rule */}
            <div className="space-y-2">
              <div className="flex items-center">
                <Label className="text-sm font-medium">Traffic Rule</Label>
                <InfoTooltip content="Determines the lane change behavior: American (right-lane passing) or European (left-lane passing)" />
              </div>
              <Select value={trafficRule} onValueChange={(value: 'american' | 'european') => onTrafficRuleChange(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="american">American </SelectItem>
                  <SelectItem value="european">European</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Vehicle Type Distribution */}
            <div className="space-y-3">
              <div className="flex items-center">
                <Label className="text-sm font-medium">Vehicle Type Distribution</Label>
                <InfoTooltip content="Percentage distribution of different vehicle types in the simulation" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <Label>Cars:</Label>
                    <InfoTooltip content="Percentage of cars in the simulation" />
                  </div>
                  <Input
                    type="number"
                    value={params.vehicleTypeDensity.car}
                    onChange={(e) => handleVehicleTypeDensityChange('car', parseInt(e.target.value) || 0)}
                    className="flex-1"
                    min="0"
                    max="100"
                  />
                  <span className="text-xs text-gray-500">%</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <Label>Trucks:</Label>
                    <InfoTooltip content="Percentage of trucks in the simulation" />
                  </div>
                  <Input
                    type="number"
                    value={params.vehicleTypeDensity.truck}
                    onChange={(e) => handleVehicleTypeDensityChange('truck', parseInt(e.target.value) || 0)}
                    className="flex-1"
                    min="0"
                    max="100"
                  />
                  <span className="text-xs text-gray-500">%</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <Label>Motorcycles:</Label>
                    <InfoTooltip content="Percentage of motorcycles in the simulation" />
                  </div>
                  <Input
                    type="number"
                    value={params.vehicleTypeDensity.motorcycle}
                    onChange={(e) => handleVehicleTypeDensityChange('motorcycle', parseInt(e.target.value) || 0)}
                    className="flex-1"
                    min="0"
                    max="100"
                  />
                  <span className="text-xs text-gray-500">%</span>
                </div>
                
                <div className="text-xs text-gray-500">
                  Total: {Object.values(params.vehicleTypeDensity).reduce((sum, val) => sum + val, 0)}%
                </div>
              </div>
            </div>

            <Separator />

            {/* Lane Configuration */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Label className="text-sm font-medium">Number of Lanes</Label>
                  <InfoTooltip content="Number of lanes in the freeway" />
                </div>
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
              
              {/* Overall Freeway Traffic Density */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label className="text-sm">Overall Traffic Density (cars/mile)</Label>
                  <InfoTooltip content="Number of vehicles per mile across all lanes. Higher values create more congestion." />
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={overallDensity.toFixed(1)}
                    onChange={(e) => handleOverallDensityChange(e.target.value)}
                    className="flex-1"
                    min="0"
                    max="100"
                    step="0.5"
                  />
                  <span className="text-xs text-gray-500">cars/mile</span>
                </div>
                <div className="text-xs text-gray-500">
                  This density will be applied uniformly across all {params.numLanes} lane(s)
                </div>
              </div>
            </div>

            <Separator />

            {/* Speed Settings */}
            <div className="space-y-3">
              <div className="flex items-center">
                <Label className="text-sm font-medium">Speed Settings</Label>
                <InfoTooltip content="Settings for vehicle speeds in the simulation" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Label className="text-xs">Desired Mean Speed (mph):</Label>
                    <InfoTooltip content="Average speed of vehicles in the simulation (30-80 mph)" />
                  </div>
                  <Input
                    type="number"
                    value={params.meanSpeed}
                    onChange={(e) => {
                      const value = Math.min(80, Math.max(30, Number(e.target.value) || 65));
                      onUpdateParams({ meanSpeed: value });
                    }}
                    min={30}
                    max={80}
                    step={1}
                    className="w-20 h-8 text-right"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Label>Speed Limit (mph)</Label>
                    <InfoTooltip content="Maximum allowed speed in the simulation" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {params.speedLimit} mph ({params.speedLimit / params.meanSpeed * 100}% of desired speed)
                  </div>
                </div>
                <Input
                  id="speedLimit"
                  type="number"
                  value={params.speedLimit}
                  onChange={(e) => onUpdateParams({ speedLimit: Number(e.target.value) })}
                  min="0"
                  step="5"
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">Presets:</span>
                  <ToggleGroup type="single" size="sm" className="gap-1">
                    {[0.5, 0.75, 1, 1.5].map((ratio) => (
                      <ToggleGroupItem 
                        key={ratio}
                        value={ratio.toString()}
                        onClick={() => onUpdateParams({ speedLimit: Math.round(params.meanSpeed * ratio) })}
                        className="h-6 px-2 text-xs"
                      >
                        {ratio}x
                      </ToggleGroupItem>
                    ))}
                    <ToggleGroupItem 
                      value="none"
                      onClick={() => onUpdateParams({ speedLimit: 1000 })} // Effectively no limit
                      className="h-6 px-2 text-xs"
                    >
                      No Limit
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
            </div>

            <Separator />

            {/* Simulation Duration */}
            <div className="space-y-3">
              <div className="flex items-center">
                <Label className="text-sm font-medium">Simulation Duration</Label>
                <InfoTooltip content="How long the simulation should run in seconds" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={params.simulationDuration || 60}
                    onChange={(e) => onUpdateParams({ simulationDuration: Number(e.target.value) || 60 })}
                    className="flex-1"
                    min="10"
                    max="600"
                    step="10"
                  />
                  <span className="text-xs text-gray-500">seconds</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">Presets:</span>
                  <ToggleGroup type="single" size="sm" className="gap-1">
                    {[30, 60, 120, 300].map((duration) => (
                      <ToggleGroupItem 
                        key={duration}
                        value={duration.toString()}
                        onClick={() => onUpdateParams({ simulationDuration: duration })}
                        className="h-6 px-2 text-xs"
                      >
                        {duration}s
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              </div>
            </div>

            <Separator />

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
                <Label className="text-xs">Trip Distance: {params.meanDistTripPlanned} miles</Label>
                <Slider
                  value={[params.meanDistTripPlanned]}
                  onValueChange={([value]) => onUpdateParams({ meanDistTripPlanned: value })}
                  min={1}
                  max={50}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

            <Separator />
            
            {/* JSON Import/Export */}
            <div className="pt-2">
              <JsonImportExport 
                onImport={onUpdateParams}
                onBatchImport={onBatchImport}
                currentParams={params}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ControlPanel;

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { SimulationParams } from "@/utils/trafficSimulation";

interface ControlPanelProps {
  params: SimulationParams;
  onUpdateParams: (params: Partial<SimulationParams>) => void;
  trafficRule: 'american' | 'european';
  onTrafficRuleChange: (rule: 'american' | 'european') => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  onUpdateParams,
  trafficRule,
  onTrafficRuleChange,
}) => {
  const handleTrafficDensityChange = (laneIndex: number, value: string) => {
    const newDensity = [...params.trafficDensity];
    newDensity[laneIndex] = parseFloat(value) || 0;
    onUpdateParams({ trafficDensity: newDensity });
  };

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
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Traffic Rule */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Traffic Rule</Label>
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
              <Label className="text-sm font-medium">Vehicle Type Distribution (%)</Label>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs w-20">Cars:</Label>
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
                  <Label className="text-xs w-20">Trucks:</Label>
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
                  <Label className="text-xs w-20">Motorcycles:</Label>
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

            <Separator />

            {/* Speed Settings */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Speed Settings</Label>
              
              <div className="space-y-2">
                <Label className="text-xs">Desired Mean Speed: {params.meanSpeed} mph</Label>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ControlPanel;

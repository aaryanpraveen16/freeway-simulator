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
import { UnitSystem, getUnitConversions } from "@/utils/unitConversion";
import { CollapsibleSection } from "./ui/CollapsibleSection";

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
  carSize?: number;
  onCarSizeChange?: (size: number) => void;
  unitSystem?: UnitSystem;
  onUnitSystemChange?: (system: UnitSystem) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  onUpdateParams,
  onBatchImport,
  trafficRule,
  onTrafficRuleChange,
  carSize = 24,
  onCarSizeChange,
  unitSystem = 'imperial',
  onUnitSystemChange,
}) => {
  const conversions = getUnitConversions(unitSystem);
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
            {/* Unit System */}
            {onUnitSystemChange && (
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label className="text-sm font-medium">Unit System</Label>
                  <InfoTooltip content="Choose between metric (km/h, km) or imperial (mph, miles) units" />
                </div>
                <Select value={unitSystem} onValueChange={(value: UnitSystem) => onUnitSystemChange(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="imperial">Imperial (mph, miles)</SelectItem>
                    <SelectItem value="metric">Metric (km/h, km)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

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
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      if (value >= 0 && value <= 100) {
                        handleVehicleTypeDensityChange('car', value);
                      }
                    }}
                    onKeyDown={(e) => {
                      // Allow: backspace, delete, tab, escape, enter, and decimal points
                      if ([46, 8, 9, 27, 13, 110, 190].includes(e.keyCode) ||
                          // Allow: Ctrl+A, Command+A
                          (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
                          // Allow: home, end, left, right, down, up
                          (e.keyCode >= 35 && e.keyCode <= 40)) {
                        // Let it happen, don't do anything
                        return;
                      }
                      // Ensure that it is a number and stop the keypress
                      if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                        e.preventDefault();
                      }
                    }}
                    className="flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      if (value >= 0 && value <= 100) {
                        handleVehicleTypeDensityChange('truck', value);
                      }
                    }}
                    onKeyDown={(e) => {
                      // Allow: backspace, delete, tab, escape, enter, and decimal points
                      if ([46, 8, 9, 27, 13, 110, 190].includes(e.keyCode) ||
                          // Allow: Ctrl+A, Command+A
                          (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
                          // Allow: home, end, left, right, down, up
                          (e.keyCode >= 35 && e.keyCode <= 40)) {
                        // Let it happen, don't do anything
                        return;
                      }
                      // Ensure that it is a number and stop the keypress
                      if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                        e.preventDefault();
                      }
                    }}
                    className="flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      if (value >= 0 && value <= 100) {
                        handleVehicleTypeDensityChange('motorcycle', value);
                      }
                    }}
                    onKeyDown={(e) => {
                      // Allow: backspace, delete, tab, escape, enter, and decimal points
                      if ([46, 8, 9, 27, 13, 110, 190].includes(e.keyCode) ||
                          // Allow: Ctrl+A, Command+A
                          (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
                          // Allow: home, end, left, right, down, up
                          (e.keyCode >= 35 && e.keyCode <= 40)) {
                        // Let it happen, don't do anything
                        return;
                      }
                      // Ensure that it is a number and stop the keypress
                      if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                        e.preventDefault();
                      }
                    }}
                    className="flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                  <Label className="text-sm">Overall Traffic Density ({conversions.density.unit})</Label>
                  <InfoTooltip content="Number of vehicles per mile across all lanes. Higher values create more congestion." />
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={conversions.density.toDisplay(overallDensity).toFixed(1)}
                    onChange={(e) => {
                      const displayValue = parseFloat(e.target.value) || 3;
                      const internalValue = conversions.density.fromDisplay(displayValue);
                      handleOverallDensityChange(internalValue.toString());
                    }}
                    className="flex-1"
                    min="0"
                    max="100"
                    step="0.5"
                  />
                  <span className="text-xs text-gray-500">{conversions.density.unit}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {[10, 20, 30, 40, 50].map((density) => (
                    <Button
                      key={density}
                      variant="outline"
                      size="sm"
                      className={`h-7 px-2 text-xs ${Math.abs(overallDensity - density) < 0.1 ? 'bg-primary/10' : ''}`}
                      onClick={() => handleOverallDensityChange(density.toString())}
                    >
                      {conversions.density.toDisplay(density).toFixed(0)}
                    </Button>
                  ))}
                </div>
                <div className="text-xs text-gray-500">
                  This density will be applied uniformly across all {params.numLanes} lane(s)
                </div>
              </div>
            </div>

            <Separator />

            {/* Simulation Settings */}
            <CollapsibleSection title="Simulation Settings" defaultCollapsed={true}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Label className="text-xs">Simulation Duration (seconds):</Label>
                    <InfoTooltip content="How long the simulation will run (0 = unlimited)" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {params.simulationDuration === 0 ? 'Unlimited' : `${params.simulationDuration}s`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[Math.min(params.simulationDuration || 0, 600)]}
                    onValueChange={([value]) => onUpdateParams({ simulationDuration: Math.min(value, 600) })}
                    min={0}
                    max={600}
                    step={10}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={params.simulationDuration || ''}
                    onChange={(e) => {
                      const value = Math.min(Number(e.target.value) || 0, 600);
                      onUpdateParams({ simulationDuration: value });
                    }}
                    onBlur={(e) => {
                      const value = Math.min(Number(e.target.value) || 0, 600);
                      onUpdateParams({ simulationDuration: value });
                    }}
                    className="w-20"
                    min={0}
                    max={600}
                    step={10}
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {[30, 60, 180, 300, 600].map((duration) => (
                    <Button
                      key={duration}
                      variant="outline"
                      size="sm"
                      className={`h-7 px-2 text-xs ${params.simulationDuration === duration ? 'bg-primary/10' : ''}`}
                      onClick={() => onUpdateParams({ simulationDuration: duration })}
                    >
                      {duration < 60 ? `${duration}s` : duration === 60 ? '1 min' : duration < 300 ? `${duration/60} mins` : duration === 600 ? '10 mins (max)' : `${duration/60} mins`}
                    </Button>
                  ))}
                </div>
              </div>
            </CollapsibleSection>

            <Separator />

            {/* Speed Settings */}
            <CollapsibleSection title="Speed Settings" defaultCollapsed={true}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Label className="text-xs">Desired Mean Speed ({conversions.speed.unit}):</Label>
                    <InfoTooltip content="Average speed of vehicles in the simulation" />
                  </div>
                  <Input
                    type="number"
                    value={Math.round(conversions.speed.toDisplay(params.meanSpeed))}
                    onChange={(e) => {
                      const displayValue = Number(e.target.value) || 65;
                      const internalValue = conversions.speed.fromDisplay(displayValue);
                      const value = Math.min(80, Math.max(30, internalValue));
                      onUpdateParams({ meanSpeed: value });
                    }}
                    min={Math.round(conversions.speed.toDisplay(30))}
                    max={Math.round(conversions.speed.toDisplay(80))}
                    step={1}
                    className="w-20 h-8 text-right"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center">
                    <Label className="text-xs">Desired Speed Std Dev ({conversions.speed.unit}):</Label>
                    <InfoTooltip content="Standard deviation of desired speeds. Higher values mean more variation in driver speeds." />
                  </div>
                  <Input
                    type="number"
                    value={Math.round(conversions.speed.toDisplay(params.stdSpeed))}
                    onChange={(e) => {
                      const displayValue = Number(e.target.value) || 10;
                      const internalValue = conversions.speed.fromDisplay(displayValue);
                      // Clamp stdSpeed to reasonable range (5 to 60)
                      const value = Math.min(60, Math.max(5, internalValue));
                      onUpdateParams({ stdSpeed: value });
                    }}
                    min={Math.round(conversions.speed.toDisplay(5))}
                    max={Math.round(conversions.speed.toDisplay(60))}
                    step={1}
                    className="w-20 h-8 text-right"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center">
                    <Label className="text-xs">Trip Length Std Dev ({conversions.distance.unit}):</Label>
                    <InfoTooltip content="Standard deviation of trip lengths (how much individual car trips vary). Lower values mean most cars travel similar distances; higher values mean more variation." />
                  </div>
                  <Input
                    type="number"
                    value={conversions.distance.toDisplay(params.sigmaDistTripPlanned).toFixed(2)}
                    onChange={(e) => {
                      const displayValue = Number(e.target.value) || 0.1;
                      const internalValue = conversions.distance.fromDisplay(displayValue);
                      // Clamp sigmaDistTripPlanned to reasonable range (0.05 to 2 km or mi)
                      const value = Math.min(2, Math.max(0.05, internalValue));
                      onUpdateParams({ sigmaDistTripPlanned: value });
                    }}
                    min={conversions.distance.toDisplay(0.05)}
                    max={conversions.distance.toDisplay(2)}
                    step={0.01}
                    className="w-20 h-8 text-right"
                  />
                </div>
              </div>
              
              <div className="space-y-2 pt-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Label>Speed Limit ({conversions.speed.unit})</Label>
                    <InfoTooltip content="Maximum allowed speed in the simulation" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round(conversions.speed.toDisplay(params.speedLimit))} {conversions.speed.unit} ({Math.round(params.speedLimit / params.meanSpeed * 100)}% of desired speed)
                  </div>
                </div>
                <Input
                  id="speedLimit"
                  type="number"
                  value={Math.round(conversions.speed.toDisplay(params.speedLimit))}
                  onChange={(e) => {
                    const displayValue = Number(e.target.value);
                    const internalValue = conversions.speed.fromDisplay(displayValue);
                    onUpdateParams({ speedLimit: internalValue });
                  }}
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
            </CollapsibleSection>

            <Separator />

            {/* Advanced Parameters */}
            <CollapsibleSection title="Advanced Parameters" defaultCollapsed={true}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs">Freeway Length</Label>
                    <span className="text-xs text-muted-foreground">
                      {conversions.distance.toDisplay(params.freewayLength).toFixed(1)} {conversions.distance.unit}
                    </span>
                  </div>
                  <Slider
                    value={[params.freewayLength]}
                    onValueChange={([value]) => onUpdateParams({ freewayLength: value })}
                    min={1}
                    max={20}
                    step={1}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs">Time Headway</Label>
                    <span className="text-xs text-muted-foreground">
                      {params.tDist} seconds
                    </span>
                  </div>
                  <Slider
                    value={[params.tDist]}
                    onValueChange={([value]) => onUpdateParams({ tDist: value })}
                    min={1}
                    max={5}
                    step={0.5}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs">Mean Trip Distance</Label>
                    <span className="text-xs text-muted-foreground">
                      {conversions.distance.toDisplay(params.meanDistTripPlanned).toFixed(1)} {conversions.distance.unit}
                    </span>
                  </div>
                  <Slider
                    value={[params.meanDistTripPlanned]}
                    onValueChange={([value]) => onUpdateParams({ meanDistTripPlanned: value })}
                    min={1}
                    max={50}
                    step={1}
                  />
                </div>
              </div>
            </CollapsibleSection>

            <Separator />

            {/* Car Display Size */}
            {onCarSizeChange && (
              <CollapsibleSection title="Display Settings" defaultCollapsed={true}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Car Size: {carSize}px</Label>
                    <span className="text-xs text-muted-foreground">
                      {carSize < 20 ? 'Small' : carSize > 30 ? 'Large' : 'Medium'}
                    </span>
                  </div>
                  <Slider
                    value={[carSize]}
                    onValueChange={([value]) => onCarSizeChange(value)}
                    min={12}
                    max={48}
                    step={2}
                  />
                </div>
              </CollapsibleSection>
            )}

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

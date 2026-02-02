import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { AlertCircle } from "lucide-react";
import { SimulationParams, calculatePhysicalLimit } from "@/utils/trafficSimulation";
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
  showFreewayUI?: boolean;
  onShowFreewayUIChange?: (show: boolean) => void;
  showCharts?: boolean;
  onShowChartsChange?: (show: boolean) => void;
  showPackInformation?: boolean;
  onShowPackInformationChange?: (show: boolean) => void;
  showCarStats?: boolean;
  onShowCarStatsChange?: (show: boolean) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  onUpdateParams,
  onBatchImport,
  trafficRule,
  onTrafficRuleChange,
  carSize = 24,
  onCarSizeChange,
  unitSystem = 'metric',
  onUnitSystemChange,
  showFreewayUI = true,
  onShowFreewayUIChange,
  showCharts = true,
  onShowChartsChange,
  showPackInformation = true,
  onShowPackInformationChange,
  showCarStats = true,
  onShowCarStatsChange,
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
    const newDensity = parseFloat(value) || 10;
    onUpdateParams({ trafficDensity: newDensity });
  };

  const physicalLimit = calculatePhysicalLimit(params);
  const isOverLimit = overallDensity > physicalLimit;

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

            {/* Driver Behavior */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Label className="text-sm font-medium">Uniform Driver Behavior</Label>
                  <InfoTooltip content="When enabled, all drivers change lanes deterministically when conditions are favorable (no randomness). When disabled, drivers have different behaviors (aggressive, normal, conservative) with probability-based decisions." />
                </div>
                <Switch
                  checked={params.uniformDriverBehavior || false}
                  onCheckedChange={(checked) => onUpdateParams({ uniformDriverBehavior: checked })}
                />
              </div>
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
                    max="700"
                    step="0.5"
                  />
                  <span className="text-xs text-gray-500">{conversions.density.unit}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700].map((density) => (
                    <Button
                      key={density}
                      variant="outline"
                      size="sm"
                      className={`h-7 px-2 text-xs ${Math.abs(overallDensity - density) < 0.1 ? 'bg-primary/10' : ''} ${density > physicalLimit ? 'opacity-50 border-dashed' : ''}`}
                      onClick={() => handleOverallDensityChange(density.toString())}
                    >
                      {conversions.density.toDisplay(density).toFixed(0)}
                    </Button>
                  ))}
                </div>
                {isOverLimit && (
                  <div className="flex items-start gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-[10px] animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold">Density exceeds physical capacity!</p>
                      <p>At {params.numLanes} lanes, the road can only fit ~{conversions.density.toDisplay(physicalLimit).toFixed(0)} {conversions.density.unit} bumper-to-bumper. The simulation will clamp the car count to this limit.</p>
                    </div>
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  Physical limit: ~{conversions.density.toDisplay(physicalLimit).toFixed(0)} {conversions.density.unit} (clamped)
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
                    className="flex-1"
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
                      {duration < 60 ? `${duration}s` : duration === 60 ? '1 min' : duration < 300 ? `${duration / 60} mins` : duration === 600 ? '10 mins (max)' : `${duration / 60} mins`}
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
                    <Label className="text-xs">Minimum Speed ({conversions.speed.unit}):</Label>
                    <InfoTooltip content="The lowest possible desired speed for any vehicle. Clamps the random distribution." />
                  </div>
                  <Input
                    type="number"
                    value={Math.round(conversions.speed.toDisplay(params.minSpeed))}
                    onChange={(e) => {
                      const displayValue = Number(e.target.value) || 20;
                      const internalValue = conversions.speed.fromDisplay(displayValue);
                      // Clamp minSpeed to reasonable range (0 to meanSpeed)
                      const value = Math.min(params.meanSpeed, Math.max(0, internalValue));
                      onUpdateParams({ minSpeed: value });
                    }}
                    min={0}
                    max={Math.round(conversions.speed.toDisplay(params.meanSpeed))}
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
                  <Input
                    type="number"
                    value={Math.round(params.freewayLength)}
                    onChange={(e) => {
                      const value = Number(e.target.value) || 10;
                      onUpdateParams({ freewayLength: Math.min(20, Math.max(1, value)) });
                    }}
                    min="1"
                    max="20"
                    step="1"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs">Time Headway</Label>
                    <span className="text-xs text-muted-foreground">
                      {params.tDist} seconds
                    </span>
                  </div>
                  <Input
                    type="number"
                    value={params.tDist}
                    onChange={(e) => {
                      const value = Number(e.target.value) || 1.5;
                      onUpdateParams({ tDist: Math.min(5, Math.max(1, value)) });
                    }}
                    min="1"
                    max="5"
                    step="0.1"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs">Acceleration Reaction Time</Label>
                    <span className="text-xs text-muted-foreground">
                      {params.driverReactionTime?.toFixed(1) || '2.0'} seconds
                    </span>
                  </div>
                  <Input
                    type="number"
                    value={params.driverReactionTime ?? 2.0}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      onUpdateParams({ driverReactionTime: Math.min(10, Math.max(0, value)) });
                    }}
                    min="0"
                    max="10"
                    step="0.1"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs">Braking Reaction Time</Label>
                    <span className="text-xs text-muted-foreground">
                      {params.brakingReactionTime?.toFixed(1) || '1.0'} seconds
                    </span>
                  </div>
                  <Input
                    type="number"
                    value={params.brakingReactionTime ?? 1.0}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      onUpdateParams({ brakingReactionTime: Math.min(5, Math.max(0, value)) });
                    }}
                    min="0"
                    max="5"
                    step="0.1"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Label className="text-xs">Lane Change Cooldown</Label>
                      <InfoTooltip content="Minimum time between consecutive lane changes for the same vehicle (seconds)" />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {params.laneChangeCooldown || 5} seconds
                    </span>
                  </div>
                  <Input
                    type="number"
                    value={params.laneChangeCooldown ?? 5}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      onUpdateParams({ laneChangeCooldown: Math.min(60, Math.max(0, value)) });
                    }}
                    min="0"
                    max="60"
                    step="0.5"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs">Mean Trip Distance</Label>
                    <span className="text-xs text-muted-foreground">
                      {conversions.distance.toDisplay(params.meanDistTripPlanned).toFixed(1)} {conversions.distance.unit}
                    </span>
                  </div>
                  <Input
                    type="number"
                    value={Math.round(params.meanDistTripPlanned)}
                    onChange={(e) => {
                      const value = Number(e.target.value) || 10;
                      onUpdateParams({ meanDistTripPlanned: Math.min(50, Math.max(1, value)) });
                    }}
                    min="1"
                    max="50"
                    step="1"
                  />
                </div>
              </div>
            </CollapsibleSection>

            <Separator />

            {/* MOBIL Lane Change Settings */}
            <CollapsibleSection title="Lane Change (MOBIL) Settings" defaultCollapsed={true}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Label className="text-xs">Politeness Factor (p)</Label>
                      <InfoTooltip content="How much a driver considers the braking impact on others. 0 = purely selfish, 1 = altruistic." />
                    </div>
                    <span className="text-xs font-mono">{(params.mobilPoliteness ?? 0).toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[params.mobilPoliteness ?? 0]}
                    onValueChange={([val]) => onUpdateParams({ mobilPoliteness: val })}
                    min={0}
                    max={1}
                    step={0.1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Label className="text-xs">Follower Safe Decel (b_safe)</Label>
                      <InfoTooltip content="Maximum deceleration (m/s²) the driver is willing to force on the follower in the new lane. Typical: -2.0 to -4.0." />
                    </div>
                    <span className="text-xs font-mono">{params.mobilSafeDecel ?? -2.0} m/s²</span>
                  </div>
                  <Slider
                    value={[params.mobilSafeDecel ?? -2.0]}
                    onValueChange={([val]) => onUpdateParams({ mobilSafeDecel: val })}
                    min={-6}
                    max={-0.5}
                    step={0.1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Label className="text-xs">Self Safe Decel</Label>
                      <InfoTooltip content="Maximum deceleration (m/s²) the driver is willing to experience themselves to change lanes." />
                    </div>
                    <span className="text-xs font-mono">{params.mobilSelfSafeDecel ?? -3.0} m/s²</span>
                  </div>
                  <Slider
                    value={[params.mobilSelfSafeDecel ?? -3.0]}
                    onValueChange={([val]) => onUpdateParams({ mobilSelfSafeDecel: val })}
                    min={-8}
                    max={-1}
                    step={0.1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Label className="text-xs">Incentive Threshold (Δa)</Label>
                      <InfoTooltip content="Minimum acceleration gain (m/s²) required to trigger a lane change. Prevents 'chatter' between lanes." />
                    </div>
                    <span className="text-xs font-mono">{(params.accelerationThreshold ?? 0.2).toFixed(2)} m/s²</span>
                  </div>
                  <Slider
                    value={[params.accelerationThreshold ?? 0.2]}
                    onValueChange={([val]) => onUpdateParams({ accelerationThreshold: val })}
                    min={0.05}
                    max={1.0}
                    step={0.05}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Label className="text-xs">Speed Gain Threshold</Label>
                      <InfoTooltip content="Required speed advantage (km/h) of the target lane leader over the current leader to justify a change." />
                    </div>
                    <span className="text-xs font-mono">{Math.round(conversions.speed.toDisplay(params.mobilSpeedGainThreshold ?? 10))} {conversions.speed.unit}</span>
                  </div>
                  <Slider
                    value={[Math.round(conversions.speed.toDisplay(params.mobilSpeedGainThreshold ?? 10))]}
                    onValueChange={([val]) => {
                      const internalValue = conversions.speed.fromDisplay(val);
                      onUpdateParams({ mobilSpeedGainThreshold: internalValue });
                    }}
                    min={0}
                    max={Math.round(conversions.speed.toDisplay(40))}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Label className="text-xs">Stopped Leader Incentive</Label>
                      <InfoTooltip content="Extra incentive (m/s²) to change lanes when the current leader is completely stopped." />
                    </div>
                    <span className="text-xs font-mono">{(params.mobilStoppedIncentive ?? 3.0).toFixed(1)} m/s²</span>
                  </div>
                  <Slider
                    value={[params.mobilStoppedIncentive ?? 3.0]}
                    onValueChange={([val]) => onUpdateParams({ mobilStoppedIncentive: val })}
                    min={0}
                    max={10}
                    step={0.5}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Label className="text-xs">Decision Hysteresis</Label>
                      <InfoTooltip content="Time (seconds) a lane change must remain beneficial before it is executed. Prevents 'lane flickering'. Recommended: 1.0s to 5.0s." />
                    </div>
                    <span className="text-xs font-mono">{(params.laneChangeHysteresis ?? 1.0).toFixed(1)}s</span>
                  </div>
                  <Slider
                    value={[params.laneChangeHysteresis ?? 1.0]}
                    onValueChange={([val]) => onUpdateParams({ laneChangeHysteresis: val })}
                    min={0}
                    max={10}
                    step={0.5}
                  />
                </div>
              </div>
            </CollapsibleSection>

            <Separator />

            {/* Car Display Size */}
            {onCarSizeChange && (
              <CollapsibleSection title="Display Settings" defaultCollapsed={true}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Car Size: {carSize}px</Label>
                      <span className="text-xs text-muted-foreground">
                        {carSize < 20 ? 'Small' : carSize > 30 ? 'Large' : 'Medium'}
                      </span>
                    </div>
                    <Input
                      type="number"
                      value={carSize}
                      onChange={(e) => {
                        const value = Number(e.target.value) || 24;
                        onCarSizeChange(Math.min(48, Math.max(12, value)));
                      }}
                      min="12"
                      max="48"
                      step="2"
                      className="flex-1"
                    />
                  </div>

                  {onShowFreewayUIChange && (
                    <div className="flex items-center justify-between space-x-2 pt-2">
                      <div className="space-y-0.5">
                        <Label className="text-xs">Freeway Visualization</Label>
                        <div className="text-[10px] text-muted-foreground">
                          Disable to save system resources
                        </div>
                      </div>
                      <Switch
                        checked={showFreewayUI}
                        onCheckedChange={onShowFreewayUIChange}
                      />
                    </div>
                  )}

                  {onShowChartsChange && (
                    <div className="flex items-center justify-between space-x-2 pt-2">
                      <div className="space-y-0.5">
                        <Label className="text-xs">Statistics Charts</Label>
                        <div className="text-[10px] text-muted-foreground">
                          Disable to improve FPS/performance
                        </div>
                      </div>
                      <Switch
                        checked={showCharts}
                        onCheckedChange={onShowChartsChange}
                      />
                    </div>
                  )}

                  {onShowPackInformationChange && (
                    <div className="flex items-center justify-between space-x-2 pt-2 border-t">
                      <div className="space-y-0.5">
                        <Label className="text-xs">Show Pack Info</Label>
                        <div className="text-[10px] text-muted-foreground">
                          Analyze groups of cars
                        </div>
                      </div>
                      <Switch
                        checked={showPackInformation}
                        onCheckedChange={onShowPackInformationChange}
                      />
                    </div>
                  )}

                  {onShowCarStatsChange && (
                    <div className="flex items-center justify-between space-x-2 pt-2 border-t">
                      <div className="space-y-0.5">
                        <Label className="text-xs">Individual Car Stats</Label>
                        <div className="text-[10px] text-muted-foreground">
                          Disable to simplify the dashboard
                        </div>
                      </div>
                      <Switch
                        checked={showCarStats}
                        onCheckedChange={onShowCarStatsChange}
                      />
                    </div>
                  )}
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

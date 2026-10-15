import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  Sliders,
  Car as CarIcon,
  Cpu,
  Monitor,
  Gauge,
  Compass,
  ArrowRightLeft,
  Truck,
  Bike
} from "lucide-react";
import { SimulationParams, calculatePhysicalLimit, calculateStableDuration } from "@/utils/trafficSimulation";
import { JsonImportExport } from "./JsonImportExport";
import { InfoTooltip } from "./InfoTooltip";
import { UnitSystem, getUnitConversions } from "@/utils/unitConversion";

interface BatchSimulation {
  name?: string;
  duration: number;
  params: Partial<SimulationParams>;
  trafficRule?: 'american' | 'european';
  compareRegionalRules?: boolean;
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
    const clamped = Math.min(100, Math.max(0, value));
    const newVehicleTypeDensity = { ...params.vehicleTypeDensity, [vehicleType]: clamped };

    // Auto-normalize other types so sum is always 100
    const others = (['car', 'truck', 'motorcycle'] as const).filter((k) => k !== vehicleType);
    const remaining = 100 - clamped;
    const currentOtherSum = others.reduce((sum, k) => sum + (params.vehicleTypeDensity[k] || 0), 0);

    if (currentOtherSum > 0) {
      others.forEach((k) => {
        newVehicleTypeDensity[k] = Math.round(((params.vehicleTypeDensity[k] || 0) / currentOtherSum) * remaining);
      });
    } else {
      newVehicleTypeDensity[others[0]] = remaining;
      newVehicleTypeDensity[others[1]] = 0;
    }

    onUpdateParams({ vehicleTypeDensity: newVehicleTypeDensity });
  };

  const addLane = () => {
    if (params.numLanes < 6) {
      onUpdateParams({ numLanes: params.numLanes + 1 });
    }
  };

  const removeLane = () => {
    if (params.numLanes > 1) {
      onUpdateParams({ numLanes: params.numLanes - 1 });
    }
  };

  const overallDensity = params.trafficDensity || 10;

  const handleOverallDensityChange = (newDensity: number) => {
    const clamped = Math.max(1, newDensity);
    const updates: Partial<SimulationParams> = { trafficDensity: clamped };
    if (params.autoCalculateDuration) {
      updates.simulationDuration = calculateStableDuration(clamped);
    }
    onUpdateParams(updates);
  };

  const physicalLimit = calculatePhysicalLimit(params);
  const isOverLimit = overallDensity > physicalLimit;
  const capacityPct = Math.min(100, Math.round((overallDensity / (physicalLimit || 1)) * 100));

  return (
    <Card className="shadow-sm border-blue-100 bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-3 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-xl flex items-center gap-2 text-slate-800">
              <Sliders className="w-5 h-5 text-blue-600" />
              Simulation Settings & Parameters
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Configure road layout, traffic flow, driver AI, and presentation toggles
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onUnitSystemChange && (
              <ToggleGroup
                type="single"
                value={unitSystem}
                onValueChange={(val: UnitSystem) => val && onUnitSystemChange(val)}
                className="bg-slate-100 p-0.5 rounded-lg border text-xs"
              >
                <ToggleGroupItem value="metric" className="h-7 px-2 text-xs data-[state=on]:bg-white data-[state=on]:shadow-sm">
                  Metric (km/h)
                </ToggleGroupItem>
                <ToggleGroupItem value="imperial" className="h-7 px-2 text-xs data-[state=on]:bg-white data-[state=on]:shadow-sm">
                  Imperial (mph)
                </ToggleGroupItem>
              </ToggleGroup>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs defaultValue="scenario" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto p-1 bg-slate-100/80 rounded-xl mb-6 gap-1">
            <TabsTrigger value="scenario" className="flex items-center gap-2 py-2 data-[state=on]:bg-white data-[state=on]:text-blue-700 data-[state=on]:shadow-sm text-xs font-medium">
              <Compass className="w-4 h-4 text-blue-500" />
              Scenario & Density
            </TabsTrigger>
            <TabsTrigger value="fleet" className="flex items-center gap-2 py-2 data-[state=on]:bg-white data-[state=on]:text-blue-700 data-[state=on]:shadow-sm text-xs font-medium">
              <CarIcon className="w-4 h-4 text-emerald-500" />
              Fleet & Drivers
            </TabsTrigger>
            <TabsTrigger value="physics" className="flex items-center gap-2 py-2 data-[state=on]:bg-white data-[state=on]:text-blue-700 data-[state=on]:shadow-sm text-xs font-medium">
              <Cpu className="w-4 h-4 text-purple-500" />
              Physics & MOBIL
            </TabsTrigger>
            <TabsTrigger value="display" className="flex items-center gap-2 py-2 data-[state=on]:bg-white data-[state=on]:text-blue-700 data-[state=on]:shadow-sm text-xs font-medium">
              <Monitor className="w-4 h-4 text-amber-500" />
              Display & Tools
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: SCENARIO & DENSITY */}
          <TabsContent value="scenario" className="space-y-6 focus:outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Traffic Density & Capacity */}
              <div className="p-4 rounded-xl border bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Label className="font-semibold text-sm text-slate-800">Traffic Density</Label>
                    <InfoTooltip content="Number of vehicles per distance unit across all lanes. Higher density produces platoons and congestion." />
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-blue-700">
                      {conversions.density.toDisplay(overallDensity).toFixed(0)}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">{conversions.density.unit}</span>
                  </div>
                </div>

                {/* Capacity Meter */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Road Saturation: {capacityPct}%</span>
                    <span>Max Capacity: ~{conversions.density.toDisplay(physicalLimit).toFixed(0)} {conversions.density.unit}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        capacityPct > 85 ? 'bg-rose-500' : capacityPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, capacityPct)}%` }}
                    />
                  </div>
                </div>

                {/* Continuous Slider */}
                <Slider
                  value={[overallDensity]}
                  onValueChange={([val]) => handleOverallDensityChange(val)}
                  min={5}
                  max={Math.min(300, physicalLimit * 1.1)}
                  step={1}
                  className="py-1"
                />

                {/* 4 Intuitive Presets */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[
                    { label: "Light", val: 15, desc: "Free flow" },
                    { label: "Moderate", val: 35, desc: "Synchronized" },
                    { label: "Heavy", val: 75, desc: "Platoons" },
                    { label: "Gridlock", val: 140, desc: "Jam waves" },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handleOverallDensityChange(preset.val)}
                      type="button"
                      className={`px-2 py-1.5 rounded-lg border text-left transition-all ${
                        Math.abs(overallDensity - preset.val) <= 10
                          ? 'border-blue-500 bg-blue-50/80 text-blue-900 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-semibold">{preset.label}</div>
                      <div className="text-[10px] text-slate-400">{conversions.density.toDisplay(preset.val).toFixed(0)} {conversions.density.unit}</div>
                    </button>
                  ))}
                </div>

                {isOverLimit && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
                    <div>
                      <span className="font-semibold">Density exceeds physical capacity:</span> The roadway cannot fit more vehicles bumper-to-bumper. Density is clamped to prevent overlapping.
                    </div>
                  </div>
                )}
              </div>

              {/* Highway Layout & Rules */}
              <div className="p-4 rounded-xl border bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b">
                  <div className="flex items-center gap-1.5">
                    <Label className="font-semibold text-sm text-slate-800">Highway Lanes</Label>
                    <InfoTooltip content="Number of parallel traffic lanes (1 to 6 lanes supported)." />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={removeLane}
                      disabled={params.numLanes <= 1}
                      className="h-8 w-8 p-0"
                    >
                      -
                    </Button>
                    <span className="w-8 text-center font-bold text-sm text-slate-800">{params.numLanes}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addLane}
                      disabled={params.numLanes >= 6}
                      className="h-8 w-8 p-0"
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Freeway Length Control */}
                <div className="space-y-2 pb-2 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Label className="font-semibold text-xs text-slate-700">Freeway Length</Label>
                      <InfoTooltip content="Total distance of the freeway track. Increasing length provides more distance for shockwaves to travel and develop." />
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-blue-700">
                        {conversions.distance.toDisplay(params.freewayLength || 10).toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-500 ml-1">{conversions.distance.unit}</span>
                    </div>
                  </div>

                  <Slider
                    value={[params.freewayLength || 10]}
                    onValueChange={([val]) => onUpdateParams({ freewayLength: val })}
                    min={1}
                    max={30}
                    step={1}
                    className="py-1"
                  />

                  <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                    {[
                      { label: "1 km", km: 1 },
                      { label: "5 km", km: 5 },
                      { label: "10 km", km: 10 },
                      { label: "20 km", km: 20 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => onUpdateParams({ freewayLength: preset.km })}
                        className={`px-1.5 py-1 rounded text-center text-[11px] font-medium transition-all ${
                          (params.freewayLength || 10) === preset.km
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {conversions.distance.toDisplay(preset.km).toFixed(0)} {conversions.distance.unit}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Traffic Rule Card */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs font-semibold text-slate-700">Driving Culture / Regional Rule</Label>
                      <InfoTooltip content="American: Free lane changes in both directions. European: Strict keep-right law with left-side only overtaking." />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onTrafficRuleChange('american')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        trafficRule === 'american'
                          ? 'border-blue-600 bg-blue-50/80 text-blue-900 ring-1 ring-blue-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="font-semibold text-xs flex items-center justify-between">
                        American Rule
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">Pass Any Lane</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Free lane choice, faster overtaking on both left & right.</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => onTrafficRuleChange('european')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        trafficRule === 'european'
                          ? 'border-blue-600 bg-blue-50/80 text-blue-900 ring-1 ring-blue-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="font-semibold text-xs flex items-center justify-between">
                        European Rule
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">Keep Right</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Right-lane travel obligation, overtake strictly on left.</p>
                    </button>
                  </div>
                </div>

                {/* Duration & Stabilization */}
                <div className="pt-2 border-t space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs font-medium text-slate-700">Simulation Run Duration</Label>
                      <InfoTooltip content="Simulation time before completing (0 = unlimited continuous flow)." />
                    </div>
                    <span className="text-xs font-mono font-medium text-slate-600">
                      {params.simulationDuration === 0 ? "Unlimited" : `${params.simulationDuration}s`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 bg-white p-2.5 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="auto-calc"
                        checked={params.autoCalculateDuration || false}
                        onCheckedChange={(checked) => {
                          const updates: Partial<SimulationParams> = { autoCalculateDuration: checked };
                          if (checked) {
                            updates.simulationDuration = calculateStableDuration(params.trafficDensity);
                          }
                          onUpdateParams(updates);
                        }}
                      />
                      <Label htmlFor="auto-calc" className="text-xs text-slate-700 cursor-pointer">
                        Auto-stabilize duration based on density
                      </Label>
                    </div>

                    {!params.autoCalculateDuration && (
                      <div className="flex items-center gap-1">
                        {[60, 180, 300, 600].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => onUpdateParams({ simulationDuration: d })}
                            className={`px-2 py-1 rounded text-[10px] font-medium border transition-colors ${
                              params.simulationDuration === d
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                            }`}
                          >
                            {d >= 60 ? `${d / 60}m` : `${d}s`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: FLEET & DRIVERS */}
          <TabsContent value="fleet" className="space-y-6 focus:outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Vehicle Distribution */}
              <div className="p-4 rounded-xl border bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Label className="font-semibold text-sm text-slate-800">Vehicle Type Mix</Label>
                    <InfoTooltip content="Proportion of Cars, Trucks, and Motorcycles. The values automatically balance to 100%." />
                  </div>
                  <span className="text-xs text-slate-500 font-mono">Total: 100%</span>
                </div>

                {/* Visual Segmented Progress Bar */}
                <div className="w-full h-3 rounded-full overflow-hidden flex shadow-xs border">
                  <div
                    className="bg-blue-500 transition-all duration-300"
                    style={{ width: `${params.vehicleTypeDensity.car}%` }}
                    title={`Cars: ${params.vehicleTypeDensity.car}%`}
                  />
                  <div
                    className="bg-amber-500 transition-all duration-300"
                    style={{ width: `${params.vehicleTypeDensity.truck}%` }}
                    title={`Trucks: ${params.vehicleTypeDensity.truck}%`}
                  />
                  <div
                    className="bg-purple-500 transition-all duration-300"
                    style={{ width: `${params.vehicleTypeDensity.motorcycle}%` }}
                    title={`Motorcycles: ${params.vehicleTypeDensity.motorcycle}%`}
                  />
                </div>

                {/* Sliders for each vehicle type */}
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-blue-700 font-medium">
                        <CarIcon className="w-3.5 h-3.5" /> Cars
                      </span>
                      <span className="font-mono">{params.vehicleTypeDensity.car}%</span>
                    </div>
                    <Slider
                      value={[params.vehicleTypeDensity.car]}
                      onValueChange={([val]) => handleVehicleTypeDensityChange('car', val)}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                        <Truck className="w-3.5 h-3.5" /> Trucks (Slower, Longer)
                      </span>
                      <span className="font-mono">{params.vehicleTypeDensity.truck}%</span>
                    </div>
                    <Slider
                      value={[params.vehicleTypeDensity.truck]}
                      onValueChange={([val]) => handleVehicleTypeDensityChange('truck', val)}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-purple-700 font-medium">
                        <Bike className="w-3.5 h-3.5" /> Motorcycles (Agile)
                      </span>
                      <span className="font-mono">{params.vehicleTypeDensity.motorcycle}%</span>
                    </div>
                    <Slider
                      value={[params.vehicleTypeDensity.motorcycle]}
                      onValueChange={([val]) => handleVehicleTypeDensityChange('motorcycle', val)}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>
              </div>

              {/* Driver Behavior */}
              <div className="p-4 rounded-xl border bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b">
                  <div className="flex items-center gap-1.5">
                    <Label className="font-semibold text-sm text-slate-800">Driver Behavior & AI</Label>
                    <InfoTooltip content="Deterministic vs realistic heterogeneous driver personalities." />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border bg-white">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold text-slate-800">Uniform Driver Behavior</Label>
                    <p className="text-[11px] text-slate-500">
                      When active, all vehicles follow identical deterministic MOBIL decision thresholds.
                    </p>
                  </div>
                  <Switch
                    checked={params.uniformDriverBehavior || false}
                    onCheckedChange={(checked) => onUpdateParams({ uniformDriverBehavior: checked })}
                  />
                </div>

                {/* Speed Limit Settings */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs font-semibold text-slate-800">Speed Limit</Label>
                      <InfoTooltip content="Regulatory highway speed cap." />
                    </div>
                    <span className="text-xs font-mono font-bold text-blue-700">
                      {Math.round(conversions.speed.toDisplay(params.speedLimit))} {conversions.speed.unit}
                    </span>
                  </div>

                  <Slider
                    value={[Math.round(conversions.speed.toDisplay(params.speedLimit))]}
                    onValueChange={([val]) => onUpdateParams({ speedLimit: conversions.speed.fromDisplay(val) })}
                    min={Math.round(conversions.speed.toDisplay(40))}
                    max={Math.round(conversions.speed.toDisplay(160))}
                    step={5}
                  />

                  <div className="flex gap-2 pt-1">
                    {[60, 90, 110, 130, 150].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => onUpdateParams({ speedLimit: spd })}
                        className={`px-2 py-1 rounded text-[10px] font-medium border flex-1 transition-colors ${
                          Math.abs(params.speedLimit - spd) < 5
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {Math.round(conversions.speed.toDisplay(spd))} {conversions.speed.unit}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: PHYSICS & MOBIL */}
          <TabsContent value="physics" className="space-y-6 focus:outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* IDM Following Dynamics */}
              <div className="p-4 rounded-xl border bg-slate-50/50 space-y-4">
                <Label className="font-semibold text-sm text-slate-800 flex items-center gap-1.5 pb-2 border-b">
                  <Gauge className="w-4 h-4 text-purple-600" />
                  Intelligent Driver Model (IDM) Physics
                </Label>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1">
                        Time Headway (T)
                        <InfoTooltip content="Desired time gap behind the car in front (seconds)." />
                      </span>
                      <span className="font-mono text-purple-700 font-bold">{params.tDist}s</span>
                    </div>
                    <Slider
                      value={[params.tDist]}
                      onValueChange={([val]) => onUpdateParams({ tDist: val })}
                      min={0.8}
                      max={3.0}
                      step={0.1}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1">
                        Max Comfortable Acceleration (a)
                        <InfoTooltip content="Maximum forward acceleration in m/s²." />
                      </span>
                      <span className="font-mono text-purple-700 font-bold">{params.aMax || 1.4} m/s²</span>
                    </div>
                    <Slider
                      value={[params.aMax || 1.4]}
                      onValueChange={([val]) => onUpdateParams({ aMax: val })}
                      min={0.8}
                      max={3.0}
                      step={0.1}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1">
                        Acceleration Reaction Time
                        <InfoTooltip content="Human driver perception delay before accelerating." />
                      </span>
                      <span className="font-mono text-purple-700 font-bold">{params.driverReactionTime ?? 2.0}s</span>
                    </div>
                    <Slider
                      value={[params.driverReactionTime ?? 2.0]}
                      onValueChange={([val]) => onUpdateParams({ driverReactionTime: val })}
                      min={0.2}
                      max={4.0}
                      step={0.1}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1">
                        Braking Reaction Time
                        <InfoTooltip content="Human driver perception delay before braking." />
                      </span>
                      <span className="font-mono text-purple-700 font-bold">{params.brakingReactionTime ?? 1.0}s</span>
                    </div>
                    <Slider
                      value={[params.brakingReactionTime ?? 1.0]}
                      onValueChange={([val]) => onUpdateParams({ brakingReactionTime: val })}
                      min={0.1}
                      max={2.5}
                      step={0.1}
                    />
                  </div>
                </div>
              </div>

              {/* MOBIL Lane-Changing Parameters */}
              <div className="p-4 rounded-xl border bg-slate-50/50 space-y-4">
                <Label className="font-semibold text-sm text-slate-800 flex items-center gap-1.5 pb-2 border-b">
                  <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                  MOBIL Lane Change Decision Parameters
                </Label>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1">
                        Politeness Factor (p)
                        <InfoTooltip content="0 = purely selfish, 1 = altruistic (avoids braking cars behind)." />
                      </span>
                      <span className="font-mono text-blue-700 font-bold">{(params.mobilPoliteness ?? 0).toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[params.mobilPoliteness ?? 0]}
                      onValueChange={([val]) => onUpdateParams({ mobilPoliteness: val })}
                      min={0}
                      max={1}
                      step={0.1}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1">
                        Safe Deceleration (b_safe)
                        <InfoTooltip content="Maximum braking force allowed on follower behind in the new lane." />
                      </span>
                      <span className="font-mono text-blue-700 font-bold">{params.mobilSafeDecel ?? -4.0} m/s²</span>
                    </div>
                    <Slider
                      value={[params.mobilSafeDecel ?? -4.0]}
                      onValueChange={([val]) => onUpdateParams({ mobilSafeDecel: val })}
                      min={-6}
                      max={-1}
                      step={0.2}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1">
                        Incentive Threshold (Δa)
                        <InfoTooltip content="Minimum acceleration advantage needed to justify changing lanes." />
                      </span>
                      <span className="font-mono text-blue-700 font-bold">{(params.accelerationThreshold ?? 0.2).toFixed(2)} m/s²</span>
                    </div>
                    <Slider
                      value={[params.accelerationThreshold ?? 0.2]}
                      onValueChange={([val]) => onUpdateParams({ accelerationThreshold: val })}
                      min={0.05}
                      max={0.8}
                      step={0.05}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1">
                        Lane Change Cooldown
                        <InfoTooltip content="Mandatory rest time between back-to-back lane changes." />
                      </span>
                      <span className="font-mono text-blue-700 font-bold">{params.laneChangeCooldown ?? 10}s</span>
                    </div>
                    <Slider
                      value={[params.laneChangeCooldown ?? 10]}
                      onValueChange={([val]) => onUpdateParams({ laneChangeCooldown: val })}
                      min={2}
                      max={30}
                      step={1}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: DISPLAY & TOOLS */}
          <TabsContent value="display" className="space-y-6 focus:outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Display & Performance Toggles */}
              <div className="p-4 rounded-xl border bg-slate-50/50 space-y-3">
                <Label className="font-semibold text-sm text-slate-800 pb-2 border-b block">
                  Dashboard & Visualization Toggles
                </Label>

                {onShowFreewayUIChange && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-medium text-slate-800">Freeway Track Canvas</Label>
                      <p className="text-[10px] text-slate-400">Disable rendering to run high-speed headless benchmarks</p>
                    </div>
                    <Switch checked={showFreewayUI} onCheckedChange={onShowFreewayUIChange} />
                  </div>
                )}

                {onShowChartsChange && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-medium text-slate-800">Statistical Charts Dashboard</Label>
                      <p className="text-[10px] text-slate-400">Throughput, density, and speed time-series charts</p>
                    </div>
                    <Switch checked={showCharts} onCheckedChange={onShowChartsChange} />
                  </div>
                )}

                {onShowPackInformationChange && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-medium text-slate-800">Platoon & Pack Brackets</Label>
                      <p className="text-[10px] text-slate-400">Show visual connection bands between grouped vehicles</p>
                    </div>
                    <Switch checked={showPackInformation} onCheckedChange={onShowPackInformationChange} />
                  </div>
                )}

                {onShowCarStatsChange && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-medium text-slate-800">Individual Car Inspector</Label>
                      <p className="text-[10px] text-slate-400">Searchable list card for vehicle-by-vehicle telemetry</p>
                    </div>
                    <Switch checked={showCarStats} onCheckedChange={onShowCarStatsChange} />
                  </div>
                )}

                {onCarSizeChange && (
                  <div className="pt-2">
                    <div className="flex justify-between text-xs pb-1">
                      <span className="text-slate-600">Car Render Scale: {carSize}px</span>
                      <span className="text-slate-400 font-mono">{carSize < 20 ? 'Small' : carSize > 30 ? 'Large' : 'Normal'}</span>
                    </div>
                    <Slider
                      value={[carSize]}
                      onValueChange={([val]) => onCarSizeChange(val)}
                      min={14}
                      max={40}
                      step={2}
                    />
                  </div>
                )}
              </div>

              {/* JSON Scenario Import / Export */}
              <div className="p-4 rounded-xl border bg-slate-50/50 space-y-4">
                <Label className="font-semibold text-sm text-slate-800 pb-2 border-b block">
                  Scenario Import / Export
                </Label>
                <p className="text-xs text-slate-500">
                  Save current configuration as JSON or load pre-built research benchmarks and sweep queues.
                </p>

                <div className="bg-white p-3 rounded-xl border">
                  <JsonImportExport
                    onImport={onUpdateParams}
                    onBatchImport={onBatchImport}
                    currentParams={params}
                    trafficRule={trafficRule}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ControlPanel;

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Calendar, Clock, Copy, Edit2, Eye, FileDown, Gauge, Info, Repeat, Trash2, Users, FolderInput } from "lucide-react";
import EditSimulationNameDialog from "@/components/EditSimulationNameDialog";
import ChartDashboard from "@/components/ChartDashboard";
import { SavedSimulation } from "@/services/simulationService";
import { UnitSystem } from "@/utils/unitConversion";

interface SimulationCardProps {
    simulation: SavedSimulation;
    unitConversions: any; // Using any for simplicity as getting the exact type might be complex without exporting it
    calculateNumCars: (simulation: SavedSimulation) => number;
    formatDate: (timestamp: number) => string;
    formatDuration: (seconds: number) => string;
    updateSimulationDetails: (id: string, name: string, folder?: string) => void;
    handleExportSimulation: (simulation: SavedSimulation) => void;
    setSelectedSimulation: (simulation: SavedSimulation) => void;
    copySimulationParams: (simulation: SavedSimulation) => void;
    deleteSimulation: (id: string) => void;
    unitSystem: UnitSystem;
    onMoveToFolder: (simulation: SavedSimulation) => void;
    isSelected?: boolean;
    onSelectionChange?: (id: string, checked: boolean) => void;
}

const SimulationCard: React.FC<SimulationCardProps> = ({
    simulation,
    unitConversions,
    calculateNumCars,
    formatDate,
    formatDuration,
    updateSimulationDetails,
    handleExportSimulation,
    setSelectedSimulation,
    copySimulationParams,
    deleteSimulation,
    unitSystem,
    onMoveToFolder,
    isSelected,
    onSelectionChange
}) => {
    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-3">
                    {onSelectionChange && (
                        <div className="pt-1">
                            <Checkbox
                                id={`select-${simulation.id}`}
                                checked={isSelected}
                                onCheckedChange={(checked) => onSelectionChange(simulation.id, checked as boolean)}
                            />
                        </div>
                    )}
                    <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <span>{simulation.name}</span>
                            <Badge variant="secondary">#{simulation.simulationNumber}</Badge>
                            <EditSimulationNameDialog
                                currentName={simulation.name}
                                currentFolder={simulation.folder}
                                onSave={(newName, newFolder) => updateSimulationDetails(simulation.id, newName, newFolder)}
                            />
                        </CardTitle>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <Calendar size={14} />
                            {formatDate(simulation.timestamp)}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <Users size={16} className="text-blue-500" />
                        <span>{calculateNumCars(simulation)} cars</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-400 rounded"></div>
                        <span>{simulation.params.numLanes} lanes</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Gauge size={16} className="text-green-500" />
                        <span>{unitConversions.speed.toDisplay(simulation.finalStats.averageSpeed).toFixed(1)} {unitConversions.speed.unit} avg</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-purple-500" />
                        <span>{formatDuration(simulation.duration)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Repeat size={16} className="text-amber-500" />
                        <span>{simulation.finalStats.laneChanges} lane changes</span>
                    </div>
                    {simulation.finalStats.perLaneThroughputs && simulation.finalStats.perLaneThroughputs.length > 0 && (
                        <div className="col-span-2 pt-2">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-medium text-gray-500">Per-Lane Throughput</span>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button className="text-muted-foreground hover:text-foreground">
                                                <Info className="h-3 w-3" />
                                                <span className="sr-only">How is this calculated?</span>
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-[300px] p-4">
                                            <p className="font-medium mb-2">How throughput is calculated:</p>
                                            <p className="text-sm mb-1">For each lane:</p>
                                            <ul className="text-xs space-y-1 list-disc pl-4">
                                                <li>Average speed = Sum of all car speeds / number of cars</li>
                                                <li>Density = Number of cars / lane length (in km)</li>
                                                <li>Throughput = Average speed × Density (cars/hour)</li>
                                            </ul>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {simulation.finalStats.perLaneThroughputs.map((throughput, idx) => {
                                    const laneName = idx === 0 ? 'L' :
                                        idx === simulation.finalStats.perLaneThroughputs.length - 1 ? 'R' :
                                            `L${idx + 1}`;
                                    const numLanes = simulation.params.numLanes || 3;
                                    const freewayLength = simulation.params.freewayLength || 1;
                                    const laneCars = simulation.finalStats.totalCars * (1 / numLanes);
                                    const avgSpeed = throughput / (laneCars / freewayLength) || 0;

                                    return (
                                        <TooltipProvider key={idx}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-1.5 border rounded px-2 py-1 bg-muted/20 cursor-help">
                                                        <span className="text-xs font-medium text-muted-foreground">{laneName}:</span>
                                                        <span className="text-sm font-bold">{Math.round(throughput)}</span>
                                                        <span className="text-xs text-muted-foreground">cars/hr</span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-[300px] p-3 text-sm" side="top">
                                                    <p className="font-medium mb-1">{idx === 0 ? 'Left' : idx === simulation.finalStats.perLaneThroughputs.length - 1 ? 'Right' : `Lane ${idx + 1}`}</p>
                                                    <p className="text-sm">
                                                        {laneCars.toFixed(0)} cars • {avgSpeed.toFixed(1)} {unitConversions.speed.unit}
                                                    </p>
                                                    <p className="mt-1 text-muted-foreground text-xs">
                                                        = {throughput.toFixed(1)} cars/hour
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t gap-2">
                    <Badge variant="outline" className="capitalize">
                        {simulation.trafficRule}
                    </Badge>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleExportSimulation(simulation);
                            }}
                            title="Export simulation"
                        >
                            <FileDown size={16} />
                        </Button>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedSimulation(simulation)}
                                >
                                    <Eye size={16} />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-0">
                                <div className="p-6 space-y-6">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2">
                                            {simulation.name} - Simulation #{simulation.simulationNumber}
                                            <Badge variant="outline" className="capitalize">
                                                {simulation.trafficRule}
                                            </Badge>
                                        </DialogTitle>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Users size={16} className="text-blue-500" />
                                                <span>{calculateNumCars(simulation)} cars</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 bg-gray-400 rounded"></div>
                                                <span>{simulation.params.numLanes} lanes</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Gauge size={16} className="text-green-500" />
                                                <span>{unitConversions.speed.toDisplay(simulation.finalStats.averageSpeed).toFixed(1)} {unitConversions.speed.unit} avg</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Repeat size={16} className="text-amber-500" />
                                                <span>{simulation.finalStats.laneChanges} lane changes</span>
                                            </div>
                                        </div>
                                    </DialogHeader>

                                    {/* Per-Lane Throughput Section */}
                                    {simulation.finalStats.perLaneThroughputs?.length > 0 && (
                                        <div className="p-4 border rounded-lg bg-muted/10">
                                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                                Per-Lane Throughput (cars/hour)
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button className="text-muted-foreground hover:text-foreground">
                                                                <Info className="h-4 w-4" />
                                                                <span className="sr-only">How is this calculated?</span>
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="max-w-[300px] p-4">
                                                            <p className="font-medium mb-2">How throughput is calculated:</p>
                                                            <p className="text-sm mb-1">For each lane:</p>
                                                            <ul className="text-xs space-y-1 list-disc pl-4">
                                                                <li>Average speed = Sum of all car speeds / number of cars</li>
                                                                <li>Density = Number of cars / lane length (in km)</li>
                                                                <li>Throughput = Average speed × Density (cars/hour)</li>
                                                            </ul>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </h3>
                                            <div className="flex flex-wrap gap-3">
                                                {simulation.finalStats.perLaneThroughputs.map((throughput, idx) => {
                                                    const laneName = idx === 0 ? 'Left' :
                                                        idx === simulation.finalStats.perLaneThroughputs.length - 1 ? 'Right' :
                                                            `L${idx + 1}`;
                                                    const numLanes = simulation.params.numLanes || 3;
                                                    const freewayLength = simulation.params.freewayLength || 1;
                                                    const laneCars = simulation.finalStats.totalCars * (1 / numLanes);
                                                    const avgSpeed = throughput / (laneCars / freewayLength) || 0;

                                                    return (
                                                        <TooltipProvider key={idx}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-background cursor-help">
                                                                        <span className="text-sm font-medium text-muted-foreground">{laneName}:</span>
                                                                        <span className="text-lg font-bold">{Math.round(throughput)}</span>
                                                                        <span className="text-xs text-muted-foreground">cars/hr</span>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="max-w-[300px] p-3 text-sm" side="top">
                                                                    <p className="font-medium mb-1">{laneName} Calculation:</p>
                                                                    <p className="text-sm">
                                                                        {laneCars.toFixed(0)} cars • {avgSpeed.toFixed(1)} {unitConversions.speed.unit}
                                                                    </p>
                                                                    <p className="mt-1 text-muted-foreground text-xs">
                                                                        = {throughput.toFixed(1)} cars/hour
                                                                    </p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t">
                                    <ChartDashboard
                                        cars={[]}
                                        elapsedTime={simulation.duration}
                                        laneLength={1000}
                                        params={simulation.params}
                                        trafficRule={simulation.trafficRule}
                                        unitSystem={unitSystem}
                                        speedDensityHistory={simulation.chartData.speedByLaneHistory}
                                        densityOfCarPacksHistory={simulation.chartData.densityOfCarPacksHistory}
                                        percentageByLaneHistory={simulation.chartData.percentageByLaneHistory}
                                        densityThroughputHistory={simulation.chartData.densityThroughputHistory}
                                        laneThroughputHistory={simulation.chartData.laneThroughputHistory || []}
                                        laneUtilizationHistory={simulation.chartData.laneUtilizationHistory || []}
                                        packHistory={simulation.chartData.packHistory}
                                        packLengthHistory={simulation.chartData.packLengthHistory}
                                        packsPerLaneHistory={simulation.chartData.packsPerLaneHistory || []}
                                        showPackFormation={true}
                                    />
                                </div>
                            </DialogContent>
                        </Dialog>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                copySimulationParams(simulation);
                            }}
                            title="Copy simulation parameters"
                        >
                            <Copy size={16} />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteSimulation(simulation.id);
                            }}
                            className="text-red-600 hover:text-red-700"
                            title="Delete simulation"
                        >
                            <Trash2 size={16} />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onMoveToFolder(simulation);
                            }}
                            title="Move to folder"
                        >
                            <FolderInput size={16} />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default SimulationCard;

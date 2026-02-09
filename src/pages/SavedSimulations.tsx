import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, useUser, SignInButton } from "@clerk/clerk-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { BarChart3, Calendar, CheckSquare, Clock, Copy, Edit2, Eye, FileDown, FileUp, Gauge, Info, Plus, Repeat, Square, Trash2, Users, Folder, FolderPlus, FolderInput, ChevronDown, ChevronRight, FolderEdit } from "lucide-react";
import { exportSimulation, importSimulation, triggerFileInput } from "@/utils/simulationExport";
import { simulationService, SavedSimulation } from "@/services/simulationService";
import { useToast } from "@/hooks/use-toast";
import { extractSimulationParams, formatParamsWithUnits } from "../utils/simulationUtils";
import { UnitSystem, getUnitConversions } from "@/utils/unitConversion";
import ChartDashboard from "@/components/ChartDashboard";
import EditSimulationNameDialog from "@/components/EditSimulationNameDialog";
import MoveToFolderDialog from "@/components/MoveToFolderDialog";
import RenameFolderDialog from "@/components/RenameFolderDialog";
import DeleteFolderDialog from "@/components/DeleteFolderDialog";
import OverlayThroughputDensityChart from "@/components/OverlayThroughputDensityChart";
import OverlayLaneThroughputDensityChart from "@/components/OverlayLaneThroughputDensityChart";
import OverlaySpeedDensityChart from "@/components/OverlaySpeedDensityChart";
import OverlayLaneChangesDensityChart from "@/components/OverlayLaneChangesDensityChart";
import OverlayPackFormationDensityChart from "@/components/OverlayPackFormationDensityChart";
import DensityLaneDistributionChart from "@/components/DensityLaneDistributionChart";
import Footer from "@/components/Footer";
import SimulationCard from "@/components/SimulationCard";

// Sub-component for the collapsible selection list
const ComparisonSelectionList: React.FC<{
  savedSimulations: SavedSimulation[];
  selectedForComparison: Set<string>;
  onSelectionChange: (id: string, checked: boolean) => void;
  calculateNumCars: (sim: SavedSimulation) => number;
  updateSimulationDetails: (id: string, name: string, folder?: string) => void;
  deleteSimulation: (id: string) => void;
  openMoveDialogForSingle: (sim: SavedSimulation) => void;
  existingFolders: string[];
  onRenameFolder: (oldName: string, newName: string) => Promise<void>;
  onDeleteFolder: (folderName: string, deleteAll?: boolean) => Promise<void>;
}> = ({
  savedSimulations,
  selectedForComparison,
  onSelectionChange,
  calculateNumCars,
  updateSimulationDetails,
  deleteSimulation,
  openMoveDialogForSingle,
  existingFolders,
  onRenameFolder,
  onDeleteFolder
}) => {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
    const [deletingFolder, setDeletingFolder] = useState<string | null>(null);

    // Group simulations
    const groupedSimulations: { [key: string]: SavedSimulation[] } = {};
    const uncategorized: SavedSimulation[] = [];

    savedSimulations.forEach(sim => {
      if (sim.folder && sim.folder.trim()) {
        if (!groupedSimulations[sim.folder]) {
          groupedSimulations[sim.folder] = [];
        }
        groupedSimulations[sim.folder].push(sim);
      } else {
        uncategorized.push(sim);
      }
    });

    const folders = Object.keys(groupedSimulations).sort();

    const toggleFolder = (folder: string) => {
      setExpandedFolders(prev => {
        const newSet = new Set(prev);
        if (newSet.has(folder)) {
          newSet.delete(folder);
        } else {
          newSet.add(folder);
        }
        return newSet;
      });
    };

    const toggleFolderSelection = (folder: string, checked: boolean | 'indeterminate') => {
      if (checked === 'indeterminate') return;
      const simsInFolder = groupedSimulations[folder];
      simsInFolder.forEach(sim => {
        onSelectionChange(sim.id, !!checked);
      });
    };

    const renderSimulationItem = (simulation: SavedSimulation) => (
      <div key={simulation.id} className="flex items-center space-x-3 p-3 border rounded-lg bg-card">
        <Checkbox
          id={`comparison-${simulation.id}`}
          checked={selectedForComparison.has(simulation.id)}
          onCheckedChange={(checked) => onSelectionChange(simulation.id, checked as boolean)}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <label
              htmlFor={`comparison-${simulation.id}`}
              className="text-sm font-medium cursor-pointer truncate"
            >
              {simulation.name}
            </label>
            <Badge variant="secondary" className="text-xs">
              #{simulation.simulationNumber}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">
              {calculateNumCars(simulation)} cars, {simulation.params.numLanes} lanes
            </span>
            <div className="flex gap-1">
              <EditSimulationNameDialog
                currentName={simulation.name}
                currentFolder={simulation.folder}
                onSave={(newName, newFolder) => updateSimulationDetails(simulation.id, newName, newFolder)}
                trigger={
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Edit2 size={12} />
                  </Button>
                }
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                onClick={() => deleteSimulation(simulation.id)}
              >
                <Trash2 size={12} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openMoveDialogForSingle(simulation)}
                title="Move to folder"
                className="h-6 w-6 p-0"
              >
                <FolderInput size={12} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <div className="space-y-4">
        {savedSimulations.length > 0 && (
          <div className="flex items-center gap-2 mb-2 p-2 bg-muted/20 rounded-lg">
            <Checkbox
              id="select-all-comparison"
              checked={savedSimulations.every(s => selectedForComparison.has(s.id))}
              onCheckedChange={(checked) => {
                savedSimulations.forEach(sim => onSelectionChange(sim.id, !!checked));
              }}
            />
            <Label htmlFor="select-all-comparison" className="text-sm font-medium cursor-pointer">
              Select All {savedSimulations.length} for Comparison
            </Label>
          </div>
        )}

        {folders.map(folder => {
          const sims = groupedSimulations[folder];
          const allSelected = sims.every(s => selectedForComparison.has(s.id));
          const someSelected = sims.some(s => selectedForComparison.has(s.id));
          const isExpanded = expandedFolders.has(folder);

          return (
            <div key={folder} className="border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 p-3 bg-muted/30 hover:bg-muted/50 transition-colors">
                <button onClick={() => toggleFolder(folder)} className="p-1 hover:bg-muted rounded text-gray-500">
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>

                <div className="flex items-center gap-3 flex-1">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={(c) => toggleFolderSelection(folder, c)}
                  />
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleFolder(folder)}>
                    <Folder size={18} className="text-blue-500" />
                    <span className="font-semibold">{folder}</span>
                    <Badge variant="outline" className="ml-1 text-xs">{sims.length}</Badge>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenamingFolder(folder);
                    }}
                    title="Rename folder"
                  >
                    <FolderEdit size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingFolder(folder);
                    }}
                    title="Delete folder"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 border-t bg-slate-50/50">
                  {sims.map(renderSimulationItem)}
                </div>
              )}
            </div>
          );
        })}

        {uncategorized.length > 0 && (
          <div className="space-y-2 mt-4">
            <div className="flex items-center gap-2 pb-2 px-1">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Uncategorized</span>
              <div className="h-px bg-border flex-1" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {uncategorized.map(renderSimulationItem)}
            </div>
          </div>
        )}

        {savedSimulations.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No simulations available to select.
          </div>
        )}

        {/* Folder Management Dialogs */}
        {renamingFolder && (
          <RenameFolderDialog
            isOpen={true}
            onClose={() => setRenamingFolder(null)}
            currentFolderName={renamingFolder}
            existingFolders={existingFolders}
            simulationCount={groupedSimulations[renamingFolder]?.length || 0}
            onRename={async (newName) => {
              await onRenameFolder(renamingFolder, newName);
              setRenamingFolder(null);
            }}
          />
        )}

        {deletingFolder && (
          <DeleteFolderDialog
            isOpen={true}
            onClose={() => setDeletingFolder(null)}
            folderName={deletingFolder}
            simulationCount={groupedSimulations[deletingFolder]?.length || 0}
            onDelete={async (deleteAll) => {
              await onDeleteFolder(deletingFolder, deleteAll);
              setDeletingFolder(null);
            }}
          />
        )}
      </div>
    );
  };

const IndividualSimulationList: React.FC<{
  savedSimulations: SavedSimulation[];
  unitConversions: any;
  calculateNumCars: (sim: SavedSimulation) => number;
  formatDate: (timestamp: number) => string;
  formatDuration: (seconds: number) => string;
  updateSimulationDetails: (id: string, name: string, folder?: string) => void;
  handleExportSimulation: (sim: SavedSimulation) => void;
  setSelectedSimulation: (sim: SavedSimulation | null) => void;
  copySimulationParams: (sim: SavedSimulation) => void;
  deleteSimulation: (id: string) => void;
  unitSystem: UnitSystem;
  openMoveDialogForSingle: (sim: SavedSimulation) => void;
  selectedIds: Set<string>;
  onSelectionChange: (id: string, checked: boolean) => void;
  existingFolders: string[];
  onRenameFolder: (oldName: string, newName: string) => Promise<void>;
  onDeleteFolder: (folderName: string, deleteAll?: boolean) => Promise<void>;
  viewMode: 'folders' | 'individual';
  onSelectAll: (checked: boolean) => void;
  allPageSelected: boolean;
}> = ({
  savedSimulations,
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
  openMoveDialogForSingle,
  selectedIds,
  onSelectionChange,
  existingFolders,
  onRenameFolder,
  onDeleteFolder,
  viewMode,
  onSelectAll,
  allPageSelected
}) => {
    // Default to all folders expanded? Or perhaps keep track of expanded set.
    // Let's default to expanded for better initial visibility, or track collapsed ones.
    // Tracking collapsed might be better if we want everything open by default.
    // Actually, toggling "Expanded" is standard. Let's start with all folders expand or empty?
    // User request: "collapsible button". Usually implies start open or closed. "Show me the folders from which I can select... then I am able to see simulations" implies start CLOSED.
    // "AT first only the folders and uncategorized simulations..." -> Start CLOSED.

    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
    const [deletingFolder, setDeletingFolder] = useState<string | null>(null);

    const groupedSimulations: { [key: string]: SavedSimulation[] } = {};
    const uncategorized: SavedSimulation[] = [];

    savedSimulations.forEach(sim => {
      if (sim.folder && sim.folder.trim()) {
        if (!groupedSimulations[sim.folder]) {
          groupedSimulations[sim.folder] = [];
        }
        groupedSimulations[sim.folder].push(sim);
      } else {
        uncategorized.push(sim);
      }
    });

    const folders = Object.keys(groupedSimulations).sort();

    const toggleFolder = (folder: string) => {
      setExpandedFolders(prev => {
        const newSet = new Set(prev);
        if (newSet.has(folder)) {
          newSet.delete(folder);
        } else {
          newSet.add(folder);
        }
        return newSet;
      });
    };

    return (
      <div className="space-y-4">
        {savedSimulations.length > 0 && (
          <div className="flex items-center gap-2 mb-4 p-2 bg-muted/20 rounded-lg">
            <Checkbox
              id="select-all-individual"
              checked={allPageSelected}
              onCheckedChange={(checked) => onSelectAll(checked as boolean)}
            />
            <Label htmlFor="select-all-individual" className="text-sm font-medium cursor-pointer">
              Select All {savedSimulations.length} on this page
            </Label>
          </div>
        )}

        {viewMode === 'individual' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedSimulations.map(simulation => (
              <SimulationCard
                key={simulation.id}
                simulation={simulation}
                unitConversions={unitConversions}
                calculateNumCars={calculateNumCars}
                formatDate={formatDate}
                formatDuration={formatDuration}
                updateSimulationDetails={updateSimulationDetails}
                handleExportSimulation={handleExportSimulation}
                setSelectedSimulation={setSelectedSimulation}
                copySimulationParams={copySimulationParams}
                deleteSimulation={deleteSimulation}
                unitSystem={unitSystem}
                onMoveToFolder={openMoveDialogForSingle}
                isSelected={selectedIds.has(simulation.id)}
                onSelectionChange={onSelectionChange}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {folders.map(folder => {
              const sims = groupedSimulations[folder];
              const isExpanded = expandedFolders.has(folder);

              return (
                <div key={folder} className="border rounded-lg bg-card overflow-hidden">
                  <div
                    className="flex items-center gap-2 p-4 bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => toggleFolder(folder)}
                  >
                    <button className="p-1 hover:bg-muted rounded text-gray-500">
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                    <Folder className="h-5 w-5 text-blue-500" />
                    <h2 className="text-xl font-semibold text-gray-800 select-none">{folder}</h2>
                    <Badge variant="secondary" className="ml-2">{sims.length}</Badge>

                    <div className="ml-auto flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingFolder(folder);
                        }}
                        title="Rename folder"
                      >
                        <FolderEdit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingFolder(folder);
                        }}
                        title="Delete folder"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 border-t">
                      {sims.map(simulation => (
                        <SimulationCard
                          key={simulation.id}
                          simulation={simulation}
                          unitConversions={unitConversions}
                          calculateNumCars={calculateNumCars}
                          formatDate={formatDate}
                          formatDuration={formatDuration}
                          updateSimulationDetails={updateSimulationDetails}
                          handleExportSimulation={handleExportSimulation}
                          setSelectedSimulation={setSelectedSimulation}
                          copySimulationParams={copySimulationParams}
                          deleteSimulation={deleteSimulation}
                          unitSystem={unitSystem}
                          onMoveToFolder={openMoveDialogForSingle}
                          isSelected={selectedIds.has(simulation.id)}
                          onSelectionChange={onSelectionChange}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {uncategorized.length > 0 && (
              <div className="space-y-4">
                {folders.length > 0 && (
                  <div className="flex items-center gap-2 pb-2 px-1 border-b mt-6">
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Uncategorized Simulations</span>
                    <Badge variant="secondary" className="ml-2 text-muted-foreground">{uncategorized.length}</Badge>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {uncategorized.map(simulation => (
                    <SimulationCard
                      key={simulation.id}
                      simulation={simulation}
                      unitConversions={unitConversions}
                      calculateNumCars={calculateNumCars}
                      formatDate={formatDate}
                      formatDuration={formatDuration}
                      updateSimulationDetails={updateSimulationDetails}
                      handleExportSimulation={handleExportSimulation}
                      setSelectedSimulation={setSelectedSimulation}
                      copySimulationParams={copySimulationParams}
                      deleteSimulation={deleteSimulation}
                      unitSystem={unitSystem}
                      onMoveToFolder={openMoveDialogForSingle}
                      isSelected={selectedIds.has(simulation.id)}
                      onSelectionChange={onSelectionChange}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {savedSimulations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Saved Simulations</h3>
            <p className="text-gray-500 mb-4">You haven't saved any simulations yet.</p>
          </div>
        )}

        {/* Folder Management Dialogs */}
        {renamingFolder && (
          <RenameFolderDialog
            isOpen={true}
            onClose={() => setRenamingFolder(null)}
            currentFolderName={renamingFolder}
            existingFolders={existingFolders}
            simulationCount={groupedSimulations[renamingFolder]?.length || 0}
            onRename={async (newName) => {
              await onRenameFolder(renamingFolder, newName);
              setRenamingFolder(null);
            }}
          />
        )}

        {deletingFolder && (
          <DeleteFolderDialog
            isOpen={true}
            onClose={() => setDeletingFolder(null)}
            folderName={deletingFolder}
            simulationCount={groupedSimulations[deletingFolder]?.length || 0}
            onDelete={async (deleteAll) => {
              await onDeleteFolder(deletingFolder, deleteAll);
              setDeletingFolder(null);
            }}
          />
        )}
      </div>
    );
  };

const SavedSimulations: React.FC = () => {
  const [savedSimulations, setSavedSimulations] = useState<SavedSimulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedSimulation, setSelectedSimulation] = useState<SavedSimulation | null>(null);
  const [selectedForComparison, setSelectedForComparison] = useState<Set<string>>(new Set());
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [viewMode, setViewMode] = useState<'folders' | 'individual'>('folders');
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalSimulations, setTotalSimulations] = useState(0);

  // Folder management state
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [simulationsToMove, setSimulationsToMove] = useState<Set<string>>(new Set());

  const { toast } = useToast();
  const { getToken } = useAuth();
  const { isSignedIn, isLoaded: isUserLoaded } = useUser();

  const unitConversions = getUnitConversions(unitSystem);

  useEffect(() => {
    loadSimulations();
  }, []);

  useEffect(() => {
    if (currentPage > 1) {
      loadSimulations();
    }
  }, [currentPage]);

  const handleExportSimulation = (simulation: SavedSimulation) => {
    try {
      exportSimulation(simulation);
      toast({
        title: "Success",
        description: "Simulation exported successfully",
        variant: "default",
      });
    } catch (error) {
      console.error('Error exporting simulation:', error);
      toast({
        title: "Error",
        description: "Failed to export simulation",
        variant: "destructive",
      });
    }
  };

  const handleImportSimulation = async (file: File) => {
    try {
      const simulation = await importSimulation(file);

      // Check if simulation with same ID already exists
      const exists = savedSimulations.some(s => s.id === simulation.id);

      if (exists) {
        // Add a timestamp to make the ID unique
        simulation.id = `${simulation.id}_${Date.now()}`;
        simulation.name = `${simulation.name} (Imported)`;
      }

      // Save the imported simulation
      const token = await getToken();
      await simulationService.saveSimulation(simulation, token || undefined);
      await loadSimulations(true); // Reset to page 1

      toast({
        title: "Success",
        description: "Simulation imported successfully",
        variant: "default",
      });
    } catch (error) {
      console.error('Error importing simulation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import simulation",
        variant: "destructive",
      });
    }
  };

  const copySimulationParams = async (simulation: SavedSimulation) => {
    try {
      const params = extractSimulationParams(simulation);
      const formattedString = formatParamsWithUnits(params, unitSystem);
      await navigator.clipboard.writeText(formattedString);

      toast({
        title: "Success",
        description: "Simulation parameters copied to clipboard",
        variant: "default",
      });
    } catch (error) {
      console.error('Error copying simulation parameters:', error);
      toast({
        title: "Error",
        description: "Failed to copy simulation parameters",
        variant: "destructive",
      });
    }
  };

  const loadSimulations = async (reset: boolean = false) => {
    try {
      const pageToLoad = reset ? 1 : currentPage;
      if (reset) {
        setLoading(true);
        setSavedSimulations([]);
        setCurrentPage(1);
      } else {
        setLoadingMore(true);
      }

      const token = await getToken();
      const { simulations, pagination } = await simulationService.getAllSimulations(pageToLoad, 20, token || undefined);
      console.log('Loaded simulations:', simulations);

      if (reset) {
        setSavedSimulations(simulations.sort((a, b) => b.timestamp - a.timestamp));
      } else {
        setSavedSimulations(prev => {
          const combined = [...prev, ...simulations];
          // Use a Map to de-duplicate by ID, keeping the most recent version if duplicates exist
          const uniqueMap = new Map();
          combined.forEach(sim => uniqueMap.set(sim.id, sim));
          return Array.from(uniqueMap.values()).sort((a, b) => b.timestamp - a.timestamp);
        });
      }

      setHasMore(pagination.hasMore);
      setTotalSimulations(pagination.total);
      setCurrentPage(pageToLoad);
      setIsUnauthorized(false);
    } catch (error) {
      console.error('Error loading simulations:', error);
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('401')) {
        setIsUnauthorized(true);
      } else {
        toast({
          title: "Error",
          description: "Failed to load saved simulations",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setCurrentPage(prev => prev + 1);
      // Removed direct loadSimulations() call to avoid double fetching (useEffect handles it)
    }
  };

  const deleteSimulation = async (id: string) => {
    try {
      const token = await getToken();
      await simulationService.deleteSimulation(id, token || undefined);

      // Update local state instead of reloading everything
      setSavedSimulations(prev => prev.filter(sim => sim.id !== id));
      setTotalSimulations(prev => Math.max(0, prev - 1));

      // Also remove from selection if it was selected
      setSelectedForComparison(prev => {
        if (prev.has(id)) {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        }
        return prev;
      });

      toast({
        title: "Success",
        description: "Simulation deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting simulation:', error);
      toast({
        title: "Error",
        description: "Failed to delete simulation",
        variant: "destructive",
      });
    }
  };

  const updateSimulationDetails = async (id: string, newName: string, newFolder?: string) => {
    try {
      const simulation = savedSimulations.find(sim => sim.id === id);
      if (!simulation) return;

      const token = await getToken();
      const updatedSimulation = { ...simulation, name: newName, folder: newFolder };
      await simulationService.updateSimulation(updatedSimulation, token || undefined);

      setSavedSimulations(prev =>
        prev.map(sim => sim.id === id ? updatedSimulation : sim)
      );

      toast({
        title: "Success",
        description: "Simulation details updated successfully",
      });
    } catch (error) {
      console.error('Error updating simulation details:', error);
      toast({
        title: "Error",
        description: "Failed to update simulation details",
        variant: "destructive",
      });
    }
  };

  const handleMoveSimulations = async (folderName: string) => {
    try {
      const updates = Array.from(simulationsToMove).map(id => {
        const sim = savedSimulations.find(s => s.id === id);
        if (sim) {
          return { ...sim, folder: folderName };
        }
        return null;
      }).filter(Boolean) as SavedSimulation[];

      const token = await getToken();
      await Promise.all(updates.map(sim => simulationService.updateSimulation(sim, token || undefined)));

      setSavedSimulations(prev =>
        prev.map(sim => simulationsToMove.has(sim.id) ? { ...sim, folder: folderName } : sim)
      );

      toast({
        title: "Success",
        description: `Moved ${updates.length} simulation${updates.length !== 1 ? 's' : ''} to folder "${folderName}"`,
      });
    } catch (error) {
      console.error('Error moving simulations:', error);
      toast({
        title: "Error",
        description: "Failed to move simulations",
        variant: "destructive",
      });
    }
  };

  const openMoveDialogForSelection = () => {
    if (selectedForComparison.size === 0) {
      toast({
        title: "Selection Required",
        description: "Please select simulations to move using the checkboxes.",
        variant: "destructive"
      });
      return;
    }
    setSimulationsToMove(new Set(selectedForComparison));
    setIsMoveDialogOpen(true);
  };

  const openMoveDialogForSingle = (simulation: SavedSimulation) => {
    setSimulationsToMove(new Set([simulation.id]));
    setIsMoveDialogOpen(true);
  };

  const handleRenameFolder = async (oldName: string, newName: string) => {
    try {
      const token = await getToken();
      await simulationService.renameFolder(oldName, newName, token || undefined);
      await loadSimulations(true); // Reset to page 1
      toast({
        title: "Success",
        description: `Folder renamed from "${oldName}" to "${newName}"`,
      });
    } catch (error) {
      console.error('Error renaming folder:', error);
      toast({
        title: "Error",
        description: "Failed to rename folder",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteFolder = async (folderName: string, deleteAll: boolean = false) => {
    try {
      const token = await getToken();
      await simulationService.deleteFolder(folderName, token || undefined, deleteAll);
      await loadSimulations(true); // Reset to page 1
      toast({
        title: "Success",
        description: deleteAll
          ? `Folder "${folderName}" and all its simulations deleted.`
          : `Folder "${folderName}" deleted. Simulations moved to uncategorized.`,
      });
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast({
        title: "Error",
        description: "Failed to delete folder",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Get unique existing folders
  const existingFolders = Array.from(new Set(
    savedSimulations
      .map(s => s.folder)
      .filter((f): f is string => !!f && f.trim() !== '')
  )).sort();

  const handleBulkDelete = async () => {
    if (selectedForComparison.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedForComparison.size} simulation(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const ids = Array.from(selectedForComparison);
      const token = await getToken();
      await simulationService.deleteSimulations(ids, token || undefined);

      // Update local state
      setSavedSimulations(prev => prev.filter(sim => !selectedForComparison.has(sim.id)));
      setTotalSimulations(prev => Math.max(0, prev - ids.length));
      setSelectedForComparison(new Set());

      toast({
        title: "Success",
        description: `Successfully deleted ${ids.length} simulation(s)`,
      });
    } catch (error) {
      console.error('Error deleting simulations:', error);
      toast({
        title: "Error",
        description: "Failed to delete simulations",
        variant: "destructive",
      });
    }
  };

  const handleComparisonSelection = (simulationId: string, checked: boolean) => {
    setSelectedForComparison(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(simulationId);
      } else {
        newSet.delete(simulationId);
      }
      return newSet;
    });
  };

  const selectAllForComparison = () => {
    setSelectedForComparison(new Set(savedSimulations.map(sim => sim.id)));
  };

  const deselectAllForComparison = () => {
    setSelectedForComparison(new Set());
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const calculateNumCars = (simulation: SavedSimulation) => {
    // Calculate total cars based on traffic density and freeway length
    const numLanes = simulation.params.numLanes || 2;
    const freewayLength = simulation.params.freewayLength || 1; // Standardized default 1km
    const trafficDensity = simulation.params.trafficDensity || 10; // Standardized default 10veh/km

    // Total cars = overall density (cars/km) * freeway length (km)
    // NOTE: trafficDensity is absolute cars per km across ALL lanes.
    const totalCars = Math.round(trafficDensity * freewayLength);

    return totalCars;
  };

  const getSelectedSimulations = () => {
    return savedSimulations.filter(sim => selectedForComparison.has(sim.id));
  };





  if (isUnauthorized && isUserLoaded && !isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto mt-12">
          <CardHeader>
            <CardTitle className="text-center">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 py-8">
            <div className="bg-amber-100 p-4 rounded-full">
              <Users className="h-12 w-12 text-amber-600" />
            </div>
            <p className="text-center text-gray-600">
              Please sign in to view and manage your saved simulations.
            </p>
            <SignInButton mode="modal">
              <Button size="lg" className="w-full">
                Sign In to Continue
              </Button>
            </SignInButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isUnauthorized && isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto mt-12 border-destructive">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 py-8">
            <Alert variant="destructive">
              <Info className="h-4 w-4" />
              <AlertTitle>Server rejected your session</AlertTitle>
              <AlertDescription>
                The backend was unable to verify your login. This usually means the server configuration is missing Clerk API keys.
              </AlertDescription>
            </Alert>
            <Button variant="outline" onClick={() => loadSimulations(true)}>
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading saved simulations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Saved Simulations</h1>
          <p className="text-gray-600 mt-2">View and analyze your previously saved traffic simulations</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Metric</span>
            <Switch
              checked={unitSystem === 'imperial'}
              onCheckedChange={(checked) => setUnitSystem(checked ? 'imperial' : 'metric')}
            />
            <span className="text-sm text-gray-600">Imperial</span>
          </div>
          <Button
            variant="outline"
            onClick={() => triggerFileInput(handleImportSimulation)}
            className="flex items-center gap-2"
          >
            <FileUp className="h-4 w-4" />
            Import
          </Button>
          <Button
            variant="outline"
            onClick={openMoveDialogForSelection}
            className="flex items-center gap-2"
            disabled={selectedForComparison.size === 0}
            title={selectedForComparison.size === 0 ? "Select simulations to move first" : "Move selected simulations to a folder"}
          >
            <FolderPlus className="h-4 w-4" />
            Move Selected to Folder
          </Button>
          <Button
            variant="outline"
            onClick={handleBulkDelete}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            disabled={selectedForComparison.size === 0}
            title={selectedForComparison.size === 0 ? "Select simulations to delete first" : `Delete ${selectedForComparison.size} selected simulations`}
          >
            <Trash2 className="h-4 w-4" />
            Delete Selected
          </Button>
          <Link to="/freeway-simulator">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Simulation
            </Button>
          </Link>
        </div>
      </div>

      {savedSimulations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Saved Simulations</h3>
              <p className="text-gray-500 mb-4">You haven't saved any simulations yet.</p>
              <Link to="/freeway-simulator">
                <Button>Start New Simulation</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="individual" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="individual" className="flex items-center gap-2">
              <Eye size={16} />
              Individual Simulations
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center gap-2">
              <BarChart3 size={16} />
              Simulation Comparison
            </TabsTrigger>
          </TabsList>

          <TabsContent value="individual">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Individual Simulations</h2>
                <p className="text-gray-600">View and manage your saved simulations</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Folders</span>
                  <Switch
                    checked={viewMode === 'individual'}
                    onCheckedChange={(checked) => setViewMode(checked ? 'individual' : 'folders')}
                  />
                  <span className="text-sm text-gray-600">Individual</span>
                </div>
              </div>
            </div>

            <IndividualSimulationList
              savedSimulations={savedSimulations}
              unitConversions={unitConversions}
              calculateNumCars={calculateNumCars}
              formatDate={formatDate}
              formatDuration={formatDuration}
              updateSimulationDetails={updateSimulationDetails}
              handleExportSimulation={handleExportSimulation}
              setSelectedSimulation={setSelectedSimulation}
              copySimulationParams={copySimulationParams}
              deleteSimulation={deleteSimulation}
              unitSystem={unitSystem}
              openMoveDialogForSingle={openMoveDialogForSingle}
              selectedIds={selectedForComparison}
              onSelectionChange={handleComparisonSelection}
              existingFolders={existingFolders}
              onRenameFolder={handleRenameFolder}
              onDeleteFolder={handleDeleteFolder}
              viewMode={viewMode}
              onSelectAll={(checked) => {
                if (checked) {
                  const newSet = new Set(selectedForComparison);
                  savedSimulations.forEach(sim => newSet.add(sim.id));
                  setSelectedForComparison(newSet);
                } else {
                  const newSet = new Set(selectedForComparison);
                  savedSimulations.forEach(sim => newSet.delete(sim.id));
                  setSelectedForComparison(newSet);
                }
              }}
              allPageSelected={savedSimulations.length > 0 && savedSimulations.every(sim => selectedForComparison.has(sim.id))}
            />

            {/* Load More Button */}
            {hasMore && !loading && (
              <div className="mt-8 flex justify-center">
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  variant="outline"
                  size="lg"
                  className="min-w-[200px]"
                >
                  {loadingMore ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                      Loading...
                    </>
                  ) : (
                    `Load More (${savedSimulations.length} of ${totalSimulations})`
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="comparison">
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Multi-Simulation Analysis</h2>
                <p className="text-gray-600">
                  Select simulations to compare their performance metrics
                </p>
              </div>

              {/* Selection Controls */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Select Simulations for Comparison</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllForComparison}
                        disabled={savedSimulations.length === 0}
                      >
                        <CheckSquare size={16} className="mr-1" />
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={deselectAllForComparison}
                        disabled={selectedForComparison.size === 0}
                      >
                        <Square size={16} className="mr-1" />
                        Deselect All
                      </Button>
                      {selectedForComparison.size > 0 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSimulationsToMove(new Set(selectedForComparison));
                            setIsMoveDialogOpen(true);
                          }}
                        >
                          <FolderInput size={16} className="mr-1" />
                          Move Selected
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedForComparison.size} of {savedSimulations.length} simulations selected
                  </p>
                </CardHeader>
                <CardContent>
                  <ComparisonSelectionList
                    savedSimulations={savedSimulations}
                    selectedForComparison={selectedForComparison}
                    onSelectionChange={(id, checked) => handleComparisonSelection(id, checked)}
                    calculateNumCars={calculateNumCars}
                    updateSimulationDetails={updateSimulationDetails}
                    deleteSimulation={deleteSimulation}
                    openMoveDialogForSingle={openMoveDialogForSingle}
                    existingFolders={existingFolders}
                    onRenameFolder={handleRenameFolder}
                    onDeleteFolder={handleDeleteFolder}
                  />
                </CardContent>
              </Card>

              {/* Comparison Charts */}
              {selectedForComparison.size > 0 ? (
                <div className="space-y-6">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Understanding the Comparison Charts</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                        <li>Each color represents a different simulation.</li>
                        <li>Solid points indicate stabilized data, while lines show trends over time.</li>
                        <li>Compare density, throughput, speed, and lane usage to understand traffic flow characteristics.</li>
                        <li>American rules (red) usually keep right/pass left, while European rules (blue) keep left/pass right.</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="flex flex-col space-y-8 min-w-0">
                    <OverlaySpeedDensityChart
                      selectedSimulations={getSelectedSimulations()}
                      unitSystem={unitSystem}
                    />
                    <OverlayThroughputDensityChart
                      selectedSimulations={getSelectedSimulations()}
                      unitSystem={unitSystem}
                    />
                    <OverlayLaneThroughputDensityChart
                      selectedSimulations={getSelectedSimulations()}
                      unitSystem={unitSystem}
                    />
                    <OverlayLaneChangesDensityChart
                      selectedSimulations={getSelectedSimulations()}
                    />
                    <OverlayPackFormationDensityChart
                      selectedSimulations={getSelectedSimulations()}
                    />
                    <DensityLaneDistributionChart
                      selectedSimulations={getSelectedSimulations()}
                    />
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-64">
                    <div className="text-center">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Simulations Selected</h3>
                      <p className="text-gray-500 mb-4">Select at least one simulation to view comparison charts.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}

      <Footer />

      <MoveToFolderDialog
        open={isMoveDialogOpen}
        onOpenChange={setIsMoveDialogOpen}
        existingFolders={existingFolders}
        onMove={handleMoveSimulations}
        selectedCount={simulationsToMove.size}
      />
    </div>
  );
};

export default SavedSimulations;

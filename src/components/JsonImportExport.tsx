import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { SimulationParams } from "@/utils/trafficSimulation";
import { Copy, FileText } from "lucide-react";

interface BatchSimulation {
  name?: string;
  duration: number; // in seconds
  params: Partial<SimulationParams> & { seed?: number };
  trafficRule?: 'american' | 'european';
  compareRegionalRules?: boolean;
}

interface JsonImportExportProps {
  onImport: (params: Partial<SimulationParams>, autoStart?: boolean) => void;
  onBatchImport?: (simulations: BatchSimulation[]) => void;
  currentParams: SimulationParams;
  trafficRule: 'american' | 'european';
}

export const JsonImportExport: React.FC<JsonImportExportProps> = ({ onImport, onBatchImport, currentParams, trafficRule }) => {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleImport = () => {
    console.log('Starting import with input:', jsonInput);

    // Check if input is empty
    if (!jsonInput.trim()) {
      toast({
        title: "Error",
        description: "No JSON data provided",
        variant: "destructive",
      });
      return;
    }

    // Check if input is a URL (starts with http)
    if (jsonInput.trim().toLowerCase().startsWith('http')) {
      toast({
        title: "Error",
        description: "Please paste the actual JSON content, not a URL",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsImporting(true);

      // Try to parse the JSON
      let parsedData;
      try {
        parsedData = JSON.parse(jsonInput);
      } catch (parseError) {
        throw new Error('Invalid JSON format. Please check your input.');
      }

      // Check if it's a batch simulation array
      if (Array.isArray(parsedData)) {
        if (!onBatchImport) {
          throw new Error('Batch import not supported in this context');
        }

        // Validate batch format and expansion
        const batchSimulations: BatchSimulation[] = [];

        parsedData.forEach((item, index) => {
          if (typeof item !== 'object' || item === null) {
            throw new Error(`Invalid batch item at index ${index}: Expected an object`);
          }

          const baseDuration = item.simulationDuration || item.duration || 60;
          const baseName = item.name || `Sim ${index + 1}`;
          const baseParams = item.params && typeof item.params === 'object' ? item.params : item;
          const baseRule = item.trafficRule || 'american';
          const shouldCompare = item.compareRegionalRules === true;

          if (shouldCompare) {
            // Generate a shared seed for this comparison set
            const sharedSeed = Math.floor(Math.random() * 1000000);

            // Add 3 American runs
            for (let i = 1; i <= 3; i++) {
              batchSimulations.push({
                name: `${baseName} [US ${i}/3]`,
                duration: baseDuration,
                params: { ...baseParams, seed: sharedSeed },
                trafficRule: 'american'
              });
            }
            // Add 3 European runs
            for (let i = 1; i <= 3; i++) {
              batchSimulations.push({
                name: `${baseName} [EU ${i}/3]`,
                duration: baseDuration,
                params: { ...baseParams, seed: sharedSeed },
                trafficRule: 'european'
              });
            }
          } else {
            batchSimulations.push({
              name: baseName,
              duration: baseDuration,
              params: baseParams,
              trafficRule: baseRule
            });
          }
        });

        console.log('Parsed batch simulations (expanded):', batchSimulations);
        onBatchImport(batchSimulations);

        toast({
          title: "Success",
          description: `${batchSimulations.length} batch simulations imported successfully!`,
          variant: "default",
        });
        setJsonInput('');
        return;
      }

      // Handle single simulation (existing logic)
      let parsedParams = parsedData;
      // If the parsed JSON has a 'params' property, use that instead
      if (parsedParams.params && typeof parsedParams.params === 'object') {
        parsedParams = parsedParams.params;
      }

      console.log('Parsed JSON:', parsedParams);

      // Basic validation
      if (typeof parsedParams !== 'object' || parsedParams === null) {
        throw new Error('Invalid JSON format: Expected an object');
      }

      // Create a new object with only the valid parameters from the imported JSON
      const validParams: Partial<SimulationParams> = {};

      // List of valid parameter names from SimulationParams
      const validParamNames = [
        'numLanes', 'trafficDensity', 'meanSpeed', 'speedLimit', 'freewayLength',
        'tDist', 'meanDistTripPlanned', 'vehicleTypeDensity', 'driverTypeDensity',
        'laneChangeProbability', 'laneChangeCooldown', 'laneChangeThreshold',
        'laneChangeMinImprovement', 'randomSlowdownProbability', 'randomSlowdownAmount',
        'randomSlowdownDuration', 'timeStep', 'simulationSpeed', 'maxSpeed', 'minGap',
        'carLength', 'truckLength', 'motorcycleLength', 'truckPercentage',
        'motorcyclePercentage', 'carPercentage', 'dt', 'aMax', 'k', 'lengthCar',
        'initialGap', 'brakeTime', 'brakeCarIndex', 'minSpeed', 'stdSpeed',
        'initialGap', 'brakeTime', 'brakeCarIndex', 'minSpeed', 'stdSpeed',
        'sigmaDistTripPlanned', 'rightLaneBias',
        'accelerationThreshold', 'simulationDuration', 'uniformDriverBehavior',
        'stoppedCarsGap', 'driverReactionTime', 'brakingReactionTime'
      ];

      console.log('Current params before import:', currentParams);

      if (parsedParams.trafficRule && (parsedParams.trafficRule === 'american' || parsedParams.trafficRule === 'european')) {
        // We'll pass this via a slightly modified onImport call or handle it separately
        // For now, let's just make sure it's recognized
      }

      // Only copy over valid parameters
      Object.entries(parsedParams).forEach(([key, value]) => {
        // Check if the key is in our valid parameters list
        if (validParamNames.includes(key)) {
          console.log(`Importing ${key}:`, value);
          // @ts-ignore - We know the key is valid
          validParams[key] = value;
        }
      });

      // Special handling for nested objects like vehicleTypeDensity
      if (parsedParams.vehicleTypeDensity && typeof parsedParams.vehicleTypeDensity === 'object') {
        console.log('Processing vehicleTypeDensity:', parsedParams.vehicleTypeDensity);
        validParams.vehicleTypeDensity = { ...currentParams.vehicleTypeDensity };

        Object.entries(parsedParams.vehicleTypeDensity).forEach(([type, value]) => {
          if (['car', 'truck', 'motorcycle'].includes(type) && typeof value === 'number') {
            console.log(`Setting vehicle type ${type} density to:`, value);
            // @ts-ignore - We know the type is valid
            validParams.vehicleTypeDensity[type] = value;
          }
        });
      }

      // Special handling for nested objects like driverTypeDensity
      if (parsedParams.driverTypeDensity && typeof parsedParams.driverTypeDensity === 'object') {
        console.log('Processing driverTypeDensity:', parsedParams.driverTypeDensity);
        validParams.driverTypeDensity = { ...currentParams.driverTypeDensity };

        Object.entries(parsedParams.driverTypeDensity).forEach(([type, value]) => {
          if (['aggressive', 'normal', 'conservative'].includes(type) && typeof value === 'number') {
            console.log(`Setting driver type ${type} density to:`, value);
            // @ts-ignore - We know the type is valid
            validParams.driverTypeDensity[type] = value;
          }
        });
      }

      console.log('Final params to import:', validParams);

      // Handle Regional Comparison Expansion for single imports
      if (parsedData.compareRegionalRules === true) {
        const expansion: BatchSimulation[] = [];
        const baseName = parsedData.name || `Comparison ${new Date().toLocaleTimeString()}`;
        const duration = parsedData.simulationDuration || parsedData.duration || 60;
        const sharedSeed = Math.floor(Math.random() * 1000000);

        for (let i = 1; i <= 3; i++) {
          expansion.push({ name: `${baseName} [US ${i}/3]`, duration, params: { ...validParams, seed: sharedSeed } as any, trafficRule: 'american' });
        }
        for (let i = 1; i <= 3; i++) {
          expansion.push({ name: `${baseName} [EU ${i}/3]`, duration, params: { ...validParams, seed: sharedSeed } as any, trafficRule: 'european' });
        }

        if (onBatchImport) {
          onBatchImport(expansion);
          toast({ title: "Success", description: "Expanded comparison into 6 batch simulations.", variant: "default" });
          setJsonInput('');
          return;
        }
      }

      // If the imported data had a top-level trafficRule, respect it
      if (parsedData.trafficRule && (parsedData.trafficRule === 'american' || parsedData.trafficRule === 'european')) {
        // We'll pass it alongside the params if onImport supports it or via separate channel
        onImport({ ...validParams, trafficRule: parsedData.trafficRule } as any, true);
      } else {
        onImport(validParams, true); // Auto-start single imports
      }
      console.log('Import complete, showing success toast');

      toast({
        title: "Success",
        description: "Settings imported successfully!",
        variant: "default",
      });
      setJsonInput('');
    } catch (error) {
      console.error('Error importing settings:', error);
      toast({
        title: "Error",
        description: `Failed to import settings: ${error instanceof Error ? error.message : 'Invalid JSON'}`,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = () => {
    try {
      setIsExporting(true);
      // Export all remaining parameters directly
      // Allow user to export everything without filtering
      const exportableParams = { ...currentParams };

      // Remove internal function references if any (though params shouldn't have them)
      const exportObject = {
        params: exportableParams,
        trafficRule
      };

      const jsonString = JSON.stringify(exportObject, null, 2);

      // Copy to clipboard
      navigator.clipboard.writeText(jsonString);

      toast({
        title: "Success",
        description: "Settings copied to clipboard!",
        variant: "default",
      });
    } catch (error) {
      console.error('Error exporting settings:', error);
      toast({
        title: "Error",
        description: "Failed to export settings",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const generateSampleJson = (type: 'single' | 'batch') => {
    try {
      let sampleJson;

      if (type === 'single') {
        sampleJson = {
          simulationDuration: 120,
          numLanes: 3,
          trafficDensity: 2.5,
          meanSpeed: 65,
          speedLimit: 70,
          freewayLength: 1,
          trafficRule: 'american',
          vehicleTypeDensity: {
            car: 70,
            truck: 20,
            motorcycle: 10
          },
          tDist: 3,
          meanDistTripPlanned: 8
        };
      } else if (type === 'batch') {
        sampleJson = [
          {
            name: "Low Traffic Scenario",
            duration: 60,
            trafficRule: 'european',
            params: {
              numLanes: 2,
              trafficDensity: 1.0,
              meanSpeed: 70,
              speedLimit: 75,
              freewayLength: 10,
              vehicleTypeDensity: {
                car: 80,
                truck: 15,
                motorcycle: 5
              }
            }
          },
          {
            name: "Medium Traffic Scenario",
            duration: 90,
            params: {
              numLanes: 3,
              trafficDensity: 3.0,
              meanSpeed: 60,
              speedLimit: 65,
              freewayLength: 8,
              vehicleTypeDensity: {
                car: 70,
                truck: 25,
                motorcycle: 5
              }
            }
          },
          {
            name: "Heavy Traffic Scenario",
            duration: 120,
            params: {
              numLanes: 4,
              trafficDensity: 5.0,
              meanSpeed: 45,
              speedLimit: 55,
              freewayLength: 6,
              vehicleTypeDensity: {
                car: 65,
                truck: 30,
                motorcycle: 5
              }
            }
          }
        ];
      } else if (type === 'comparison' as any) {
        sampleJson = {
          name: "Regional Comparison Study",
          duration: 60,
          compareRegionalRules: true,
          params: {
            numLanes: 3,
            trafficDensity: 30,
            meanSpeed: 65
          }
        };
      }

      const jsonString = JSON.stringify(sampleJson, null, 2);
      navigator.clipboard.writeText(jsonString);

      toast({
        title: "Sample JSON Copied",
        description: `${type === 'single' ? 'Single simulation' : 'Batch simulation'} sample copied to clipboard!`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error generating sample JSON:', error);
      toast({
        title: "Error",
        description: "Failed to generate sample JSON",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-medium">Import/Export Settings</h3>

      <div className="space-y-2">
        <Label htmlFor="json-input">Paste JSON Configuration</Label>
        <Textarea
          id="json-input"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder="Single simulation: { params: {...}, simulationDuration: 60 }&#10;&#10;Batch simulations: [&#10;  { name: 'Sim 1', duration: 60, params: {...} },&#10;  { name: 'Sim 2', duration: 120, params: {...} }&#10;]"
          className="min-h-[120px] font-mono text-sm"
        />
        <div className="text-xs text-muted-foreground">
          Support for single simulation or batch array with duration parameter
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={handleImport}
          disabled={!jsonInput.trim() || isImporting}
          variant="outline"
        >
          {isImporting ? 'Importing...' : 'Import Settings'}
        </Button>

        <Button
          onClick={handleExport}
          disabled={isExporting}
          variant="outline"
        >
          <Copy className="w-4 h-4 mr-2" />
          {isExporting ? 'Copying...' : 'Export Current'}
        </Button>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Sample Configurations</Label>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => generateSampleJson('single')}
            variant="secondary"
            size="sm"
          >
            <FileText className="w-4 h-4 mr-2" />
            Single Simulation
          </Button>

          <Button
            onClick={() => generateSampleJson('batch')}
            variant="secondary"
            size="sm"
          >
            <FileText className="w-4 h-4 mr-2" />
            Batch Simulations
          </Button>

          <Button
            onClick={() => generateSampleJson('comparison' as any)}
            variant="secondary"
            size="sm"
          >
            <FileText className="w-4 h-4 mr-2" />
            Regional Comparison (3+3)
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          Generate sample JSON configurations to copy and edit
        </div>
      </div>
    </div>
  );
};

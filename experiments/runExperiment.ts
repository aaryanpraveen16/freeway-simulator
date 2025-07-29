import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

interface SimulationConfig {
  duration: number;
  warmup: number;
  seed: number;
  laneLength: number;
  numLanes: number;
  meanSpeed: number;
  sdSpeed: number;
  minGap: number;
  reactionTime: number;
  sdReactionTime: number;
  maxAccel: number;
  maxDecel: number;
}

interface ExperimentConfig {
  name: string;
  description: string;
  replications: number;
  parameters: Record<string, number[]>;
  metrics: string[];
}

interface Config {
  experiment: ExperimentConfig;
  simulation: SimulationConfig;
  output: {
    dataDir: string;
    resultsDir: string;
  };
}

interface SimulationResult {
  metrics: Record<string, number>;
  params: Record<string, any>;
}

class ExperimentRunner {
  private config: Config;
  private results: Array<{ params: any; result: SimulationResult }> = [];

  constructor(config: Config) {
    this.config = config;
    this.ensureDirectoryExists(this.config.output.dataDir);
    this.ensureDirectoryExists(this.config.output.resultsDir);
  }

  private ensureDirectoryExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  private runSimulation(params: Record<string, any>): SimulationResult {
    // In a real implementation, this would run your simulation
    // For now, we'll simulate some results
    const density = params.density || 10;
    const meanSpeed = params.meanSpeed || 100;
    
    // Simulate some metrics
    return {
      metrics: {
        throughput: Math.min(density * meanSpeed, 2000), // Cap at 2000
        avgSpeed: Math.max(10, meanSpeed - (density / 5)), // Decrease speed with density
        density,
        flowStability: Math.random() * 0.2 + 0.8 // 0.8-1.0
      },
      params
    };
  }

  private async runReplications(params: Record<string, any>, replications: number): Promise<{ params: any; result: SimulationResult }> {
    try {
      // Run all replications in parallel
      const results = await Promise.all(
        Array(replications).fill(null).map((_, i) => {
          // Use a different seed for each replication
          const runParams = { ...params, seed: (params.seed || 42) + i };
          return this.runSimulation(runParams);
        })
      );

      // Calculate average metrics
      const metrics = results.reduce<Record<string, number>>((acc, result) => {
        Object.entries(result.metrics).forEach(([key, value]) => {
          acc[key] = (acc[key] || 0) + (value as number);
        });
        return acc;
      }, {});

      // Calculate means
      Object.keys(metrics).forEach(key => {
        metrics[key] = metrics[key] / replications;
      });

      return { 
        params, 
        result: { 
          metrics, 
          params 
        } 
      };
    } catch (error) {
      console.error('Error in runReplications:', error);
      throw error;
    }
  }

  public async run() {
    try {
      const parameterCombinations = this.generateParameterCombinations();
      
      console.log(`\n=== Starting Experiment: ${this.config.experiment.name} ===`);
      console.log(`Total parameter combinations: ${parameterCombinations.length}`);
      console.log(`Replications per combination: ${this.config.experiment.replications}`);
      
      // Ensure output directories exist
      this.ensureDirectoryExists(this.config.output.dataDir);
      this.ensureDirectoryExists(this.config.output.resultsDir);
      
      for (let i = 0; i < parameterCombinations.length; i++) {
        const params = parameterCombinations[i];
        console.log(`\n--- Running parameter set ${i + 1}/${parameterCombinations.length} ---`);
        console.log('Parameters:', JSON.stringify(params, null, 2));
        
        const result = await this.runReplications(
          params,
          this.config.experiment.replications
        );
        
        this.results.push(result);
        
        // Save intermediate results
        await this.saveResults('intermediate_results.json');
      }
      
      // Save final results
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputFile = path.join(
        this.config.output.resultsDir,
        `${this.config.experiment.name}_${timestamp}.json`
      );
      
      await this.saveResults(outputFile);
      await this.saveResultsToCSV(outputFile.replace('.json', '.csv'));
      
      console.log(`\n=== Experiment completed ===`);
      console.log(`Results saved to: ${outputFile}`);
      
      return this.results;
    } catch (error) {
      console.error('Error in experiment run:', error);
      throw error;
    }
  }

  private generateParameterCombinations(): Record<string, any>[] {
    const { parameters } = this.config.experiment;
    
    // Get all parameter keys and their possible values
    const paramEntries = Object.entries(parameters);
    
    // Start with a single empty combination
    let combinationsArray: Record<string, any>[] = [{}];
    
    // For each parameter, create new combinations by combining existing ones with each possible value
    for (const [key, values] of paramEntries) {
      const newCombinations: Record<string, any>[] = [];
      
      for (const value of values as any[]) {
        for (const combination of combinationsArray) {
          newCombinations.push({
            ...combination,
            [key]: value
          });
        }
      }
      
      combinationsArray = newCombinations;
    }
    
    // Merge with simulation defaults
    return combinationsArray.map(combo => ({
      ...this.config.simulation,
      ...combo
    }));
  }

  private async saveResults(filename: string): Promise<void> {
    try {
      // Ensure the results directory exists
      await fs.promises.mkdir(this.config.output.resultsDir, { recursive: true });
      
      // Create a safe filename by replacing any problematic characters
      const safeFilename = filename.replace(/[^\w\-.]/g, '_');
      const outputPath = path.join(this.config.output.resultsDir, safeFilename);
      
      // Ensure we're not trying to write outside our intended directory
      if (!outputPath.startsWith(this.config.output.resultsDir)) {
        throw new Error(`Invalid output path: ${outputPath}`);
      }
      
      const data = {
        experiment: this.config.experiment,
        timestamp: new Date().toISOString(),
        results: this.results
      };
      
      console.log(`Saving results to: ${outputPath}`);
      
      await fs.promises.writeFile(
        outputPath,
        JSON.stringify(data, null, 2),
        'utf-8'
      );
      
      console.log(`Successfully saved results to ${outputPath}`);
    } catch (error) {
      console.error('Error saving results:', error);
      console.error('Current working directory:', process.cwd());
      console.error('Results directory:', this.config.output.resultsDir);
      throw error;
    }
  }

  private async saveResultsToCSV(outputPath: string): Promise<void> {
    try {
      if (this.results.length === 0) {
        console.log('No results to save to CSV');
        return;
      }
      
      // Ensure the output directory exists
      const outputDir = path.dirname(outputPath);
      await fs.promises.mkdir(outputDir, { recursive: true });
      
      // Ensure we're not trying to write outside our intended directory
      if (!outputPath.startsWith(this.config.output.resultsDir)) {
        throw new Error(`Invalid output path: ${outputPath}`);
      }
      
      console.log(`Saving CSV to: ${outputPath}`);
      
      // Get all unique metric names
      const metrics = new Set<string>();
      this.results.forEach(r => {
        if (r.result?.metrics) {
          Object.keys(r.result.metrics).forEach(m => metrics.add(m));
        }
      });
      
      if (this.results[0]?.params) {
        // Create CSV header
        const header = ['run_id', 'timestamp', ...Object.keys(this.results[0].params), ...metrics];
        
        // Create CSV rows
        const rows = this.results.map((r, i) => {
          const row = [
            i + 1,
            new Date().toISOString(),
            ...Object.values(r.params || {}),
            ...Array.from(metrics).map(m => {
              const value = r.result?.metrics?.[m];
              // Handle undefined/null values and escape commas in strings
              if (value === undefined || value === null) return '';
              const strValue = String(value);
              return strValue.includes(',') ? `"${strValue.replace(/"/g, '""')}"` : strValue;
            })
          ];
          return row.join(',');
        });
        
        // Write to file
        const csvContent = [header.join(','), ...rows].join('\n');
        await fs.promises.writeFile(outputPath, csvContent, 'utf-8');
        
        console.log(`Successfully saved CSV to ${outputPath}`);
      } else {
        console.log('No parameters found in results, skipping CSV generation');
      }
    } catch (error) {
      console.error('Error saving CSV results:', error);
      console.error('Output path:', outputPath);
      console.error('Results directory:', this.config.output.resultsDir);
      throw error;
    }
  }
}

async function main() {
  try {
    // Get the current file's directory
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Load config
    const configPath = path.join(__dirname, 'config', 'fundamental_diagram.json');
    const config: Config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    // Ensure output directories use forward slashes and are relative to the project root
    const normalizePath = (p: string) => {
      // Convert to forward slashes and remove any leading slashes
      let normalized = p.replace(/\\/g, '/').replace(/^[\/]+/, '');
      // Resolve relative to the experiments directory
      return path.join(__dirname, '..', normalized);
    };
    
    config.output.dataDir = normalizePath(config.output.dataDir);
    config.output.resultsDir = normalizePath(config.output.resultsDir);
    
    console.log('Data directory:', config.output.dataDir);
    console.log('Results directory:', config.output.resultsDir);

    // Create and run the experiment
    const experiment = new ExperimentRunner(config);
    await experiment.run();
    
    console.log('Experiment completed successfully!');
  } catch (error) {
    console.error('Experiment failed:', error);
    process.exit(1);
  }
}

main();

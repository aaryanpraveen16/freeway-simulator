import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Get the current module's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load base config
const baseConfigPath = path.join(__dirname, '..', 'config', 'base.json');
const baseConfig = JSON.parse(fs.readFileSync(baseConfigPath, 'utf-8'));

// Experiment configuration
const experimentConfig = {
  name: 'fundamental_diagram',
  description: 'Throughput vs density relationship',
  parameters: {
    density: Array.from({length: 20}, (_, i) => 10 + i * 10), // 10 to 200 veh/km
    numLanes: [3],
    meanSpeed: [100], // km/h
    replications: 10
  },
  metrics: ['throughput', 'avgSpeed', 'density']
};

// Create output directories
const outputDir = path.join(__dirname, '..', 'data', experimentConfig.name);
const resultsDir = path.join(__dirname, '..', 'results', experimentConfig.name);
fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(resultsDir, { recursive: true });

// Function to run a single simulation
async function runSimulation(config) {
  const outputFile = path.join(outputDir, `experiment_${config.experimentId}.json`);
  
  try {
    // Create the simulation configuration
    const simConfig = {
      ...config.simulation,
      output: outputFile
    };
    
    // Save the config to a temporary file
    const configFile = path.join(outputDir, `config_${config.experimentId}.json`);
    fs.writeFileSync(configFile, JSON.stringify(simConfig, null, 2));
    
    // Execute the simulation using tsx to run the TypeScript file directly
    console.log(`\n--- Running experiment ${config.experimentId} ---`);
    console.log(`Density: ${config.simulation.density} veh/km, Lanes: ${config.simulation.numLanes}, Speed: ${config.simulation.meanSpeed} km/h`);
    
    const command = `npx tsx ${path.join(__dirname, '..', 'runExperiment.ts')} --config=${configFile}`;
    console.log(`Command: ${command}`);
    
    execSync(command, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..', '..') // Run from project root
    });
    
    // Process and return results if the output file exists
    if (fs.existsSync(outputFile)) {
      const result = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
      // Clean up temporary files
      fs.unlinkSync(configFile);
      return result;
    } else {
      throw new Error(`Output file not found: ${outputFile}`);
    }
  } catch (error) {
    console.error(`Error in runSimulation: ${error.message}`);
    if (fs.existsSync(configFile)) {
      fs.unlinkSync(configFile);
    }
    return null;
  }
}

// Function to calculate statistics
function calculateStatistics(values) {
  if (values.length === 0) return { mean: 0, std: 0 };
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(
    values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / values.length
  );
  
  return { mean, std };
}

// Main experiment loop
async function runExperiment() {
  const results = [];
  let experimentId = 0;
  
  // Create results directory if it doesn't exist
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  try {
    for (const density of experimentConfig.parameters.density) {
      for (const numLanes of experimentConfig.parameters.numLanes) {
        for (const meanSpeed of experimentConfig.parameters.meanSpeed) {
          const replicationResults = [];
          
          console.log(`\n=== Starting parameter set ===`);
          console.log(`Density: ${density} veh/km, Lanes: ${numLanes}, Speed: ${meanSpeed} km/h`);
          console.log(`Running ${experimentConfig.parameters.replications} replications...`);
          
          // Run replications
          for (let rep = 0; rep < experimentConfig.parameters.replications; rep++) {
            experimentId++;
            
            // Create simulation config
            const config = {
              ...baseConfig,
              simulation: {
                ...baseConfig.simulation,
                density,
                numLanes,
                meanSpeed,
                seed: (baseConfig.simulation.seed || 42) + rep, // Ensure we have a seed
                experimentId: `exp_${density}_${numLanes}_${meanSpeed}_${rep}`,
                outputDir,
                resultsDir
              }
            };
            
            console.log(`\n--- Replication ${rep + 1}/${experimentConfig.parameters.replications} ---`);
            
            const result = await runSimulation(config);
            if (result && result.metrics) {
              replicationResults.push(result.metrics);
            } else {
              console.warn(`Skipping invalid result for replication ${rep + 1}`);
            }
          }
          
          // Calculate statistics across replications
          if (replicationResults.length > 0) {
            const metrics = {};
            
            // Calculate statistics for each metric
            for (const metric of experimentConfig.metrics) {
              const values = replicationResults
                .map(r => r[metric])
                .filter(v => v !== undefined);
                
              if (values.length > 0) {
                const { mean, std } = calculateStatistics(values);
                metrics[`${metric}_mean`] = mean;
                metrics[`${metric}_std`] = std;
              }
            }
            
            // Add parameter set results
            const resultEntry = {
              density,
              numLanes,
              meanSpeed,
              num_replications: replicationResults.length,
              ...metrics
            };
            
            results.push(resultEntry);
            
            // Save intermediate results
            const csvPath = path.join(resultsDir, 'results_summary.csv');
            const headers = ['density', 'numLanes', 'meanSpeed', 'num_replications'];
            
            // Add metric columns
            experimentConfig.metrics.forEach(metric => {
              headers.push(`${metric}_mean`, `${metric}_std`);
            });
            
            // Generate CSV content
            let csvContent = headers.join(',') + '\n';
            
            for (const r of results) {
              const row = [
                r.density,
                r.numLanes,
                r.meanSpeed,
                r.num_replications,
                ...experimentConfig.metrics.flatMap(metric => [
                  r[`${metric}_mean`]?.toFixed(4) || '',
                  r[`${metric}_std`]?.toFixed(4) || ''
                ])
              ];
              csvContent += row.join(',') + '\n';
            }
            
            fs.writeFileSync(csvPath, csvContent);
            console.log(`Updated results saved to: ${csvPath}`);
          } else {
            console.warn('No valid results were recorded for this parameter set');
          }
        }
      }
    }
    
    console.log('\n=== Experiment completed successfully ===');
    return results;
  } catch (error) {
    console.error('\n=== Experiment failed with error ===');
    console.error(error);
    throw error;
  }
}

// Function to generate visualization
async function generateVisualization(results) {
  try {
    if (!results || results.length === 0) {
      console.warn('No results to visualize');
      return;
    }
    
    // Sort results by density for proper line plotting
    const sortedResults = [...results].sort((a, b) => a.density - b.density);
    
    // Prepare data for CSV
    const csvPath = path.join(resultsDir, 'final_results.csv');
    const headers = ['density', 'numLanes', 'meanSpeed', 'num_replications'];
    
    // Add metric columns
    experimentConfig.metrics.forEach(metric => {
      headers.push(`${metric}_mean`, `${metric}_std`);
    });
    
    // Generate CSV content
    let csvContent = headers.join(',') + '\n';
    
    for (const r of sortedResults) {
      const row = [
        r.density,
        r.numLanes,
        r.meanSpeed,
        r.num_replications,
        ...experimentConfig.metrics.flatMap(metric => [
          r[`${metric}_mean`]?.toFixed(4) || '',
          r[`${metric}_std`]?.toFixed(4) || ''
        ])
      ];
      csvContent += row.join(',') + '\n';
    }
    
    fs.writeFileSync(csvPath, csvContent);
    console.log(`\nFinal results saved to: ${csvPath}`);
    
  } catch (error) {
    console.error('Error generating visualization:', error);
    throw error;
  }
}

// Function to generate HTML visualization
function generateHTML(results) {
  const sortedResults = [...results].sort((a, b) => a.density - b.density);
  
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Fundamental Diagram</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      .chart-container { width: 80%; margin: 0 auto; }
      h1 { text-align: center; color: #333; }
      .chart-box { margin: 30px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    </style>
  </head>
  <body>
    <div class="chart-container">
      <h1>Fundamental Diagram</h1>
      <div class="chart-box">
        <canvas id="throughputChart"></canvas>
      </div>
      <div class="chart-box">
        <canvas id="speedChart"></canvas>
      </div>
    </div>

    <script>
      // Prepare chart data
      const sortedResults = ${JSON.stringify(sortedResults, null, 2)};
      
      // Throughput vs Density
      const throughputCtx = document.getElementById('throughputChart').getContext('2d');
      new Chart(throughputCtx, {
        type: 'line',
        data: {
          labels: sortedResults.map(r => r.density),
          datasets: [{
            label: 'Throughput',
            data: sortedResults.map(r => ({
              x: r.density,
              y: r.throughput_mean,
              yMax: (r.throughput_mean || 0) + (r.throughput_std || 0),
              yMin: Math.max(0, (r.throughput_mean || 0) - (r.throughput_std || 0))
            })),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: 'Throughput vs Density', font: { size: 16 } },
            legend: { position: 'top' },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const data = context.raw;
                  return `Throughput: ${data.y.toFixed(1)} ± ${(data.yMax - data.y).toFixed(1)} veh/h`;
                }
              }
            }
          },
          scales: {
            x: {
              title: { display: true, text: 'Density (veh/km)' },
              min: 0
            },
            y: {
              title: { display: true, text: 'Throughput (veh/h)' },
              min: 0
            }
          }
        }
      });

      // Speed vs Density
      const speedCtx = document.getElementById('speedChart').getContext('2d');
      new Chart(speedCtx, {
        type: 'line',
        data: {
          labels: sortedResults.map(r => r.density),
          datasets: [{
            label: 'Average Speed',
            data: sortedResults.map(r => ({
              x: r.density,
              y: r.avgSpeed_mean,
              yMax: (r.avgSpeed_mean || 0) + (r.avgSpeed_std || 0),
              yMin: Math.max(0, (r.avgSpeed_mean || 0) - (r.avgSpeed_std || 0))
            })),
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: 'Average Speed vs Density', font: { size: 16 } },
            legend: { position: 'top' },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const data = context.raw;
                  return `Speed: ${data.y.toFixed(1)} ± ${(data.yMax - data.y).toFixed(1)} km/h`;
                }
              }
            }
          },
          scales: {
            x: {
              title: { display: true, text: 'Density (veh/km)' },
              min: 0
            },
            y: {
              title: { display: true, text: 'Average Speed (km/h)' },
              min: 0
            }
          }
        }
      });
    </script>
  </body>
</html>
`;
  console.log(`Visualization saved to: ${htmlPath}`);
  console.log('Open this file in a web browser to view the results.');
  
} catch (error) {
  console.error('Error generating visualization:', error);
}
}

// Main execution
(async () => {
  try {
    console.log('=== Starting Freeway Traffic Simulation Experiment ===');
    console.log('Configuration:', JSON.stringify(experimentConfig, null, 2));
    
    const results = await runExperiment();
    await generateVisualization(results);
    
    console.log('\n=== Experiment completed successfully ===');
    console.log(`Results directory: ${resultsDir}`);
    
  } catch (error) {
    console.error('\n!!! Experiment failed with error !!!');
    console.error(error);
    process.exit(1);
  }
})();

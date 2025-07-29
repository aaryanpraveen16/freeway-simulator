#!/usr/bin/env node

const path = require('path');
const ExperimentRunner = require('./utils/experimentRunner');
const config = require('./config/fundamental_diagram.json');

// Convert relative paths to absolute
const resolvePath = (p) => path.resolve(__dirname, p);
config.output.dataDir = resolvePath(config.output.dataDir);
config.output.resultsDir = resolvePath(config.output.resultsDir);

// Create and run the experiment
const experiment = new ExperimentRunner(config);

experiment.run().catch(error => {
  console.error('Experiment failed:', error);
  process.exit(1);
});

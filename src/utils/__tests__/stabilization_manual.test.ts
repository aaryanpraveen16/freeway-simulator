import { calculateStableDuration, STABLE_DENSITY, STABLE_DURATION } from '../trafficSimulation';

console.log('Testing calculateStableDuration...');

const testCases = [
    { density: 150, expected: 300 },
    { density: 10, expected: 4500 },
    { density: 75, expected: 600 },
    { density: 300, expected: 150 },
];

testCases.forEach(({ density, expected }) => {
    const result = calculateStableDuration(density);
    console.log(`Density: ${density}, Expected: ${expected}, Got: ${result}`);
    if (result !== expected) {
        console.error(`FAILED: Expected ${expected} but got ${result}`);
    } else {
        console.log('PASSED');
    }
});

console.log('Testing STABLE_DENSITY and STABLE_DURATION...');
console.log(`STABLE_DENSITY: ${STABLE_DENSITY} (Expected: 150)`);
console.log(`STABLE_DURATION: ${STABLE_DURATION} (Expected: 300)`);

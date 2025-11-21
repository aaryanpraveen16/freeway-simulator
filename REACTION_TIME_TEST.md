# Testing Driver Reaction Time - Step by Step

## Quick Test Setup

### 1. Open Browser Console
- Press F12 to open Developer Tools
- Go to the Console tab
- You'll see debug messages from the simulation

### 2. Set Up Simple Test
1. In the simulation UI:
   - Set **Number of Cars** to 2
   - Set **Number of Lanes** to 1
   - Set **Driver Reaction Time** to 2.0 seconds
   - Start the simulation

2. Use the "Stop Cars" feature to stop Car 1 (the lead car)
3. Wait for Car 0 (following car) to stop behind it
4. Release Car 1 (uncheck it from stopped cars)

### 3. What to Observe

#### In the Console:
You should see messages like:
```
[REACTION START] Car 0 detected leader speed increase (0.0 -> 5.4 km/h), starting 2.0s delay at t=15.3s
[REACTION ACTIVE] Car 0 in delay, 1.80s remaining (ends at t=17.3s)
[REACTION ACTIVE] Car 0 in delay, 1.60s remaining (ends at t=17.3s)
...
[REACTION END] Car 0 delay ended at t=17.3s, can now accelerate (current: 0.0, desired: 90.0 km/h)
```

#### Timing Verification:
- Note the time when `[REACTION START]` appears (e.g., t=15.3s)
- Note the time when `[REACTION END]` appears (e.g., t=17.3s)
- **The difference should be exactly 2.0 seconds** (or whatever you set in the UI)

### 4. Test Different Reaction Times

Try these values and verify the timing:
- **0 seconds**: Car should accelerate immediately (no delay messages)
- **1 second**: Delay should be exactly 1.0s
- **5 seconds**: Delay should be exactly 5.0s
- **10 seconds**: Delay should be exactly 10.0s

### 5. Common Issues

#### If delay seems longer than expected:
- Make sure you're measuring from `[REACTION START]` to `[REACTION END]`
- The car will still take time to accelerate after the delay ends (this is normal acceleration, not reaction delay)

#### If you don't see console messages:
- Make sure you have at least 2 cars
- Make sure Car 0 is following another car
- The messages only appear for Car 0 (first car) to avoid console spam

#### If delay keeps resetting:
- This was the original bug - it should now be fixed
- The delay should only trigger once when the lead car starts accelerating
- It should NOT reset on every frame as the lead car continues to accelerate

## Expected Behavior Summary

✅ **Correct**: 
- Lead car starts moving → 2 second delay → Following car starts accelerating
- Delay is exactly what you set in the UI
- Delay only happens once per acceleration event

❌ **Incorrect** (old bug):
- Delay keeps resetting as lead car accelerates
- Total delay is much longer than configured
- Car takes forever to start moving

## Measuring Actual Time

### Important: Simulation Speed vs Real-World Time

The reaction time is measured in **simulation time**, not real-world time!

**Formula**: `Real-World Time = Simulation Time / Simulation Speed`

Examples:
- At 1x speed: 2.0s simulation time = 2.0s real-world time ✓
- At 2x speed: 2.0s simulation time = 1.0s real-world time
- At 0.5x speed: 2.0s simulation time = 4.0s real-world time

### How to Measure with a Stopwatch

**Option 1: Measure in Simulation Time (Recommended)**
1. Note the simulation time display when lead car starts moving
2. Note the simulation time display when following car starts moving
3. The difference should match your configured reaction time exactly

**Option 2: Measure in Real-World Time**
1. Make sure simulation speed is set to **1x** (normal speed)
2. Use a stopwatch to measure from when lead car moves to when following car moves
3. The time should match your configured reaction time

**Option 3: Account for Simulation Speed**
1. Check your current simulation speed (e.g., 2x)
2. Use stopwatch to measure real-world time
3. Calculate: `Expected Real-World Time = Reaction Time / Simulation Speed`
   - Example: 2.0s reaction at 2x speed = 1.0s real-world time
   - Example: 2.0s reaction at 0.5x speed = 4.0s real-world time

### Console Logs Show Both Times

The debug logs now show both simulation time and real-world time:
```
[REACTION START] ... starting 2.0s simulation delay (1.00s real-world at 2.0x speed)
[REACTION ACTIVE] ... 1.50s simulation time remaining (0.75s real-world at 2.0x speed)
```

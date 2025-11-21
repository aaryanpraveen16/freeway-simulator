# Troubleshooting: Reaction Time Doesn't Match

## Quick Checklist

Before reporting a bug, verify these:

### ✓ 1. Simulation Speed is 1x
- [ ] Check the simulation speed control
- [ ] Make sure it says "1x" or "Normal"
- [ ] NOT 2x, 3x, 0.5x, etc.

### ✓ 2. You're Measuring Correctly
- [ ] Use the console logs (most accurate)
- [ ] OR use the simulation time display (not stopwatch)
- [ ] OR use stopwatch ONLY at 1x speed

### ✓ 3. You're Testing the Right Scenario
- [ ] 2 cars minimum
- [ ] 1 lane (simplest test)
- [ ] Stop lead car, then release it
- [ ] Watch Car 0 (the following car)

### ✓ 4. You Understand Frame Timing
- [ ] Small errors (±0.02s) are normal
- [ ] Due to browser refresh rate (60 FPS = 16.67ms frames)
- [ ] 0.5s might be 0.483s or 0.517s (this is OK!)

## Common Misunderstandings

### "I set 0.5s but measured 0.25s with stopwatch"
**Likely cause**: Simulation speed is 2x
- At 2x speed: 0.5s simulation = 0.25s real-world
- **Solution**: Set simulation speed to 1x

### "I set 0.5s but measured 1.0s with stopwatch"
**Likely cause**: Simulation speed is 0.5x
- At 0.5x speed: 0.5s simulation = 1.0s real-world
- **Solution**: Set simulation speed to 1x

### "The delay keeps changing"
**Likely cause**: Multiple interactions happening
- Other cars changing lanes
- Traffic waves affecting the lead car
- **Solution**: Test with just 2 cars in isolation

### "It takes forever for the car to reach full speed"
**This is NOT the reaction delay!**
- Reaction delay: Time before car STARTS accelerating
- Acceleration time: Time to reach full speed (separate)
- **Example**: 0.5s delay + 5s acceleration = 5.5s total

## What to Measure

### ❌ WRONG: Total time to reach full speed
```
Lead car starts → Following car reaches 90 km/h
This includes: reaction delay + acceleration time
```

### ✅ CORRECT: Time until car starts accelerating
```
Lead car starts → Following car begins to accelerate
This is ONLY the reaction delay
```

## How to Verify Correctly

### Method 1: Console Logs (Best)
```
[REACTION START] ... at t=10.234s ... Will end at t=10.734s
[REACTION END] ... at t=10.735s ... Actual delay: 0.501s
```
**Actual delay: 0.501s** ← This is what matters!

### Method 2: Simulation Time Display
1. Note time when lead car starts: `t=10.234s`
2. Note time when following car starts: `t=10.735s`
3. Calculate: `10.735 - 10.234 = 0.501s` ✓

### Method 3: Stopwatch (at 1x speed only)
1. Verify simulation speed is 1x
2. Start stopwatch when lead car moves
3. Stop when following car starts moving (not when it reaches full speed!)
4. Should be ~0.5s (±0.02s tolerance)

## Still Having Issues?

If you've checked everything above and the timing is still way off, please provide:

1. **Console logs** (copy the [REACTION START] and [REACTION END] messages)
2. **Settings**:
   - Reaction time: ?
   - Simulation speed: ?
   - Number of cars: ?
   - Number of lanes: ?
3. **What you measured**: ?
4. **What you expected**: ?
5. **Screenshot** of the simulation (optional but helpful)

## Expected Behavior Summary

| Reaction Time | Sim Speed | Real-World Time | Tolerance |
|---------------|-----------|-----------------|-----------|
| 0.5s          | 1x        | ~0.50s          | ±0.02s    |
| 1.0s          | 1x        | ~1.00s          | ±0.02s    |
| 2.0s          | 1x        | ~2.00s          | ±0.02s    |
| 0.5s          | 2x        | ~0.25s          | ±0.01s    |
| 0.5s          | 0.5x      | ~1.00s          | ±0.04s    |

The tolerance is due to frame timing and is unavoidable in frame-based simulations.

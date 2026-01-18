import React, { useRef, useEffect, useState, useMemo } from "react";
import { Car, calculateDistanceToCarAhead, getCarColor, Pack } from "@/utils/trafficSimulation";
import { UnitSystem, convertSpeed } from "@/utils/unitConversion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

interface CanvasCarRendererProps {
    cars: Car[];
    packs?: Pack[];
    laneLength: number;
    width: number;
    height: number;
    trackType: "circular" | "straight";
    trackRadius?: number;
    trackLength?: number;
    laneHeight?: number;
    laneCenterOffset?: number;
    trackPadding?: number;
    carSize?: number;
    unitSystem?: UnitSystem;
    stoppedCars: Set<number>;
    onStopCar?: (carId: number) => void;
    onResumeCar?: (carId: number) => void;
    currentTime?: number;
}

const CanvasCarRenderer: React.FC<CanvasCarRendererProps> = ({
    cars,
    packs = [],
    laneLength,
    width,
    height,
    trackType,
    trackRadius = 180,
    trackLength,
    laneHeight = 80,
    laneCenterOffset = 40,
    trackPadding = 16,
    carSize = 24,
    unitSystem = "metric",
    stoppedCars,
    onStopCar,
    onResumeCar,
    currentTime = 0,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hoveredCar, setHoveredCar] = useState<Car | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [isTooltipOpen, setIsTooltipOpen] = useState(false);

    // Memoize car positions for hit testing
    const carPositions = useMemo(() => {
        return cars.map((car) => {
            let x, y, rotation;

            // --- LANE CHANGE INTERPOLATION ---
            // Calculate a visual lane index that interpolates between previous and current
            const LANE_CHANGE_DURATION = 1.0; // Seconds to complete visual float
            let visualLane = car.lane;

            if (car.previousLane !== undefined && car.lastLaneChange !== undefined) {
                const timeSinceChange = currentTime - car.lastLaneChange;
                if (timeSinceChange < LANE_CHANGE_DURATION) {
                    const progress = timeSinceChange / LANE_CHANGE_DURATION;
                    // Cubic Ease-In-Out for smooth natural movement
                    // Formula: x < 0.5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2;
                    const ease = progress < 0.5
                        ? 4 * progress * progress * progress
                        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

                    // Weighted average: start at previous, move to current
                    visualLane = car.previousLane + (car.lane - car.previousLane) * ease;
                }
            }

            if (trackType === "circular") {
                const angle = (car.position / laneLength) * 2 * Math.PI;
                // Circular lane radius interpolation
                // Assuming inner track radius + visualLane * laneWidth
                // NOTE: Circular track logic might need more complex radius math if visualLane is non-integer,
                // but standard radius logic uses trackRadius + ??? 
                // Wait, previous code used fixed trackRadius. Let's inspect where 'lane' was used. 
                // Ah, effectively circular view only shows ONE lane in the snippet I saw? 
                // No, look at line 61 in original 'straight' logic: y = car.lane * laneHeight ...

                // For circular view, if visualLane changes, radius changes.
                // Re-deriving circular logic based on implied multi-lane support or single-lane?
                // The snippet showed: x = width/2 + trackRadius * cos(angle). 
                // It seems circular view ignores lanes for radius? Let's keep it simple for now.

                x = width / 2 + trackRadius * Math.cos(angle);
                y = height / 2 + trackRadius * Math.sin(angle);
                rotation = angle + Math.PI / 2;
            } else {
                x = (car.position / laneLength) * (trackLength || width);
                y = visualLane * laneHeight + laneCenterOffset + trackPadding;
                rotation = 0;
            }
            return { id: car.id, x, y, rotation, car };
        });
    }, [cars, laneLength, trackType, width, height, trackRadius, trackLength, laneHeight, laneCenterOffset, trackPadding, currentTime]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Handle high DPI
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw cars
        carPositions.forEach(({ x, y, rotation, car }) => {
            const isStopped = stoppedCars.has(car.id);
            const color = isStopped ? "#9ca3af" : getCarColor(car);

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);

            // Draw car body shadow
            ctx.shadowBlur = 4;
            ctx.shadowColor = "rgba(0,0,0,0.3)";
            ctx.shadowOffsetY = 2;

            ctx.fillStyle = color;

            const w = car.vehicleType === "truck" ? carSize * 1.5 : carSize;
            const h = car.vehicleType === "motorcycle" ? carSize * 0.5 : carSize * 0.8;

            // Draw the car body
            ctx.fillStyle = color; // Use the 'color' variable derived from getCarColor
            ctx.fillRect(-w / 2, -h / 2, w, h); // Use w and h for car dimensions

            // --- BRAKE LIGHTS ---
            const acceleration = car.acceleration ?? 0;
            if (acceleration < -1.0) {
                // Base brake light glow
                const intensity = Math.min(1.0, (Math.abs(acceleration) - 1.0) / 4.0);
                const isHardBraking = acceleration < -3.0;
                const lightColor = isHardBraking ? `rgba(255, 0, 0, ${0.5 + intensity * 0.5})` : `rgba(200, 0, 0, ${0.3 + intensity * 0.4})`;

                // Rear lights (left and right)
                const lightSize = isHardBraking ? h * 0.4 : h * 0.25;

                ctx.shadowBlur = isHardBraking ? 15 * intensity : 5 * intensity;
                ctx.shadowColor = 'red';
                ctx.fillStyle = lightColor;

                // Left rear
                ctx.fillRect(-w / 2 - 2, -h / 2 + 1, 4, lightSize);
                // Right rear
                ctx.fillRect(-w / 2 - 2, h / 2 - 1 - lightSize, 4, lightSize);

                // Reset shadow
                ctx.shadowBlur = 0;
                ctx.shadowColor = 'transparent';
            }

            // Draw details (windows/windshield)
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;
            ctx.fillStyle = isStopped ? "rgba(75, 85, 99, 0.5)" : "rgba(31, 41, 55, 0.6)";

            if (car.vehicleType === "truck") {
                // Truck cabin
                ctx.fillRect(w / 4, -h / 2 + 2, w / 4, h - 4);
                // Trailer back
                ctx.fillRect(-w / 2 + 2, -h / 2 + 2, w / 2, h - 4);
            } else if (car.vehicleType === "motorcycle") {
                // Simple line for rider
                ctx.fillRect(-w / 4, -h / 4, w / 2, h / 2);
            } else {
                // Car windshield
                ctx.fillRect(w / 6, -h / 2 + 2, w / 4, h - 4);
                // Rear window
                ctx.fillRect(-w / 2 + 4, -h / 2 + 2, w / 6, h - 4);
            }

            // Draw stopped indicator
            if (isStopped) {
                ctx.strokeStyle = "#ef4444";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, carSize / 2 + 2, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();
        });

        // Draw Pack Indicators
        packs.forEach((pack, index) => {
            if (pack.cars.length < 2) return;

            // Sort pack cars by position just in case
            const sortedPackCars = [...pack.cars].sort((a, b) => a.position - b.position);
            const firstCar = sortedPackCars[0];
            const lastCar = sortedPackCars[sortedPackCars.length - 1];

            // Get screen coordinates for pack boundaries
            let x1, y1, x2, y2, rotation1, rotation2;

            if (trackType === "circular") {
                const angle1 = (firstCar.position / laneLength) * 2 * Math.PI;
                const angle2 = (lastCar.position / laneLength) * 2 * Math.PI;

                // Adjust for wraparound in rendering connection
                let diff = angle2 - angle1;
                while (diff < -Math.PI) diff += 2 * Math.PI;
                while (diff > Math.PI) diff -= 2 * Math.PI;

                // Slightly offset radius for the pack bracket
                const bracketRadius = trackRadius + laneHeight / 2 - 10;

                ctx.save();
                ctx.beginPath();
                ctx.strokeStyle = `hsla(${200 + index * 40}, 70%, 50%, 0.6)`;
                ctx.lineWidth = 3;
                ctx.setLineDash([5, 3]);

                // Draw arc between cars
                // If the pack wraps around, we need to handle the path correctly
                ctx.arc(width / 2, height / 2, bracketRadius, angle1, angle1 + diff, diff < 0);
                ctx.stroke();

                // Draw end caps (little ticks)
                ctx.beginPath();
                ctx.setLineDash([]);
                const innerR = bracketRadius - 5;
                const outerR = bracketRadius + 5;

                ctx.moveTo(width / 2 + innerR * Math.cos(angle1), height / 2 + innerR * Math.sin(angle1));
                ctx.lineTo(width / 2 + outerR * Math.cos(angle1), height / 2 + outerR * Math.sin(angle1));

                ctx.moveTo(width / 2 + innerR * Math.cos(angle1 + diff), height / 2 + innerR * Math.sin(angle1 + diff));
                ctx.lineTo(width / 2 + outerR * Math.cos(angle1 + diff), height / 2 + outerR * Math.sin(angle1 + diff));
                ctx.stroke();

                ctx.restore();
            } else {
                // Straight View
                x1 = (firstCar.position / laneLength) * (trackLength || width);
                y1 = firstCar.lane * laneHeight + laneCenterOffset + trackPadding;
                x2 = (lastCar.position / laneLength) * (trackLength || width);
                y2 = lastCar.lane * laneHeight + laneCenterOffset + trackPadding;

                // If pack wraps around (end of track to beginning), don't draw connecting line across the whole screen 
                // OR draw two separate segments. For simplicity here, if wrap, we just skip the line or split it.
                const isWrapped = pack.startPos > pack.endPos;

                const drawSegment = (startX: number, endX: number, laneY: number) => {
                    const bracketY = laneY + laneHeight / 2 - 15;
                    ctx.save();
                    ctx.beginPath();
                    ctx.strokeStyle = `hsla(${200 + index * 40}, 70%, 50%, 0.8)`;
                    ctx.lineWidth = 3;
                    ctx.setLineDash([5, 3]);
                    ctx.moveTo(startX, bracketY);
                    ctx.lineTo(endX, bracketY);
                    ctx.stroke();

                    // Draw vertical caps
                    ctx.setLineDash([]);
                    ctx.beginPath();
                    ctx.moveTo(startX, bracketY - 8);
                    ctx.lineTo(startX, bracketY + 8);
                    ctx.moveTo(endX, bracketY - 8);
                    ctx.lineTo(endX, bracketY + 8);
                    ctx.stroke();
                    ctx.restore();
                };

                if (isWrapped) {
                    // Two segments: end car to track end, track start to first car
                    const trackEnd = trackLength || width;
                    drawSegment(x1, trackEnd, y1);
                    drawSegment(0, x2, y2);
                } else {
                    drawSegment(x1, x2, y1);
                }
            }
        });
    }, [carPositions, width, height, carSize, stoppedCars, packs, laneLength, trackType, trackRadius, trackLength, laneHeight, laneCenterOffset, trackPadding]);

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Find car under mouse
        const found = carPositions.find((pos) => {
            const dx = pos.x - x;
            const dy = pos.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return dist < carSize;
        });

        if (found) {
            setHoveredCar(found.car);
            setTooltipPos({ x: found.x, y: found.y });
            setIsTooltipOpen(true);
        } else {
            setIsTooltipOpen(false);
        }
    };

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const found = carPositions.find((pos) => {
            const dx = pos.x - x;
            const dy = pos.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return dist < carSize;
        });

        if (found) {
            const carId = found.car.id;
            if (stoppedCars.has(carId)) {
                onResumeCar?.(carId);
            } else {
                onStopCar?.(carId);
            }
        }
    };

    return (
        <TooltipProvider delayDuration={0}>
            <div className="relative w-full h-full">
                <canvas
                    ref={canvasRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setIsTooltipOpen(false)}
                    onClick={handleClick}
                    className="cursor-pointer"
                />

                {hoveredCar && (
                    <Tooltip open={isTooltipOpen}>
                        <TooltipTrigger asChild>
                            <div
                                className="absolute pointer-events-none"
                                style={{
                                    left: tooltipPos.x,
                                    top: tooltipPos.y,
                                    width: 1,
                                    height: 1,
                                }}
                            />
                        </TooltipTrigger>
                        <TooltipContent
                            side="top"
                            className="z-[100] bg-gray-900/95 backdrop-blur-sm border border-gray-700 shadow-xl p-3 max-w-xs"
                            sideOffset={carSize / 2 + 8}
                            align="center"
                        >
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-yellow-300">{hoveredCar.name}</h4>
                                    <span className="text-xs px-2 py-0.5 bg-gray-700/50 rounded-full text-gray-300">
                                        {hoveredCar.vehicleType}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400">Speed:</span>
                                        <span className="font-mono text-gray-100">
                                            {(() => {
                                                const currentCar = cars.find(c => c.id === hoveredCar.id) || hoveredCar;
                                                const convertedSpeed = convertSpeed(currentCar.speed, 'metric', unitSystem);
                                                const unit = unitSystem === 'metric' ? 'km/h' : 'mph';
                                                return `${convertedSpeed.toFixed(1)} ${unit}`;
                                            })()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400">Gap:</span>
                                        <span className="font-mono text-gray-100">
                                            {(() => {
                                                const carIndex = cars.findIndex(c => c.id === hoveredCar.id);
                                                if (carIndex === -1) return 'N/A';
                                                const gap = calculateDistanceToCarAhead(carIndex, cars, laneLength);
                                                return (gap * 1000).toFixed(1);
                                            })()} m
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400">Lane:</span>
                                        <span className="font-mono text-gray-100">
                                            {(cars.find(c => c.id === hoveredCar.id) || hoveredCar).lane + 1}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400">Status:</span>
                                        <span className={cn(
                                            "text-xs px-1.5 py-0.5 rounded-full font-medium",
                                            stoppedCars.has(hoveredCar.id)
                                                ? "bg-red-900/30 text-red-400"
                                                : "bg-emerald-900/30 text-emerald-400"
                                        )}>
                                            {stoppedCars.has(hoveredCar.id) ? 'Stopped' : 'Moving'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-2 pt-2 border-t border-gray-800 text-xs text-amber-400/90 flex items-center gap-1.5">
                                    <Info size={12} />
                                    <span>Click to {stoppedCars.has(hoveredCar.id) ? 'resume' : 'stop'}</span>
                                </div>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
        </TooltipProvider>
    );
};

export default CanvasCarRenderer;

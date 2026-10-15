import React, { useRef, useEffect, useState, useMemo } from "react";
import { Application, Graphics } from "pixi.js";
import { Car, getCarColor, Pack, calculateDistanceToCarAhead } from "@/utils/trafficSimulation";
import { UnitSystem, convertSpeed } from "@/utils/unitConversion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

interface WebGLCarRendererProps {
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

export const WebGLCarRenderer: React.FC<WebGLCarRendererProps> = ({
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
    const containerRef = useRef<HTMLDivElement>(null);
    const pixiAppRef = useRef<Application | null>(null);
    const graphicsRef = useRef<Graphics | null>(null);

    const [hoveredCar, setHoveredCar] = useState<Car | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [isTooltipOpen, setIsTooltipOpen] = useState(false);

    // 1. Calculate positions in screen coordinates (matches CanvasCarRenderer logic)
    const carPositions = useMemo(() => {
        return cars.map((car) => {
            let x: number, y: number, rotation: number;

            // Lane change interpolation
            const LANE_CHANGE_DURATION = 1.0;
            let visualLane = car.lane;

            if (car.previousLane !== undefined && car.lastLaneChange !== undefined) {
                const timeSinceChange = currentTime - car.lastLaneChange;
                if (timeSinceChange < LANE_CHANGE_DURATION) {
                    const progress = timeSinceChange / LANE_CHANGE_DURATION;
                    const ease = progress < 0.5
                        ? 4 * progress * progress * progress
                        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
                    visualLane = car.previousLane + (car.lane - car.previousLane) * ease;
                }
            }

            if (trackType === "circular") {
                const angle = (car.position / laneLength) * 2 * Math.PI;
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

    // 2. Initialize Pixi.js WebGL Application
    useEffect(() => {
        let isMounted = true;
        const app = new Application();

        async function initPixi() {
            if (!containerRef.current) return;
            const dpr = window.devicePixelRatio || 1;

            await app.init({
                width,
                height,
                backgroundAlpha: 0,
                resolution: dpr,
                autoDensity: true,
                antialias: true,
                preference: 'webgl',
            });

            if (!isMounted || !containerRef.current) {
                app.destroy(true, { children: true });
                return;
            }

            // Append Pixi canvas to DOM container
            containerRef.current.innerHTML = "";
            containerRef.current.appendChild(app.canvas);

            const graphics = new Graphics();
            app.stage.addChild(graphics);

            pixiAppRef.current = app;
            graphicsRef.current = graphics;
        }

        initPixi();

        return () => {
            isMounted = false;
            if (pixiAppRef.current) {
                pixiAppRef.current.destroy(true, { children: true });
                pixiAppRef.current = null;
                graphicsRef.current = null;
            }
        };
    }, []);

    // 3. Resize Pixi renderer when width/height change
    useEffect(() => {
        if (pixiAppRef.current && width > 0 && height > 0) {
            pixiAppRef.current.renderer.resize(width, height);
        }
    }, [width, height]);

    // 4. Draw vehicles and pack indicators via WebGL
    useEffect(() => {
        const g = graphicsRef.current;
        if (!g) return;

        g.clear();

        // --- DRAW CARS ---
        carPositions.forEach(({ x, y, rotation, car }) => {
            const isStopped = stoppedCars.has(car.id);
            const colorStr = isStopped ? "#9ca3af" : getCarColor(car);

            const w = car.vehicleType === "truck" ? carSize * 1.5 : carSize;
            const h = car.vehicleType === "motorcycle" ? carSize * 0.5 : carSize * 0.8;

            // Shadow / Underglow
            g.rect(x - w / 2, y - h / 2 + 1, w, h);
            g.fill({ color: 0x000000, alpha: 0.25 });

            // Car Body
            // Save & rotate for circular track or heading
            // Pixi graphics supports drawing at origin or using matrices; here simple local transform:
            // For straight track, rotation is 0; for circular, rotation is angle + PI/2
            if (rotation !== 0) {
                // Approximate body drawing for rotated vehicles
                const cos = Math.cos(rotation);
                const sin = Math.sin(rotation);
                const hw = w / 2;
                const hh = h / 2;
                const p1 = { x: x + (-hw * cos - -hh * sin), y: y + (-hw * sin + -hh * cos) };
                const p2 = { x: x + (hw * cos - -hh * sin), y: y + (hw * sin + -hh * cos) };
                const p3 = { x: x + (hw * cos - hh * sin), y: y + (hw * sin + hh * cos) };
                const p4 = { x: x + (-hw * cos - hh * sin), y: y + (-hw * sin + hh * cos) };

                g.poly([p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y]);
                g.fill({ color: colorStr });
            } else {
                // --- MODERN VEHICLE MODEL ---
                // 1. Soft ambient shadow underbody
                g.roundRect(x - w / 2 - 2, y - h / 2 - 1, w + 4, h + 2, 4);
                g.fill({ color: 0x000000, alpha: 0.35 });

                // 2. Wheels / Tires (Front & Rear)
                const wheelW = Math.max(3, w * 0.18);
                const wheelH = 2.5;
                const tireColor = 0x0f172a;
                // Front wheels (right side of car, heading right)
                g.roundRect(x + w * 0.22, y - h / 2 - 1.5, wheelW, wheelH, 1);
                g.roundRect(x + w * 0.22, y + h / 2 - 1, wheelW, wheelH, 1);
                // Rear wheels
                g.roundRect(x - w * 0.38, y - h / 2 - 1.5, wheelW, wheelH, 1);
                g.roundRect(x - w * 0.38, y + h / 2 - 1, wheelW, wheelH, 1);
                g.fill({ color: tireColor });

                // 3. Aerodynamic Main Body Shell
                const cornerRadius = car.vehicleType === "truck" ? 3 : 5;
                g.roundRect(x - w / 2, y - h / 2, w, h, cornerRadius);
                g.fill({ color: colorStr });
                // Subtle metallic body highlight edge
                g.stroke({ width: 1, color: 0xffffff, alpha: 0.15 });

                // 4. Side Mirrors (for sedan/car)
                if (car.vehicleType === "car") {
                    g.rect(x + w * 0.1, y - h / 2 - 2, 2, 2);
                    g.rect(x + w * 0.1, y + h / 2, 2, 2);
                    g.fill({ color: colorStr });
                }

                // 5. Cockpit & Glass Canopy (Roof / Windshields)
                const glassColor = 0x0f172a;
                const glassAlpha = isStopped ? 0.45 : 0.75;
                const roofColor = colorStr;

                if (car.vehicleType === "truck") {
                    // Truck cab (front)
                    g.roundRect(x + w * 0.18, y - h / 2 + 1.5, w * 0.28, h - 3, 2);
                    g.fill({ color: glassColor, alpha: glassAlpha });
                    // Cargo container (rear)
                    g.roundRect(x - w / 2 + 1.5, y - h / 2 + 1, w * 0.62, h - 2, 1);
                    g.fill({ color: 0x334155, alpha: 0.9 });
                    g.stroke({ width: 1, color: 0x475569 });
                } else if (car.vehicleType === "motorcycle") {
                    // Slim aerodynamic bike silhouette
                    g.roundRect(x - w * 0.25, y - h * 0.3, w * 0.5, h * 0.6, 2);
                    g.fill({ color: 0x1e293b, alpha: 0.9 });
                } else {
                    // Sedan / Sports Car: Sleek tinted glass cabin with colored roof
                    // Glass canopy base
                    g.roundRect(x - w * 0.26, y - h / 2 + 1.5, w * 0.52, h - 3, 3);
                    g.fill({ color: glassColor, alpha: glassAlpha });

                    // Roof panel
                    g.roundRect(x - w * 0.14, y - h / 2 + 2.5, w * 0.28, h - 5, 2);
                    g.fill({ color: roofColor });
                    g.stroke({ width: 0.5, color: 0xffffff, alpha: 0.2 });
                }

                // 6. Forward Headlight Beams & Xenon Lamps (Pointing Right)
                // Headlight lenses
                const lampH = Math.max(2, h * 0.2);
                g.rect(x + w / 2 - 1, y - h / 2 + 1, 1.5, lampH);
                g.rect(x + w / 2 - 1, y + h / 2 - 1 - lampH, 1.5, lampH);
                g.fill({ color: 0xfef08a }); // Warm white/yellow beam

                // Subtle forward beam glow cone
                g.poly([
                    x + w / 2, y - h / 2 + 1,
                    x + w / 2 + 18, y - h / 2 - 5,
                    x + w / 2 + 18, y + h / 2 + 5,
                    x + w / 2, y + h / 2 - 1
                ]);
                g.fill({ color: 0xfef9c3, alpha: 0.08 });

                // 7. Dynamic Taillights & Heavy Brake Lights (Facing Left)
                const acceleration = car.acceleration ?? 0;
                const isBraking = acceleration < -1.0;
                const isHardBraking = acceleration < -3.0;

                const tailColor = isHardBraking ? 0xff0000 : isBraking ? 0xef4444 : 0x991b1b;
                const tailAlpha = isBraking ? 1.0 : 0.6;
                const tailHeight = isHardBraking ? h * 0.45 : isBraking ? h * 0.35 : h * 0.22;

                // Tail lamps
                g.rect(x - w / 2 - 1, y - h / 2 + 1, 2, tailHeight);
                g.rect(x - w / 2 - 1, y + h / 2 - 1 - tailHeight, 2, tailHeight);
                g.fill({ color: tailColor, alpha: tailAlpha });

                // Brake halo glow when actively decelerating
                if (isBraking) {
                    g.circle(x - w / 2 - 2, y - h / 2 + 1 + tailHeight / 2, isHardBraking ? 8 : 4);
                    g.fill({ color: 0xff0000, alpha: isHardBraking ? 0.35 : 0.2 });

                    g.circle(x - w / 2 - 2, y + h / 2 - 1 - tailHeight / 2, isHardBraking ? 8 : 4);
                    g.fill({ color: 0xff0000, alpha: isHardBraking ? 0.35 : 0.2 });
                }
            }

            // Stopped indicator ring (with pulse-like glow)
            if (isStopped) {
                g.circle(x, y, carSize / 2 + 4);
                g.stroke({ width: 2, color: 0xef4444, alpha: 0.9 });
                g.circle(x, y, carSize / 2 + 6);
                g.stroke({ width: 1, color: 0xef4444, alpha: 0.35 });
            }
        });

        // --- DRAW PACK INDICATORS ---
        packs.forEach((pack, index) => {
            if (pack.cars.length < 2) return;
            const sortedPackCars = [...pack.cars].sort((a, b) => a.position - b.position);
            const firstCar = sortedPackCars[0];
            const lastCar = sortedPackCars[sortedPackCars.length - 1];

            if (trackType === "straight") {
                const x1 = (firstCar.position / laneLength) * (trackLength || width);
                const y1 = firstCar.lane * laneHeight + laneCenterOffset + trackPadding;
                const x2 = (lastCar.position / laneLength) * (trackLength || width);
                const bracketY = y1 + laneHeight / 2 - 15;

                const bracketColor = 0x38bdf8;

                if (pack.startPos <= pack.endPos) {
                    g.moveTo(x1, bracketY);
                    g.lineTo(x2, bracketY);
                    g.stroke({ width: 2, color: bracketColor, alpha: 0.8 });

                    // Tick caps
                    g.moveTo(x1, bracketY - 6);
                    g.lineTo(x1, bracketY + 6);
                    g.stroke({ width: 2, color: bracketColor, alpha: 0.8 });

                    g.moveTo(x2, bracketY - 6);
                    g.lineTo(x2, bracketY + 6);
                    g.stroke({ width: 2, color: bracketColor, alpha: 0.8 });
                }
            }
        });
    }, [carPositions, stoppedCars, packs, trackType, width, height, carSize, laneLength, trackLength, laneHeight, laneCenterOffset, trackPadding]);

    // 5. Mouse Hit-Testing for Tooltip & Click-to-Stop
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const found = carPositions.find((pos) => {
            const dx = pos.x - mx;
            const dy = pos.y - my;
            return Math.sqrt(dx * dx + dy * dy) < carSize;
        });

        if (found) {
            setHoveredCar(found.car);
            setTooltipPos({ x: found.x, y: found.y });
            setIsTooltipOpen(true);
        } else {
            setIsTooltipOpen(false);
        }
    };

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const found = carPositions.find((pos) => {
            const dx = pos.x - mx;
            const dy = pos.y - my;
            return Math.sqrt(dx * dx + dy * dy) < carSize;
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
            <div
                className="relative w-full h-full cursor-pointer"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setIsTooltipOpen(false)}
                onClick={handleClick}
            >
                {/* Pixi.js Canvas is mounted here */}
                <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none" />

                {/* Radix UI Tooltip */}
                {hoveredCar && (
                    <Tooltip open={isTooltipOpen}>
                        <TooltipTrigger asChild>
                            <div
                                className="absolute pointer-events-none"
                                style={{
                                    left: `${tooltipPos.x}px`,
                                    top: `${tooltipPos.y}px`,
                                    width: 1,
                                    height: 1,
                                }}
                            />
                        </TooltipTrigger>
                        <TooltipContent
                            side="top"
                            className="bg-gray-900/95 text-white border-gray-700 p-3 shadow-xl backdrop-blur-sm z-50 text-xs"
                        >
                            <div className="space-y-1.5 min-w-[140px]">
                                <div className="font-semibold flex items-center justify-between border-b border-gray-700/60 pb-1">
                                    <span>Car #{hoveredCar.id}</span>
                                    <span className="capitalize text-gray-400 text-[10px]">{hoveredCar.vehicleType || "sedan"}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-gray-300">
                                    <span>Speed:</span>
                                    <span className="font-mono text-right font-medium text-emerald-400">
                                        {(() => {
                                            const currentCar = cars.find(c => c.id === hoveredCar.id) || hoveredCar;
                                            const convertedSpeed = convertSpeed(currentCar.speed, 'metric', unitSystem);
                                            const unit = unitSystem === 'metric' ? 'km/h' : 'mph';
                                            return `${convertedSpeed.toFixed(1)} ${unit}`;
                                        })()}
                                    </span>
                                    <span>Gap:</span>
                                    <span className="font-mono text-right text-gray-300">
                                        {(() => {
                                            const carIndex = cars.findIndex(c => c.id === hoveredCar.id);
                                            if (carIndex === -1) return 'N/A';
                                            const gap = calculateDistanceToCarAhead(carIndex, cars, laneLength);
                                            return `${(gap * 1000).toFixed(1)} m`;
                                        })()}
                                    </span>
                                    <span>Lane:</span>
                                    <span className="font-mono text-right">
                                        {(cars.find(c => c.id === hoveredCar.id) || hoveredCar).lane + 1}
                                    </span>
                                    <span>Accel:</span>
                                    <span className={cn(
                                        "font-mono text-right",
                                        ((cars.find(c => c.id === hoveredCar.id) || hoveredCar).acceleration || 0) < -1 ? "text-red-400 font-semibold" : "text-gray-300"
                                    )}>
                                        {((cars.find(c => c.id === hoveredCar.id) || hoveredCar).acceleration || 0).toFixed(1)} m/s²
                                    </span>
                                </div>
                                <div className="text-[10px] text-gray-400 pt-1 border-t border-gray-700/40 text-center">
                                    Click to {stoppedCars.has(hoveredCar.id) ? "Resume" : "Stop"}
                                </div>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
        </TooltipProvider>
    );
};

export default WebGLCarRenderer;

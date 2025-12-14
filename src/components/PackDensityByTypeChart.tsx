import React, { useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UnitSystem, getUnitConversions } from "@/utils/unitConversion";
import { calculateStabilizedValue } from "@/utils/stabilizedValueCalculator";

interface PackDensityByTypeChartProps {
    packHistory: any[];
    densityHistory: any[];
    freewayLength: number;
    unitSystem?: UnitSystem;
}

const PACK_COLORS = {
    small: 'hsl(var(--chart-blue))',
    medium: 'hsl(var(--chart-orange))',
    large: 'hsl(var(--chart-red))'
};

const PackDensityByTypeChart: React.FC<PackDensityByTypeChartProps> = ({
    packHistory,
    densityHistory,
    freewayLength,
    unitSystem = 'metric'
}) => {
    const conversions = getUnitConversions(unitSystem);
    const chartRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Mapping density history for efficient lookup
    const densityMap = useMemo(() => {
        const map = new Map<number, number>();
        densityHistory.forEach(d => map.set(d.time, d.density));
        return map;
    }, [densityHistory]);

    const chartData = useMemo(() => {
        const lengthVal = unitSystem === 'imperial' ? freewayLength * 0.621371 : freewayLength;

        const points: any[] = [];

        packHistory.forEach(record => {
            const density = densityMap.get(record.time);
            if (density !== undefined && record.packCount !== undefined) {
                points.push({
                    time: record.time,
                    packsPerDist: parseFloat((record.packCount / lengthVal).toFixed(2))
                });
            }
        });

        return points;
    }, [packHistory, densityMap, freewayLength, unitSystem, conversions]);

    // Calculate stabilized values for each pack type
    const stabilizedValues = useMemo(() => {
        const lengthVal = unitSystem === 'imperial' ? freewayLength * 0.621371 : freewayLength;
        const getNormalizedData = (key: string) => packHistory
            .filter(item => item[key] !== undefined)
            .map(item => item[key] / lengthVal);

        return {
            small: calculateStabilizedValue(getNormalizedData('smallPacks')),
            medium: calculateStabilizedValue(getNormalizedData('mediumPacks')),
            large: calculateStabilizedValue(getNormalizedData('largePacks'))
        };
    }, [packHistory, freewayLength, unitSystem]);

    const handleExportImage = () => {
        if (!chartRef.current) return;

        try {
            const svgElement = chartRef.current.querySelector("svg");
            if (!svgElement) throw new Error("SVG element not found");

            const clonedSvg = svgElement.cloneNode(true) as SVGElement;
            clonedSvg.setAttribute("style", "background-color: white;");

            const allPaths = clonedSvg.querySelectorAll("path");
            allPaths.forEach(path => {
                const currentWidth = path.getAttribute("stroke-width") || "1";
                if (parseFloat(currentWidth) <= 1) {
                    path.setAttribute("stroke-width", "2");
                }
            });

            const svgData = new XMLSerializer().serializeToString(clonedSvg);
            const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });

            const downloadLink = document.createElement("a");
            downloadLink.href = URL.createObjectURL(svgBlob);
            downloadLink.download = "pack-density-chart.svg";
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            toast({
                title: "Chart exported",
                description: "Chart exported successfully",
                duration: 3000,
            });
        } catch (error) {
            console.error("Error exporting chart:", error);
            toast({
                title: "Export failed",
                variant: "destructive",
                duration: 3000,
            });
        }
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-lg">Total Car Packs per Distance vs Total Traffic Density</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Analyze total traffic clustering (packs per distance) over time
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleExportImage} className="flex items-center gap-1">
                        <Download size={16} /> Export
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[400px]" ref={chartRef}>
                    <ChartContainer
                        className="h-full"
                        config={{
                            packsPerDist: { label: "Packs per Distance", color: "hsl(var(--primary))" }
                        }}
                    >
                        <LineChart
                            data={chartData}
                            margin={{ top: 20, right: 30, bottom: 60, left: 60 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="time"
                                name="Time"
                                label={{ value: "Time (seconds)", position: "insideBottom", offset: -40, style: { fontWeight: 500 } }}
                                tickFormatter={(value) => value.toFixed(0)}
                            />
                            <YAxis
                                name="Packs per Distance"
                                label={{ value: `Packs per ${conversions.distance.unit}`, angle: -90, position: "insideLeft", style: { fontWeight: 500 } }}
                                domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]}
                            />
                            <Tooltip
                                formatter={(value: number) => [
                                    `${value.toFixed(2)} / ${conversions.distance.unit}`,
                                    "Packs per Distance"
                                ]}
                                labelFormatter={(label) => `Time: ${Number(label).toFixed(2)} seconds`}
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '0.5rem',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    padding: '8px 12px',
                                    fontSize: '14px'
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="packsPerDist"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ChartContainer>
                </div>

                {/* Stabilized Values Display */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-semibold mb-2">Stabilized Pack Density by Type:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PACK_COLORS.small }} />
                                <span>Small Packs:</span>
                            </div>
                            <span className={`font-mono ${stabilizedValues.small?.isStabilized ? 'text-green-600' : 'text-orange-600'}`}>
                                {stabilizedValues.small?.value ? stabilizedValues.small.value.toFixed(2) : 'N/A'} / {conversions.distance.unit}
                                {stabilizedValues.small?.isStabilized && ' ✓'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PACK_COLORS.medium }} />
                                <span>Medium Packs:</span>
                            </div>
                            <span className={`font-mono ${stabilizedValues.medium?.isStabilized ? 'text-green-600' : 'text-orange-600'}`}>
                                {stabilizedValues.medium?.value ? stabilizedValues.medium.value.toFixed(2) : 'N/A'} / {conversions.distance.unit}
                                {stabilizedValues.medium?.isStabilized && ' ✓'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PACK_COLORS.large }} />
                                <span>Large Packs:</span>
                            </div>
                            <span className={`font-mono ${stabilizedValues.large?.isStabilized ? 'text-green-600' : 'text-orange-600'}`}>
                                {stabilizedValues.large?.value ? stabilizedValues.large.value.toFixed(2) : 'N/A'} / {conversions.distance.unit}
                                {stabilizedValues.large?.isStabilized && ' ✓'}
                            </span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        ✓ indicates stabilized values.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

export default PackDensityByTypeChart;

"use client"


import React, { useEffect, useRef, useState } from "react";
import { BarChartRaceProps, CountryData } from "../types/data.types";
import '../globals.css';
import * as d3 from "d3";

const BarChartRace: React.FC<BarChartRaceProps> = ({ data }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [yearIndex, setYearIndex] = useState<number>(0);
    const [selectedContinents, setSelectedContinents] = useState<string[]>([]);
    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const yearKeys = Object.keys(data);
    const barHeight = 30;
    const margin = { top: 20, right: 120, bottom: 60, left: 150 };

    // Define a color scale for continents
    const continentColors = d3.scaleOrdinal<string>()
        .domain(["Asia", "Europe", "Africa", "America", "Australia"])
        .range(["#159af7", "#ec7106", "#00db00", "#dfcf04", "#a341fb"]);

    // Define a color for the default button
    const defaultButtonColor = "#000000"; // Black color for default button
    

    useEffect(() => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        const width = svg.node()?.getBoundingClientRect().width || 800;
        const height = (barHeight + 5) * 12 + margin.top + margin.bottom;

        // Setting SVG size
        svg.attr("width", width).attr("height", height);

        const updateChart = (year: string) => {
            const currentData = data[year]
                .filter(d => selectedContinents.length === 0 || !selectedContinents.includes(d.Continent))
                .sort((a, b) => b.Population - a.Population)
                .slice(0, 12);

            // Set the maximum bar width to 80% of the available SVG width
            const barMaxWidth = 0.8 * (width - margin.left - margin.right);

            const xScale = d3
                .scaleLinear()
                .domain([0, d3.max(currentData, (d) => d.Population) as number])
                .range([margin.left, margin.left + barMaxWidth]);

            const yScale = d3
                .scaleBand()
                .domain(currentData.map((d) => d.Country_name))
                .range([margin.top, height - margin.bottom])
                .padding(0.1);

            // Define the axis
            const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d3.format(".2s"));

            // Select the axis group
            const xAxisGroup = svg
                .select<SVGGElement>(".x-axis")
                .attr("transform", `translate(0, ${height - margin.bottom})`);

            xAxisGroup
                .transition()
                .duration(500)
                .call(xAxis);

            // JOIN new data with old elements
            const bars = svg.selectAll<SVGTextElement, CountryData>(".bar").data(currentData, (d: CountryData) => d.Country_name);

            // EXIT old elements not present in new data
            bars.exit().remove();

            // UPDATE old elements present in new data
            bars
                .transition()
                .duration(500)
                .attr("x", xScale(0))
                .attr("y", (d) => yScale(d.Country_name) as number)
                .attr("width", (d) => xScale(d.Population) - margin.left)
                .attr("height", yScale.bandwidth())
                .attr("fill", (d) => continentColors(d.Continent));

            // ENTER new elements
            bars
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", xScale(0))
                .attr("y", (d) => yScale(d.Country_name) as number)
                .attr("width", (d) => xScale(d.Population) - margin.left)
                .attr("height", yScale.bandwidth())
                .style("fill", (d) => continentColors(d.Continent));

            // Labels
            svg
                .selectAll<SVGTextElement, CountryData>(".label")
                .data(currentData, (d: CountryData) => d.Country_name)
                .join("text")
                .attr("class", "label")
                .attr("x", margin.left - 10)
                .attr("y", (d) => (yScale(d.Country_name) as number) + yScale.bandwidth() / 2)
                .attr("dy", "0.35em")
                .attr("text-anchor", "end")
                .text((d) => `${d.Country_name}`);

            // Population labels on bars
            svg
                .selectAll<SVGTextElement, CountryData>(".population")
                .data(currentData, (d: CountryData) => d.Country_name)
                .join("text")
                .attr("class", "population")
                .attr("x", (d) => {
                    const labelX = xScale(d.Population) + 5;
                    return Math.min(labelX, width - margin.right - 50);
                })
                .attr("y", (d) => (yScale(d.Country_name) as number) + yScale.bandwidth() / 2)
                .attr("dy", "0.35em")
                .attr("text-anchor", "start")
                .text((d) => d.Population.toLocaleString());

            // Remove old flags
            svg.selectAll<SVGImageElement, CountryData>(".flag").remove();

            // Add new flags
            svg
                .selectAll<SVGImageElement, CountryData>(".flag")
                .data(currentData, (d: CountryData) => d.Country_name)
                .join("image")
                .attr("class", "flag")
                .attr("xlink:href", d => `/flags/${d.Flags}.svg`) // Assuming your data has a Flag_url field
                .attr("x", d => xScale(d.Population) - 30) // Adjust based on your flag size
                .attr("y", d => yScale(d.Country_name) as number)
                .attr("width", 30) // Adjust flag size
                .attr("height", yScale.bandwidth())
                .attr("clip-path", "url(#clip)"); // Clip path to handle overlapping

            // Ensure clip path is correct
            svg.select("defs").select("clipPath").remove();
            svg.append("defs").append("clipPath")
                .attr("id", "clip")
                .append("rect")
                .attr("x", margin.left)
                .attr("y", margin.top)
                .attr("width", width - margin.left - margin.right)
                .attr("height", height - margin.top - margin.bottom);

            // Year label
            svg
                .selectAll(".year-label")
                .data([year])
                .join("text")
                .attr("class", "year-label")
                .attr("x", width - margin.right - 20) // Adjusted x position
                .attr("y", height - margin.bottom - 60) // Adjusted y position
                .attr("dy", "-1em")
                .attr("text-anchor", "end")
                .style("font-size", "48px")
                .style("opacity", 0.2)
                .text(year);

            // Total population label
            const totalPopulation = d3.sum(currentData, d => d.Population);
            svg
                .selectAll(".total-population")
                .data([totalPopulation])
                .join("text")
                .attr("class", "total-population")
                .attr("x", width - margin.right - 20) // Adjusted x position to match year label
                .attr("y", height - margin.bottom - 30) // Positioned below the year label
                .attr("dy", "1.2em") // Positioned below the year label
                .attr("text-anchor", "end")
                .style("font-size", "20px")
                .text(d => `Total: ${d.toLocaleString()}`);
        };

        // Update chart initially
        updateChart(yearKeys[yearIndex]);

        let interval: NodeJS.Timeout | null = null;

        if (isPlaying) {
            interval = setInterval(() => {
                setYearIndex((prev) => (prev + 1) % yearKeys.length);
            }, 800);
        } else {
            if (interval) clearInterval(interval);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [data, yearIndex, yearKeys, selectedContinents, isPlaying]);

    // Get button colors based on continent colors
    const getButtonColor = (continent: string) => {
        return continentColors(continent);
    };

    // Centered button styles
    const buttonStyle = {
        display: "inline-block",
        margin: "0 5px",
        padding: "10px 20px",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        fontWeight: "normal",
        backgroundColor: defaultButtonColor, // Black color for default button
        color: "#000000",
    };

    // Circular button styles
    const circularButtonStyle = {
        ...buttonStyle,
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#d1bcbc",
        border: "none",
    };

    // Icon styles
    const iconStyle = {
        width: "32px",
        height: "32px",
    };

    return (
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
            {/* Filter Buttons */}
            <div>
                {["Asia", "Europe", "Africa", "America", "Australia"].map((continent) => (
                    <button
                        key={continent}
                        onClick={() => {
                            setSelectedContinents((prev) => {
                                if (prev.includes(continent)) {
                                    if (prev.length === 1) return []; // If it's the only selected continent, clear all
                                    return prev.filter(c => c !== continent); // Unselect if already selected
                                } else {
                                    return [...prev, continent]; // Select if not selected
                                }
                            });
                        }}
                        style={{
                            ...buttonStyle,
                            backgroundColor: getButtonColor(continent),
                            fontWeight: selectedContinents.includes(continent) ? "normal" : "bold",
                            cursor: selectedContinents.includes(continent) ? "default" : "pointer",
                            opacity: selectedContinents.includes(continent) ? 0.5 : 1,
                        }}
                    >
                        {continent}
                    </button>
                ))}
            </div>

            {/* Play/Pause Button */}
            <div style={{ marginTop: "20px", marginLeft: "20px" }}>
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    style={circularButtonStyle}
                >
                    {isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={iconStyle}>
                            <path d="M8 5v14l11-7z" fill="currentColor" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={iconStyle}>
                            <path d="M6 19h4V5H6v14zm8 0h4V5h-4v14z" fill="currentColor" />
                        </svg>
                    )}
                </button>
            </div>

            {/* SVG Chart */}
            <svg ref={svgRef} style={{ width: "100%", height: "500px" }}>
                <g className="x-axis" />
            </svg>
        </div>
    );
};

export default BarChartRace;

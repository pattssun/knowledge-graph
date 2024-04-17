import './KG.css';
import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export default function KG({ kg }) {
    const svgRef = useRef();

    useEffect(() => {
        if (kg) {
            // Construct nodes array ensuring unique IDs
            const nodeMap = new Map(); // Use a map to handle unique node IDs
            kg.forEach(([source, , target]) => {
                if (!nodeMap.has(source)) nodeMap.set(source, { id: source });
                if (!nodeMap.has(target)) nodeMap.set(target, { id: target });
            });
            const nodes = Array.from(nodeMap.values());

            // Construct links array
            const links = kg.map(([source, label, target]) => ({
                source: nodeMap.get(source).id,
                target: nodeMap.get(target).id,
                label
            }));

            nodes.forEach(node => node.degree = 0); // Initialize degree
            links.forEach(link => {
                nodeMap.get(link.source).degree++;
                nodeMap.get(link.target).degree++;
            });


            const svg = d3.select(svgRef.current),
                width = +svg.style("width").replace("px", ""),
                height = +svg.style("height").replace("px", "");

            svg.attr("style", "border: thin solid grey; border-radius: 5px;")

            const color = d3.scaleOrdinal(d3.schemeCategory10);

            const simulation = d3.forceSimulation(nodes)
                .force("link", d3.forceLink(links).id(d => d.id).distance(300))
                .force("charge", d3.forceManyBody())
                .force("x", d3.forceX(width / 2))
                .force("y", d3.forceY(height / 2));

            const g = svg.append("g");

            const link = g.append("g")
                .attr("stroke", "#999")
                .attr("stroke-opacity", 0.6)
                .selectAll("line")
                .data(links)
                .join("line")
                .attr("stroke-width", d => Math.sqrt(d.value));

            // Create text for the links
            const linkText = g.append("g")
                .attr("class", "link-text")
                .selectAll("text")
                .data(links)
                .join("text")
                .text(d => d.label)
                .attr("fill", "black")
                .attr("font-size", "12px")
                .attr("text-anchor", "middle");

            // Draw nodes as circles
            const node = g.append("g")
                .attr("class", "nodes")
                .selectAll("g")
                .data(nodes)
                .enter().append("g")
                .call(drag(simulation));

            node.append("circle")
                .attr("r", d => 30 + Math.sqrt((d.degree - 1)) * 30)  // Base radius + scaled by sqrt of degree
                .attr("fill", d => color(d.id));

            node.append("text")
                .text(d => d.id)
                .attr("x", 0)
                .attr("y", 3)
                .attr("text-anchor", "middle")
                .attr("fill", "black")
                .attr("font-size", "12px");

            // Update positions each tick of the simulation
            simulation.on("tick", () => {
                link.attr("x1", d => Math.max(40, Math.min(width - 40, d.source.x)))
                    .attr("y1", d => Math.max(40, Math.min(height - 40, d.source.y)))
                    .attr("x2", d => Math.max(40, Math.min(width - 40, d.target.x)))
                    .attr("y2", d => Math.max(40, Math.min(height - 40, d.target.y)));

                node.attr("transform", d => {
                    d.x = Math.max(40, Math.min(width - 40, d.x)); // Adjust 40 to the radius of the node
                    d.y = Math.max(40, Math.min(height - 40, d.y)); // Adjust 40 to the radius of the node
                    return `translate(${d.x}, ${d.y})`;
                });

                linkText.attr("x", d => (d.source.x + d.target.x) / 2)
                    .attr("y", d => (d.source.y + d.target.y) / 2);
            });
        }
    }, [kg]); // Include kg in the dependency array to update graph when kg changes

    function drag(simulation) {
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    return <svg className="kg-svg" ref={svgRef} width="100%" height="750px" style={{ border: 'thin solid lightgray', borderRadius: '5px'}}></svg>;
}
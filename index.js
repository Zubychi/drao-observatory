import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const data = await d3.csv("https://raw.githubusercontent.com/Zubychi/drao-observatory/master/resources/barvy.csv");

createHeatmap(
    data,
    "barva_oci",
    "rasa"
);

createHeatmap(
    data,
    "barva_oci",
    "pohlavi"
);

createHeatmap(
    data,
    "barva_vlasu",
    "rasa"
);

createHeatmap(
    data,
    "barva_vlasu",
    "pohlavi"
)

createBarplot(data, "rasa");
createBarplot(data, "barva_oci");
createBarplot(data, "barva_vlasu");

function createHeatmap(data, rowKey, columnKey) {

    // Spocitame pocet zaznamov pre kazdu kombinaciu
    const heatmapData = d3.rollups(
        data,
        v => v.length,
        d => d[rowKey],
        d => d[columnKey]
    );

    // Prevedieme vnoreny vysledok do plocheho pola
    const heatmapDataFlat = heatmapData.flatMap(
        ([row, columns]) =>
            columns.map(
                ([column, pocet]) => ({
                    row: row,
                    column: column,
                    pocet: pocet
                })
            )
    );


    // Nastavenie rozmerov grafu
    const margin = {
        top: 80,
        right: 25,
        bottom: 80,
        left: 80
    };

    const width = 450 - margin.left - margin.right;
    const height = 450 - margin.top - margin.bottom;


    // SVG
    const svg = d3.select("#my_dataviz")
        .select(".heatmaps")
        .append("svg")
        .attr("class", "heatmap")
        .attr(
            "width",
            "100%"
        )
        .attr(
            "height",
            height + margin.top + margin.bottom
        )
        .append("g")
        .attr(
            "transform",
            `translate(${margin.left},${margin.top})`
        );


    // Hodnoty v stlpcoch
    const columns = [
        ...new Set(
            heatmapDataFlat.map(d => d.column)
        )
    ].sort((a, b) => a.localeCompare(b, "cs"));;


    // Hodnoty v riadkoch
    const rows = [
        ...new Set(
            heatmapDataFlat.map(d => d.row)
        )
    ].sort((a, b) => a.localeCompare(b, "cs"));;


    // X scale
    const x = d3.scaleBand()
        .range([0, width])
        .domain(columns)
        .padding(0.05);


    // X axis
    svg.append("g")
        .style("font-size", 12)
        .attr(
            "transform",
            `translate(0,${height})`
        )
        .call(
            d3.axisBottom(x)
                .tickSize(0)
        )
        .select(".domain")
        .remove();


    // Y scale
    const y = d3.scaleBand()
        .range([0, height])
        .domain(rows)
        .padding(0.05);

    // Y axis
    svg.append("g")
        .style("font-size", 12)
        .call(
            d3.axisLeft(y)
                .tickSize(0)
        )
        .select(".domain")
        .remove();


    // Zistime maximalnu hodnotu
    const maxPocet = d3.max(
        heatmapDataFlat,
        d => d.pocet
    );


    // Color scale
    const myColor = d3.scaleSequential()
        .interpolator(d3.interpolateInferno)
        .domain([0, maxPocet]);


    // Tooltip
    const tooltip = d3.select("#my_dataviz")
        .select(".heatmaps")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("pointer-events", "none");


    // Mouseover
    const mouseover = function() {

        tooltip
            .style("opacity", 1);

        d3.select(this)
            .style("stroke", "black")
            .style("opacity", 1);
    };


    // Mousemove
    const mousemove = function(event, d) {

        tooltip
            .html(
                `<b>${columnKey}:</b> ${d.column}<br>
                <b>${rowKey}:</b> ${d.row}<br>
                <b>Počet:</b> ${d.pocet}`
            )
            .style(
                "left",
                `${event.pageX + 10}px`
            )
            .style(
                "top",
                `${event.pageY + 10}px`
            );
    };


    // Mouseleave
    const mouseleave = function() {

        tooltip
            .style("opacity", 0);

        d3.select(this)
            .style("stroke", "none")
            .style("opacity", 0.8);
    };


    // Bunky heatmapy
    const cells = svg.selectAll(".cell")
        .data(
            heatmapDataFlat,
            d => `${d.row}:${d.column}`
        )
        .enter()
        .append("g")
        .attr("class", "cell");


    // Pozadie bunky
    cells.append("rect")
        .attr("x", d => x(d.column))
        .attr("y", d => y(d.row))
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", d => myColor(d.pocet))
        .style("opacity", 0.8)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);


    // Text v bunke
    cells.append("text")
        .attr(
            "x",
            d => x(d.column) + x.bandwidth() / 2
        )
        .attr(
            "y",
            d => y(d.row) + y.bandwidth() / 2
        )
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr(
            "class",
            d => {
                const color = d3.color(
                    myColor(d.pocet)
                );

                const brightness =
                    (color.r * 299 +
                     color.g * 587 +
                     color.b * 114) / 1000;

                return brightness > 150
                    ? "cell-label dark"
                    : "cell-label light";
            }
        )
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .text(d => d.pocet);


    // Title
    svg.append("text")
        .attr("x", 0)
        .attr("y", -50)
        .attr("text-anchor", "left")
        .style("font-size", "22px")
        .text(`${columnKey} a ${rowKey}`);


    // Subtitle
    svg.append("text")
        .attr("x", 0)
        .attr("y", -20)
        .attr("text-anchor", "left")
        .style("font-size", "14px")
        .style("fill", "grey")
        .text(
            `Počet záznamov pre každú kombináciu ${columnKey} a ${rowKey}.`
        );
}


function countValues(data, key) {

    return d3.rollups(
        data,
        v => v.length,
        d => d[key]
    )
        .map(([value, count]) => ({
            value: value,
            count: count
        }))
        .sort((a, b) =>
            a.value.localeCompare(b.value, "sk")
        );
}

function createBarplot(data, key) {

    const result = countValues(data, key);


    // Nastavenie rozmerov grafu
    const margin = {
        top: 80,
        right: 25,
        bottom: 80,
        left: 80
    };

    const width = 450 - margin.left - margin.right;
    const height = 450 - margin.top - margin.bottom;


    // SVG
    const svg = d3.select("#my_dataviz")
        .select(".barplots")
        .append("svg")
        .attr("class", "barplot")
        .attr(
            "width",
            "100%"
        )
        .attr(
            "height",
            height + margin.top + margin.bottom
        )
        .append("g")
        .attr(
            "transform",
            `translate(${margin.left},${margin.top})`
        );


    // X scale
    const x = d3.scaleBand()
        .range([0, width])
        .domain(
            result.map(d => d.value)
        )
        .padding(0.05);


    // X axis
    svg.append("g")
        .style("font-size", 12)
        .attr(
            "transform",
            `translate(0,${height})`
        )
        .call(
            d3.axisBottom(x)
                .tickSize(0)
        )
        .selectAll("text")
        .attr(
            "transform",
            "rotate(-45)"
        )
        .style("text-anchor", "end")
        .attr(
            "dx",
            "-0.5em"
        )
        .attr(
            "dy",
            "0.15em"
        );


    // Y scale
    const maxCount = d3.max(
        result,
        d => d.count
    );

    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, maxCount]);


    // Y axis
    svg.append("g")
        .style("font-size", 12)
        .call(
            d3.axisLeft(y)
                .tickSize(0)
        )
        .select(".domain")
        .remove();

    // Bars
    const bars = svg.selectAll(".bar")
        .data(result)
        .enter()
        .append("g")
        .attr("class", "bar");


    bars.append("rect")
        .attr(
            "x",
            d => x(d.value)
        )
        .attr(
            "y",
            d => y(d.count)
        )
        .attr(
            "width",
            x.bandwidth()
        )
        .attr(
            "height",
            d => height - y(d.count)
        )
        .attr("rx", 4)
        .attr("ry", 4)
        .style(
            "fill",
            d => "#56413b"
        )
        .style("opacity", 0.8);


    // Text nad stlpcami
    bars.append("text")
        .attr(
            "x",
            d => x(d.value) + x.bandwidth() / 2
        )
        .attr(
            "y",
            d => y(d.count) - 5
        )
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(d => d.count);


    // Title
    svg.append("text")
        .attr("x", 0)
        .attr("y", -50)
        .attr("text-anchor", "left")
        .style("font-size", "22px")
        .text(key);


    // Description
    svg.append("text")
        .attr("x", 0)
        .attr("y", -20)
        .attr("text-anchor", "left")
        .style("font-size", "14px")
        .style("fill", "grey")
        .text(
            `Počet záznamov pre každú hodnotu pre kategóriu ${key}.`
        );
}

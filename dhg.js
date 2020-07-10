// a list of directional hypergraphs
var dhgs = [
    {name: "G1", sources: ["a","b"], targets: ["c","d"], projection:"p1"},
    {name: "G2", sources: ["e"], targets: ["f","g"], projection:"p2"},
    {name: "G3", sources: ["b", "d"], targets: ["f","a"], projection:"p2"}
];

var links = [];

// we convert the DHG list to a set of links
dhgs.forEach(function(dhg) {
    // three hidden nodes for projection placement
    inv1 = "inv1_" + dhg.name;
    inv2 = "inv2_" + dhg.name;
    inv3 = "inv3_" + dhg.name;
    links.push({source: inv1, target: inv2, type: "pointed"});
    links.push({source: inv2, target: inv3, type: "plain"});
    dhg.sources.forEach(function(src) {
	links.push({source: src, target: inv1, type: "plain"})});
    dhg.targets.forEach(function(target) {
	links.push({source: inv3, target: target, type: "plain"})});
});

var nodes = {};

links.forEach(function(link) {
    link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
    link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
    if(link.source.name.includes("inv") && !nodes[link.source.name].label)
	nodes[link.source.name].label = " ";
    // projection should have a visible label
    if(link.target.name.includes("inv2"))
	nodes[link.target.name].label =
	dhgs.filter(dhg => {return dhg.name === link.target.name.substring(5)})[0].projection;
});

var width = 960,
    height = 500;

var force = d3.layout.force()
    .nodes(d3.values(nodes))
    .links(links)
    .size([width, height])
    .on("tick", tick);
  
force.linkDistance(function(link) {
    return (link.source.name.includes("inv") && link.target.name.includes("inv")) ? 0 : 50;
});

force.charge(function(node) {
    return (node.name.includes("inv")) ? -200 : -300;
});

force.start();

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

// Per-type markers, as they don't inherit styles.
svg.append("defs").selectAll("marker")
    .data(["pointed"]) // arrows only on projections
  .enter().append("marker")
    .attr("id", function(d) { return d; })
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 15)
    .attr("refY", -1.5)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
  .append("path")
    .attr("d", "M0,-5L10,0L0,5");

var path = svg.append("g").selectAll("path")
    .data(force.links())
  .enter().append("path")
    .attr("class", function(d) { return "link " + d.type; })
    .attr("marker-end", function(d) { return "url(#" + d.type + ")"; });
  
var circle = svg.append("g").selectAll("circle")
    .data(force.nodes().filter(n => { return !n.name.includes("inv")}))
  .enter().append("circle")
    .attr("r", 4)
    .call(force.drag);

var text = svg.append("g").selectAll("text")
    .data(force.nodes())
  .enter().append("text")
    .attr("x", 8)
    .attr("y", ".31em")
    .text(function(d) { return d.label ? d.label : d.name; }); // a label overrides name

// Use elliptical arc path segments to doubly-encode directionality.
function tick() {
  path.attr("d", linkArc);
  circle.attr("transform", transform);
  text.attr("transform", transform);
}

function linkArc(d) {
  var dx = d.target.x - d.source.x,
      dy = d.target.y - d.source.y,
      dr = Math.sqrt(dx * dx + dy * dy) * 4;
  return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
}

function transform(d) {
  return "translate(" + d.x + "," + d.y + ")";
}

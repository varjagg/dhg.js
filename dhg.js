// a list of directional hypergraph edges
var dhgs = new Map();

dhgs.set("G1", [
    {name: "e1", sources: ["a","b"], targets: ["c","d"], projection:"p1"},
    {name: "e2", sources: ["e"], targets: ["f","g"], projection:"p2"},
    {name: "e3", sources: ["b", "d"], targets: ["f","a"], projection:"p2"},
]);
dhgs.set("G2", [
    {name: "e4", sources: ["1"], targets: ["2","3"], projection:"top-of"},
    {name: "e5", sources: ["2", "3"], targets: ["4"], projection:"top-of"},
    {name: "e6", sources: ["4"], targets: ["5","6"], projection:"top-of"},
    {name: "e7", sources: ["5", "6"], targets: ["7"], projection:"top-of"},
    {name: "e8", sources: ["2"], targets: ["1", "4"], projection:"right-of"},
    {name: "e9", sources: ["1", "4"], targets: ["3"], projection:"right-of"},
    {name: "e10", sources: ["5"], targets: ["7", "4"], projection:"right-of"},
    {name: "e11", sources: ["7", "4"], targets: ["6"], projection:"right-of"},
]);

var links = [];

// we convert the DHG list to a set of links
dhgs.forEach(function(edges, name) {
    edges.forEach(function(edge) {
	// three hidden nodes for projection placement
	inv1 = "inv1_" + edge.name;
	inv2 = "inv2_" + edge.name;
	inv3 = "inv3_" + edge.name;
	links.push({source: inv1, target: inv2, type: "pointed", dhg: name});
	links.push({source: inv2, target: inv3, type: "plain", dhg: name});
	edge.sources.forEach(function(src) {
	    links.push({source: src, target: inv1, type: "plain", dhg: name})});
	edge.targets.forEach(function(target) {
	    links.push({source: inv3, target: target, type: "plain", dhg: name})});
    });
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
	dhgs.get(link.dhg).filter(dhg => {return dhg.name === link.target.name.substring(5)})[0].projection;
});

var width = window.innerWidth,
    height = window.innerHeight;

var force = d3.layout.force()
    .nodes(d3.values(nodes))
    .links(links)
    .chargeDistance(300)
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
    .attr("refX", 10)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
  .append("path")
    .attr("d", "M0,-5L10,0L0,5");

function stringToColor(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  var color = '#';
  for (var i = 0; i < 3; i++) {
    var value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
}

var path = svg.append("g").selectAll("path")
    .data(force.links())
    .enter().append("path")
    .style("stroke", function(d) { return stringToColor(d.source.name); })
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

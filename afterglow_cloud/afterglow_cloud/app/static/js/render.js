var afterglow = {};
var RecaptchaOptions = {
    theme: 'white'
};

/**
 *
 * Facade to allow D3 consume GraphSON input
 *
 */


d3.graphson = {};

d3.graphson.facade = function (graphsonEdges, graphsonVertices) {

    var indexMap = {};

    for (var i = 0; i < graphsonVertices.length; i++) {
        var graphsonVertex = graphsonVertices[i];
        indexMap[graphsonVertex._id] = i;


        graphsonVertex['weight'] = 1.
    }

    for (var i = 0; i < graphsonEdges.length; i++) {
        var graphsonEdge = graphsonEdges[i];

        graphsonEdge.source = indexMap[graphsonEdge._out];
        graphsonEdge.target = indexMap[graphsonEdge._in];
    }

    return {"vertices": graphsonVertices, "edges": graphsonEdges};
};

function render(heliosPath, graphsonPath, svgId) {

    var g = new Helios.GraphDatabase({'heliosDBPath': heliosPath,
        'vertices': {}, 'edges': {}, 'v_idx': {}, 'e_idx': {}});


    g.loadGraphSON(graphsonPath);

    var width = 960, height = 500;
    var svg = d3.select(svgId)
        .attr('width', width)
        .attr('height', height);

    var grp = svg.append('g')
        .attr('id', 'viewport');


    g.E().then(); // Don't know why, but without first call it will be always empty
    var graphStats = afterglow.metrics(g, function (stats) {


        g.E().then(function (edges) {
            g.V().then(function (vertices) {
                var graph = d3.graphson.facade(edges, vertices);
                console.log(graph);
                console.log(edges);
                console.log(vertices);
                force
                    .nodes(graph.vertices)
                    .links(graph.edges)
                    .gravity(.05)
                    .distance(100)
                    .charge(-100)
                    .size([width, height])
                    .start();


                var link = grp.selectAll(".link")
                    .data(graph.edges)
                    .enter().append("line")
                    .attr("style", "stroke:rgb(255,0,0);stroke-width:2")
                    .attr("class", "link");

                var node = grp.selectAll(".node")
                    .data(graph.vertices)
                    .enter().append("g")
                    .attr("class", "node")
                    .call(force.drag);


                node.append("text")
                    .attr("dx", 12)
                    .attr("dy", ".35em")
                    .text(function (d) {
                        return d._label;
                    });


                node.append("circle")
                    .attr("class", "node")
                    .attr("r", function (d) {
                        console.log(d._id);
                        return 3 + stats[d._id].totalConnectivity * 0.3;
                    });
//                .call(force.drag);


                force.on("tick", function () {
                    link.attr("x1", function (d) {
                        return d.source.x;
                    })
                        .attr("y1", function (d) {
                            return d.source.y;
                        })
                        .attr("x2", function (d) {
                            return d.target.x;
                        })
                        .attr("y2", function (d) {
                            return d.target.y;
                        });

                    node.attr("cx", function (d) {
                        return d.x;
                    })
                        .attr("cy", function (d) {
                            return d.y;
                        });

                    node.attr("transform", function (d) {
                        return "translate(" + d.x + "," + d.y + ")";
                    });
                });
            });
        });


        var color = d3.scale.category20();

        var force = d3.layout.force()
            .charge(-120)
            .linkDistance(30)
            .size([width, height]);

        console.log(stats);
    });
}


$(function () {
    $('#renderViewport').svgPan('viewport');

    $("#zoomin").click(function () {
        return false;
    });

    $("#zoomout").click(function () {
        return false;
    });

    $("#reset").click(function () {
        return false;
    });
});
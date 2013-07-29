var RecaptchaOptions = {
    theme : 'white'
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

    return {"vertices" : graphsonVertices, "edges" : graphsonEdges};
};

function render(heliosPath, graphsonPath, svgId){

    var g = new Helios.GraphDatabase({'heliosDBPath' : heliosPath,
        'vertices' : {}, 'edges' : {}, 'v_idx' : {}, 'e_idx' : {}});


    g.loadGraphSON(graphsonPath);

    var width = 960, height = 500;
    var svg = d3.select(svgId)
        .attr('width', width)
        .attr('height', height);


    g.E().then(); // Don't know why, but without first call it will be always empty

    g.E().then(function(edges){
        g.V().then(function(vertices){
            var graph = d3.graphson.facade(edges, vertices);
            console.log(graph);
            force
                .nodes(graph.vertices)
                .links(graph.edges)
                .start();


            var link = svg.selectAll(".link")
                .data(graph.edges)
                .enter().append("line")
                .attr("style", "stroke:rgb(255,0,0);stroke-width:2")
                .attr("class", "link");

            var node = svg.selectAll(".node")
                .data(graph.vertices)
                .enter().append("circle")
                .attr("class", "node")
                .attr("r", 5)
                .call(force.drag);

            node.append("title")
                .text(function(d) { return d._label; });

            node.append("text")
                .attr("dx", 12)
                .attr("dy", ".35em")
                .text(function(d) { return d._label; });

            force.on("tick", function() {
                link.attr("x1", function(d) { return d.source.x; })
                    .attr("y1", function(d) { return d.source.y; })
                    .attr("x2", function(d) { return d.target.x; })
                    .attr("y2", function(d) { return d.target.y; });

                node.attr("cx", function(d) { return d.x; })
                    .attr("cy", function(d) { return d.y; });
            });
        });
    });




    var color = d3.scale.category20();

    var force = d3.layout.force()
        .charge(-120)
        .linkDistance(30)
        .size([width, height]);
};
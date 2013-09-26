afterglow.rendering = {

    /**
     * Creates facade for D3 force layout
     * @param graphsonEdges array with edges
     * @param graphsonVertices array with vertices
     * @returns {{vertices: *, edges: *}} array of vertices and edges that can be consumed by the D3
     */
    facade: function (graphsonEdges, graphsonVertices) {

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
    },

    /**
     * Renders graph
     * @param edges edges
     * @param vertices vertices
     * @param node_stats node stats
     * @param svgId svg id
     */
    render: function (edges, vertices, node_stats, svgId, display_labels) {


        var width = 960, height = 500;
        var svg = d3.select(svgId)
            .attr('width', width)
            .attr('height', height);

        var grp = svg.append('g')
            .attr('id', 'viewport');


        var graph = afterglow.rendering.facade(edges, vertices);
        console.log(graph);
        console.log(edges);
        console.log(vertices);
        var force = d3.layout.force()
            .nodes(graph.vertices)
            .links(graph.edges)
            .gravity(0.1)
            .distance(100)
            .charge(-100)
            .linkStrength(0.1)
            .size([width, height])
            .start();


        $('#attractionSlider').slider().on('slide', function(ev){
            force.linkStrength(1.0  / ev.value);
            force.start();
        });
        $('#chargeSlider').slider().on('slide', function(ev){
            force.charge(ev.value);
            force.start();
        });
        $('#gravitySlider').slider().on('slide', function(ev){
            force.gravity(1.0 / ev.value);
            force.start();
        });



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
            .attr("class", "nodeLabel")
            .text(function (d) {
                var labelText =  d._label;
                console.log(d.occurences);
                if (d.occurrences != undefined){
                    labelText = labelText +  '(' + d.occurrences + ')';
                }
                return labelText;
            });
       


       var nodeCircle = node.append("circle")
            .attr("class", "nodeFigure")
            .attr("r", function (d) {
                return 5 + node_stats[d._id].totalConnectivity * 0.3;
            })
            .attr("fill", function(d) {
                console.log('rgb(' + d.color.slice(1,-1) + ')');
                return 'rgb(' + d.color.slice(1,-1) + ')';
            });


       $('#nodeSizeInherit').change(function(){
            nodeCircle.attr('r', function (d) {
                return 2 + d.size;
            });
        });


       $('#nodeSizeBetweenness').change(function(){
            nodeCircle.attr('r', function (d) {
                return 5 + node_stats[d._id].betweenness*0.5;
            });
        });

        $('#nodeSizeAverageConnectivity').change(function(){
            nodeCircle.attr('r', function (d) {
                return 5 + node_stats[d._id].totalConnectivity * 0.3;
            });
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


            var color = d3.scale.category20();


        });
    },

    "chargeValue" : -120,
    getChargeValue : function () {
        return afterglow.rendering.chargeValue;
    },

    init: function (heliosPath, graphsonPath, svgId) {

        var g = new Helios.GraphDatabase({'heliosDBPath': heliosPath,
            'vertices': {}, 'edges': {}, 'v_idx': {}, 'e_idx': {}});

        g.loadGraphSON(graphsonPath, function () {
            var graphStats = afterglow.metrics.nodes(g, function (node_stats) {
                g.E().then(function (edges) {
                    g.V().then(function (vertices) {
                        afterglow.rendering.render(edges, vertices, node_stats, svgId, true);
                        $(svgId).svgPan('viewport');

                        $('#nodeLabels').change(function(){
                                var opacity = $(this).is(':checked') ? '100' : '0';
                                d3.selectAll('.nodeLabel')
                                    .attr('opacity', opacity);
                        });

                        $('#panAndZoom').change(function(){
                                var panZoom = $(this).is(':checked');
                                if (panZoom){
                                    $(svgId).svgPan('viewport', true, true);
                                } else {
                                    $(svgId).off('mouseup')
                                            .off('mousedown')
                                            .off('mouseenter')
                                            .off('mouseleave');
                                }
                        });

                        $('.node').mouseover(function(){
                            $(this).find('.nodeLabel').attr('opacity', '100');
                        });

                        $('.node').mouseleave(function(){
                            var opacity = $(this).is(':checked') ? '100' : '0';
                            $(this).find('.nodeLabel').attr('opacity', opacity);
                        });

                        $('#resetViewport').click(function(){
                            $(svgId).empty();
                            afterglow.rendering.render(edges, vertices, node_stats, svgId, true);
                            $(svgId).svgPan('viewport', true, true);
                        });
                    });
                });

            });
        });




    }

}
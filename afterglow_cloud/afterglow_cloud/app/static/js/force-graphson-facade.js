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
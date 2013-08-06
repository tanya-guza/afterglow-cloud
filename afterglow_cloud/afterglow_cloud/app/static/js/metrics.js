afterglow.metrics = {};


afterglow.metrics.betweenness = function (g, callback/*sourceId, targetId, directedSearch, searchType*/) {
    var stats = {};
    var aggregatedCosts = {};

    g.E().then(function (links) {
        g.V().then(function (nodes) {

            // Reset betweenness
            for (var i = 0; i < nodes.length; i++) {
                stats[nodes[i]._id] = {};
                stats[nodes[i]._id].Betweenness = 0;

                aggregatedCosts[nodes[i]._id] = {};
                for (var j = 0; j < nodes.length; j++) {
                    aggregatedCosts[nodes[i]._id][nodes[j]._id] = +Infinity;
                }
            }


            var aggregatedSourceIndex = 0;

            while (aggregatedSourceIndex < nodes.length) {
                var aggregatedTargetIndex = 0;
                var visitedVertices = [];
                vertexCost = {};
                sourceId = nodes[aggregatedSourceIndex]._id;

                for (var i = 0; i < nodes.length; i++) {
                    vertexCost[nodes[i]._id] = +Infinity;
                }

                vertexCost[sourceId] = 0;
                calculatedVertices = [sourceId];
                parentVertex = {};
                var pathFound = false;
                var minimumValue = 9999;
                var sourceValue = "";
                var targetValue = "";

                var linkId = 0;
                linkList = {};

                while (aggregatedTargetIndex < nodes.length) {
                    targetId = nodes[aggregatedTargetIndex]._id;

                    while (pathFound == false) {
                        minimumValue = 9999;
                        sourceValue = "";
                        targetValue = "";
                        linkId = 0;

                        for (var z = 0; z < links.length; z++) {

                            links[z].cost = "1.0"; // Let it be constant for now

                            var otherVertex = "none";
                            var startVertex = "none";
                            //find the next edge to check and make sure it's the lowest value
                            if (calculatedVertices.indexOf(links[z]._out) > -1 && calculatedVertices.indexOf(links[z]._in) == -1) {
                                startVertex = links[z]._out;
                                otherVertex = links[z]._in;
                            }
                            //undirected search looks at target->source as well
                            else if (calculatedVertices.indexOf(links[z]._in) > -1 && calculatedVertices.indexOf(links[z]._out) == -1) {
                                startVertex = links[z]._in;
                                otherVertex = links[z]._out;
                            }
                            if (otherVertex != "none") {
                                if ((parseFloat(links[z].cost) + vertexCost[startVertex]) < minimumValue) {
                                    minimumValue = (parseFloat(links[z].cost) + vertexCost[startVertex]);
                                    sourceValue = startVertex;
                                    targetValue = otherVertex;
                                    linkId = z;
                                }
                            }
                        }

                        // if the minimum value is still 9999, then that means no paths were discovered, and there is no path
                        if (minimumValue == 9999) {
//                vertexCost[targetId] = +Infinity;
                            calculatedVertices.push(targetId);
                            pathFound = true;
                        }
                        else {
                            vertexCost[targetValue] = minimumValue;
                            parentVertex[targetValue] = sourceValue;
                            calculatedVertices.push(targetValue);

                            //For a multidimensional object, you have to check and add new objects on-the-fly
                            if (!linkList[sourceValue]) {
                                linkList[sourceValue] = {};
                            }
                            linkList[sourceValue][targetValue] = linkId;

                            if (targetValue == targetId) {
                                pathFound = true;
                            }
                        }

                    }


                var computedPathArray = [];
                computedEdgeArray = [];
                // this is causing a strange error, so if the type is aggregate, just skip it
                if (minimumValue != 9999 && parentVertex[targetId]) {

                    var reversePath = targetId;
                    computedPathArray = [];
                    while (reversePath != sourceId) {
                        computedPathArray.push(reversePath);
                        computedEdgeArray.push(linkList[parentVertex[reversePath]][reversePath]);
                        reversePath = parentVertex[reversePath];
                        stats[reversePath]["Betweenness"] += 1;
                    }
                    //we shouldn't increase the source or target value for any paths, so decrement the sourceId betweenness
                    stats[sourceId]["Betweenness"] -= 1;
                    computedPathArray.push(sourceId);
                    computedEdgeArray.push(linkList[sourceId][parentVertex[reversePath]]);

                }


                aggregatedTargetIndex++;
                var alreadyComputed = true;
                if (aggregatedTargetIndex < nodes.length) {

                    while (alreadyComputed == true && (nodes[aggregatedTargetIndex])) {

                        //find out if we've already computed the new target as part of an earlier path
                        if (calculatedVertices.indexOf(nodes[aggregatedTargetIndex]._id) > -1) {
                            aggregatedTargetIndex++;
                        }
                        else {
                            alreadyComputed = false;
                        }
                    }

                }
            }

            var sumOfConnectedNodes = 0;
            var totalOfConnectedDistance = 0;
            for (x in vertexCost) {
                if (vertexCost[x]) {
                    if (vertexCost[x] != +Infinity) {
                        sumOfConnectedNodes++;
                        totalOfConnectedDistance += vertexCost[x];
                    }
                }
            }

            stats[sourceId]["Total Connectivity"] = sumOfConnectedNodes;
            if (sumOfConnectedNodes == 0) {
                stats[sourceId]["Average Path Length"] = 0;
            }
            else {
                stats[sourceId]["Average Path Length"] = totalOfConnectedDistance / sumOfConnectedNodes;
            }

            aggregatedSourceIndex++;

        }

        callback(stats);
    });
}
)
;


return stats;


//        while ((searchType == "individual" && pathFound != true) || (searchType != "individual" && aggregatedTargetIndex < nodes.length)) {
//
////set the targetId to the current aggregate target node in the loop, if running the aggregate search
//            if (searchType == "aggregate") {
//
//            }
//
//            while (pathFound == false) {
//                minimumValue = 9999;
//                sourceValue = "";
//                targetValue = "";
//                linkId = 0;
//
//                for (z in links) {
//                    var otherVertex = "none";
//                    var startVertex = "none";
//                    //find the next edge to check and make sure it's the lowest value
//                    if (calculatedVertices.indexOf(links[z]._out) > -1 && calculatedVertices.indexOf(links[z]._in) == -1) {
//                        startVertex = links[z]._out;
//                        otherVertex = links[z]._in;
//                    }
//                    //undirected search looks at target->source as well
//                    else if (directedSearch == false && calculatedVertices.indexOf(links[z]._in) > -1 && calculatedVertices.indexOf(links[z]._out) == -1) {
//                        startVertex = links[z]._in;
//                        otherVertex = links[z]._out;
//                    }
//                    if (otherVertex != "none") {
//                        if ((parseFloat(links[z].cost) + vertexCost[startVertex]) < minimumValue) {
//                            minimumValue = (parseFloat(links[z].cost) + vertexCost[startVertex]);
//                            sourceValue = startVertex;
//                            targetValue = otherVertex;
//                            linkId = z;
//                        }
//                    }
//                }
//
//                // if the minimum value is still 9999, then that means no paths were discovered, and there is no path
//                if (minimumValue == 9999) {
////                vertexCost[targetId] = +Infinity;
//                    calculatedVertices.push(targetId);
//                    pathFound = true;
//                }
//                else {
//                    vertexCost[targetValue] = minimumValue;
//                    parentVertex[targetValue] = sourceValue;
//                    calculatedVertices.push(targetValue);
//
//                    //For a multidimensional object, you have to check and add new objects on-the-fly
//                    if (!linkList[sourceValue]) {
//                        linkList[sourceValue] = {};
//                    }
//                    linkList[sourceValue][targetValue] = linkId;
//
//                    if (targetValue == targetId) {
//                        pathFound = true;
//                    }
//                }
//
//            }
//
//            var computedPathArray = [];
//            computedEdgeArray = [];
//            // this is causing a strange error, so if the type is aggregate, just skip it
//            if (minimumValue != 9999 && parentVertex[targetId]) {
//
//                var reversePath = targetId;
//                computedPathArray = [];
//                while (reversePath != sourceId) {
//                    computedPathArray.push(reversePath);
//                    computedEdgeArray.push(linkList[parentVertex[reversePath]][reversePath]);
//                    reversePath = parentVertex[reversePath];
//                    stats[reversePath]["Betweenness"] += 1;
//                }
//                //we shouldn't increase the source or target value for any paths, so decrement the sourceId betweenness
//                stats[sourceId]["Betweenness"] -= 1;
//                computedPathArray.push(sourceId);
//                computedEdgeArray.push(linkList[sourceId][parentVertex[reversePath]]);
//
//            }
//            else if (searchType == "individual") {
//                computedPathArray = ["Path not found"];
//                computedEdgeArray = ["Path not found"];
//            }
//
//
//            aggregatedTargetIndex++;
//            var alreadyComputed = true;
//            if (aggregatedTargetIndex < nodes.length) {
//
//                while (alreadyComputed == true && (nodes[aggregatedTargetIndex])) {
//
//                    //find out if we've already computed the new target as part of an earlier path
//                    if (calculatedVertices.indexOf(nodes[aggregatedTargetIndex]._id) > -1) {
//                        aggregatedTargetIndex++;
//                    }
//                    else {
//                        alreadyComputed = false;
//                    }
//                }
//
//            }
//
//        }
//        var sumOfConnectedNodes = 0;
//        var totalOfConnectedDistance = 0;
//        for (x in vertexCost) {
//            if (vertexCost[x]) {
//                if (vertexCost[x] != +Infinity) {
//                    sumOfConnectedNodes++;
//                    totalOfConnectedDistance += vertexCost[x];
//                }
//            }
//        }
//
//        stats[sourceId]["Total Connectivity"] = sumOfConnectedNodes;
//        if (sumOfConnectedNodes == 0) {
//            stats[sourceId]["Average Path Length"] = 0;
//        }
//        else {
//            stats[sourceId]["Average Path Length"] = totalOfConnectedDistance / sumOfConnectedNodes;
//        }
//
//        aggregatedSourceIndex++;
//    }
//    if (searchType == "individual") {
//        return {nodes: computedPathArray, paths: computedEdgeArray};
//    }
//    else {
//        return stats;
//    }
}
;
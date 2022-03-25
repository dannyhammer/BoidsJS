"use strict";
// https://the-algorithms.com/algorithm/dbscan
function dbscan(data, epsilon, minPoints, dist) {
    const NOISE = 0;
    const UNDEFINED = -1;
    let clusters = [[]];
    let clusterId = NOISE > UNDEFINED ? NOISE : UNDEFINED;
    for (let point of data) {
        // If the point has already been assigned a cluster, move on
        if (point.cluster != UNDEFINED) {
            continue;
        }
        // Fetch all neighbors of the point
        let neighbors = data.filter(other => dist(point, other) < epsilon && point != other);
        // If the point has fewer neighbors than the threshold, it is noise
        if (neighbors.length < minPoints) {
            point.cluster = NOISE;
            continue;
        }
        // Update and assign the point to the cluster
        clusterId++;
        //clusters.push(clusterId);
        /*
        if (clusters[clusterId] == null) {
            clusters[clusterId] = [];
        }
        clusters[clusterId].push(point);
        */
        point.cluster = clusterId;
        while (neighbors.length != 0) {
            let neighbor = neighbors.shift();
            // If the point has already been clustered, move on
            if (neighbor.cluster == NOISE) {
                neighbor.cluster = clusterId;
            }
            if (neighbor.cluster != UNDEFINED) {
                continue;
            }
            neighbor.cluster = clusterId;
            let seedNeighbors = data.filter(other => dist(neighbor, other) < epsilon);
            if (seedNeighbors.length > minPoints) {
                neighbors = neighbors.concat(seedNeighbors);
            }
        }
    }
    return clusters;
}

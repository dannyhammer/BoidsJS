// https://the-algorithms.com/algorithm/dbscan

function dbscan(data: Array<any>, epsilon: number, minPoints: number, dist: Function): Array<any> {
    const NOISE = -1;
    const UNDEFINED = 0;

    let clusters: Array<any> = [];
    let clusterId = UNDEFINED;

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
        clusters.push(clusterId);
        point.cluster = clusterId;

        // Clone the neighbors to create a seed set
        //let seedSet: Array<any> = [];
        //neighbors.forEach(point => seedSet.push(Object.assign({}, point)));

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

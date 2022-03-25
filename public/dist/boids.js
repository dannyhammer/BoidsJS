"use strict";
const RGB = function () { return Math.floor(Math.random() * 256); };
const randInt = function (min, max) { return Math.round(Math.random() * (max - min)) + min; };
const mod = function (num, modulus) { return ((num % modulus) + modulus) % modulus; };
function simulate(canvas, ctx) {
    console.log("Begin simulation");
    let animationFrame = null;
    let boids = generateBoids(INITIAL_NUM);
    let clusters = [boids];
    let newClusters = [[]];
    let clusterId = NOISE;
    const cycle = () => {
        //console.log("NEW CYCLE")
        clusterId = NOISE; // Initial cluster is noise
        newClusters = [[]];
        // Clear the screen
        ctx.clearRect(0, 0, windowWidth, windowHeight);
        boids.forEach(boid => boid.cluster = UNDEFINED);
        //console.log(boids[0])
        //for (let boid of boids) {
        for (let cluster of clusters) {
            for (let boid of cluster) {
                //console.log(boid.id, boid.cluster)
                clusterId = assignClusters(boid, boids, fovDist, MIN_CLUSTER_SIZE, clusterId);
                // Calculate the new velocity of the boid
                let newVel = calculateBoidVelocity(boid, boids);
                boid.dx += newVel.dx;
                boid.dy += newVel.dy;
                // Update position and render
                updateBoid(boid);
                render(ctx, boid);
                if (newClusters[boid.cluster] == null) {
                    newClusters[boid.cluster] = [];
                }
                newClusters[boid.cluster].push(boid);
            }
        }
        clusters = newClusters;
        animationFrame = window.requestAnimationFrame(cycle);
    };
    canvas.addEventListener('mouseover', function (e) {
        // Only start the animation if it hasn't yet been started
        if (animationFrame == null) {
            animationFrame = window.requestAnimationFrame(cycle);
        }
    });
    canvas.addEventListener('mouseout', function (e) {
        // Uncomment this line to pause simulation when not in focus
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
    });
    canvas.addEventListener("mousemove", function (e) {
        // Set the focal point to the mouse's position
        //focalPoint = { x: e.offsetX, y: e.offsetY};
    });
    canvas.addEventListener("mousedown", function (e) {
        // OffsetX/Y is the point on the canvas clicked. X/Y is the actual screen coordinates
        //spawnBoid(e.offsetX, e.offsetY);
    });
}
function assignClusters(boid, boids, minDist, minPoints, clusterId) {
    // If the boid has already been assigned a cluster, move on
    if (boid.cluster != UNDEFINED) {
        return clusterId;
    }
    // Fetch all neighbors of the point
    let neighbors = boids.filter(other => boidDist(boid, other) < minDist && boid != other);
    // If the point has fewer neighbors than the threshold, it is noise
    if (neighbors.length < minPoints) {
        boid.cluster = NOISE;
        return clusterId;
    }
    // Update and assign the point to the cluster
    clusterId++;
    boid.cluster = clusterId;
    // Now loop over the remaining neighbors to expand the cluster
    while (neighbors.length != 0) {
        let neighbor = neighbors.shift();
        // If the point has already been clustered, move on
        if (neighbor.cluster == NOISE) {
            neighbor.cluster = clusterId;
        }
        if (neighbor.cluster != UNDEFINED) {
            continue;
        }
        // Otherwise, the neighbor is undefined and will join this cluster
        neighbor.cluster = clusterId;
        // Fetch all of this point's neighbors
        let seedNeighbors = boids.filter(other => boidDist(neighbor, other) < minDist);
        // If this point has a significant number of neighhbors,
        // add its neighbors to the list to process
        if (seedNeighbors.length > minPoints) {
            neighbors = neighbors.concat(seedNeighbors);
        }
    }
    return clusterId;
}
function generateBoids(num) {
    let boids = [];
    for (let i = 0; i < num; i++) {
        boids.push({
            id: i,
            x: randInt(50, windowWidth - 50),
            y: randInt(50, windowHeight - 50),
            dx: randInt(-1, 1),
            dy: randInt(-1, 1),
            length: defaultLength,
            width: defaultWidth,
            angle: 0,
            //color: [RGB(), RGB(), RGB()],
            color: [250, 250, 250],
            minSpeed: defaultMinSpeed,
            maxSpeed: defaultMaxSpeed,
            cluster: UNDEFINED,
        });
    }
    return boids;
}
function calculateBoidVelocity(boid, boids) {
    let newVel = { dx: 0, dy: 0 };
    let separation = { dx: 0, dy: 0 };
    let cohesion = { dx: 0, dy: 0 };
    let alignment = { dx: 0, dy: 0 };
    let focus = { dx: 0, dy: 0 };
    let numVisible = 0;
    let numTooClose = 0;
    // Iterate over every other boid in the same cluster
    //for (let other of clusters[boid.cluster]) {
    for (let other of boids) {
        if (boid !== other) {
            // Separation occurs when the other boid is too close
            if (boidDist(boid, other) < personalSpace) {
                separation.dx += boid.x - other.x;
                separation.dy += boid.y - other.y;
                numTooClose += 1;
            }
            // Cohesion and alignment occur to boids within sight
            if (boidDist(boid, other) < fovDist) {
                cohesion.dx += other.x;
                cohesion.dy += other.y;
                alignment.dx += other.dx;
                alignment.dy += other.dy;
                numVisible += 1;
            }
        }
    }
    // Compute the separation value
    if (numTooClose > 0) {
        separation.dx /= numTooClose;
        separation.dy /= numTooClose;
    }
    // Compute alignment and cohesion values
    if (numVisible > 0) {
        // Only modify if at least one neighbor was found
        alignment.dx = alignment.dx / numVisible - boid.dx;
        alignment.dy = alignment.dy / numVisible - boid.dy;
        cohesion.dx = cohesion.dx / numVisible - boid.x;
        cohesion.dy = cohesion.dy / numVisible - boid.y;
    }
    // Attract/repel from focal point
    if (focalPoint != null) {
        //focus = sub(this.focalPoint, boid.pos); // Attract boids
        //focus = sub(boid.pos, this.focalPoint); // Repel boids
    }
    // Add all of the factors together
    newVel.dx += (separation.dx * separationStr)
        + (cohesion.dx * cohesionStr)
        + (alignment.dx * alignmentStr);
    newVel.dy += (separation.dy * separationStr)
        + (cohesion.dy * cohesionStr)
        + (alignment.dy * alignmentStr);
    return newVel;
}
function render(ctx, boid) {
    // Align the canvas with the Boid
    ctx.translate(boid.x, boid.y);
    ctx.rotate(boid.angle);
    ctx.translate(-boid.x, -boid.y);
    // Begin drawing the Boid (shape + outline)
    ctx.beginPath();
    ctx.moveTo(boid.x, boid.y);
    ctx.lineTo(boid.x - boid.length, boid.y + boid.width);
    ctx.lineTo(boid.x - boid.length, boid.y - boid.width);
    ctx.lineTo(boid.x, boid.y);
    ctx.stroke(); // Draw the black outline
    ctx.fillStyle = "rgba(" + boid.color + ", " + 0.75 + ")"; // Set the fill color
    ctx.fill();
    ctx.resetTransform();
}
function updateBoid(boid) {
    limitSpeed(boid);
    avoidWalls(boid);
    // Update the Boid's color based on its cluster. Unclustered boids are white
    boid.color = boid.cluster > 0 ? COLORS[boid.cluster - 1] : [250, 250, 250];
    // Update position from velocity
    // % can return negative numbers by default, so account for that
    boid.x = mod(boid.x + boid.dx, windowWidth);
    boid.y = mod(boid.y + boid.dy, windowHeight);
    // Determine the Boid's angle based on its velocity
    boid.angle = Math.atan2(boid.dy, boid.dx);
}
function boidDist(boid, other) {
    return Math.sqrt((boid.x - other.x) ** 2 + (boid.y - other.y) ** 2);
}
function limitSpeed(boid) {
    // Fetch the speed of the boid (magnitude of the velocity vector)
    let speed = Math.sqrt(boid.dx ** 2 + boid.dy ** 2);
    // Clamp the speed between min and max
    if (speed > boid.maxSpeed) {
        boid.dx = (boid.dx / speed) * boid.minSpeed;
        boid.dy = (boid.dy / speed) * boid.minSpeed;
    }
    else if (speed < boid.minSpeed) {
        boid.dx = (boid.dx / speed) * boid.maxSpeed;
        boid.dy = (boid.dy / speed) * boid.maxSpeed;
    }
}
function avoidWalls(boid) {
    // If the position is too close to the margin, steer away
    if (boid.x < fovDist) {
        //boid.dy += steerStr; // Steer the boid
        boid.dx += steerStr; // Slow the boid
    }
    else if (boid.x > windowWidth - fovDist) {
        //boid.dy -= steerStr; // Steer
        boid.dx -= steerStr; // Slow
    }
    if (boid.y < fovDist) {
        //boid.dx -= steerStr; // Steer
        boid.dy += steerStr; // Slow
    }
    else if (boid.y > windowHeight - fovDist) {
        //boid.dx += steerStr; // Steer
        boid.dy -= steerStr; // Slow
    }
}

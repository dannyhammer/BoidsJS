type Boid = {
    id: number,
    x: number,
    y: number,
    dx: number,
    dy: number,
    length: number,
    width: number,
    angle: number,
    color: Array<number>,
    minSpeed: number,
    maxSpeed: number,
    cluster: number,
};
type Position = { x: number, y: number};
type Velocity = { dx: number, dy: number};

const RGB = () => {
    const num = Math.round(0xffffff * Math.random());
    return [num >> 16, num >> 8 & 255, num & 255];
};
//const RGB = function () { return Math.floor(Math.random() * 256); };
const randInt = function(min: number, max: number) { return Math.round(Math.random() * (max - min)) + min; };
const mod = function(num: number, modulus: number) { return ((num % modulus) + modulus) % modulus; };
// Normalizes a value to between 0 and 1
const normalize = (min: number, max: number, value: number) => { return (value - min) / (max - min)}
const triangle = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x1, y1);
    ctx.stroke();
}
const circle = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, true)
    ctx.stroke();
}


function simulate(canvas: any, ctx: CanvasRenderingContext2D) {
    console.log("Begin simulation")
    let animationFrame: any = null;
    let boids = generateBoids(INITIAL_NUM);
    let clusters = [boids];
    let newClusters: Array<Array<Boid>> = [[]];
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
    }

    canvas.addEventListener('mouseover', function(e: Event) {
        // Only start the animation if it hasn't yet been started
        if (animationFrame == null) {
            animationFrame = window.requestAnimationFrame(cycle);
        }
    });

    canvas.addEventListener('mouseout', function(e: Event) {
        // Uncomment this line to pause simulation when not in focus
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
    });

    canvas.addEventListener("mousemove", function(e: Event) {
        // Set the focal point to the mouse's position
        //focalPoint = { x: e.offsetX, y: e.offsetY};
    });

    canvas.addEventListener("mousedown", function(e: Event) {
        // OffsetX/Y is the point on the canvas clicked. X/Y is the actual screen coordinates
        //spawnBoid(e.offsetX, e.offsetY);
    });
}
    

function assignClusters(boid: Boid, boids: Array<Boid>, minDist: number, minPoints: number, clusterId: number): number {
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

function generateBoids(num: number): Array<Boid> {
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
            //color: RGB(),
            color: DEFAULT_COLOR,
            minSpeed: defaultMinSpeed,
            maxSpeed: defaultMaxSpeed,
            cluster: UNDEFINED,
        });
    }

    return boids;
}

function calculateBoidVelocity(boid: Boid, boids: Array<Boid>): Velocity {
    let newVel =        {dx: 0, dy: 0};
    let separation =    {dx: 0, dy: 0};
    let cohesion =      {dx: 0, dy: 0};
    let alignment =     {dx: 0, dy: 0};
    let focus =         {dx: 0, dy: 0};

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
    /*
    newVel.dx +=  (separation.dx * separationStr)
                + (cohesion.dx   * cohesionStr)
                + (alignment.dx  * alignmentStr);

    newVel.dy +=  (separation.dy * separationStr)
                + (cohesion.dy   * cohesionStr)
                + (alignment.dy  * alignmentStr);
    */

    // Add all of the factors together
    newVel.dx +=  (separation.dx * behaviorRules.separation)
                + (cohesion.dx   * behaviorRules.cohesion)
                + (alignment.dx  * behaviorRules.alignment);

    newVel.dy +=  (separation.dy * behaviorRules.separation)
                + (cohesion.dy   * behaviorRules.cohesion)
                + (alignment.dy  * behaviorRules.alignment);
    return newVel;
}

function boidDist(boid: Boid, other: Boid): number {
    return Math.sqrt((boid.x - other.x)**2 + (boid.y - other.y)**2);
}


function updateBoid(boid: Boid): void {
    limitSpeed(boid);
    avoidWalls(boid);
    recolor(boid);

    // Update position from velocity
    // % can return negative numbers by default, so account for that
    boid.x = mod(boid.x + boid.dx, windowWidth);
    boid.y = mod(boid.y + boid.dy, windowHeight);

    // Determine the Boid's angle based on its velocity
    boid.angle = Math.atan2(boid.dy, boid.dx);
}

function recolor(boid: Boid): void {
    limitSpeed(boid);
    avoidWalls(boid);
    //boid.color = boid.cluster > 0 ? COLORS[boid.cluster - 1] : [250, 250, 250];
    boid.color = DEFAULT_COLOR;
    if (boid.cluster > 0) {
        if (colors[boid.cluster] == null) {
            colors[boid.cluster] = RGB();
        }

        boid.color = colors[boid.cluster];
    }
}




function limitSpeed(boid: Boid): void {
    // Fetch the speed of the boid (magnitude of the velocity vector)
    let speed = Math.sqrt(boid.dx**2 + boid.dy**2);

    // Clamp the speed between min and max
    if (speed > boid.maxSpeed) {
        boid.dx = (boid.dx / speed) * boid.minSpeed;
        boid.dy = (boid.dy / speed) * boid.minSpeed;
    } else if (speed < boid.minSpeed) {
        boid.dx = (boid.dx / speed) * boid.maxSpeed;
        boid.dy = (boid.dy / speed) * boid.maxSpeed;
    }
}

function avoidWalls(boid: Boid) {
    // If the position is too close to the margin, steer away
    if (boid.x < fovDist) {
        //boid.dy += steerStr; // Steer the boid
        boid.dx += steerStr; // Slow the boid
    } else if (boid.x > windowWidth - fovDist) {
        //boid.dy -= steerStr; // Steer
        boid.dx -= steerStr; // Slow
    }
    if (boid.y < fovDist) {
        //boid.dx -= steerStr; // Steer
        boid.dy += steerStr; // Slow
    } else if (boid.y > windowHeight - fovDist) {
        //boid.dx += steerStr; // Steer
        boid.dy -= steerStr; // Slow
    }
}


function render(ctx: CanvasRenderingContext2D, boid: Boid): void {
    // Align the canvas with the Boid's angle
    ctx.translate(boid.x, boid.y);
    ctx.rotate(boid.angle);
    ctx.translate(-boid.x, -boid.y);

    triangle(ctx, boid.x, boid.y, boid.x - boid.length, boid.y + boid.width, boid.x - boid.length, boid.y - boid.width);
    //circle(ctx, boid.x, boid.y, boid.width);

    // Begin drawing the Boid (shape + outline)
    ctx.fillStyle = "rgba(" + boid.color + ", " + 0.75 + ")"; // Set the fill color
    ctx.fill();
    
    ctx.resetTransform();
}
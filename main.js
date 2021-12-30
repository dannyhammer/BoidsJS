const INITIAL_NUM = 200;
const MAX_BOIDS = 500;
const TWOPI = 2 * Math.PI;
const SHAPES = ["circle", "eye", "triangle"];

const COLORS = [
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255],
    [255, 255, 0],
    [0, 255, 255],
    [255, 0, 255],
    [255, 128, 0],
    [0, 255, 128],
    [128, 0, 255],
    [0, 128, 255],
    [128, 0, 255],
    [128, 255, 0],
    [255, 0, 128],
]

//let RGB = function () { return Math.floor(Math.random() * 256); };
let randRange = function(min, max) { return Math.round(Math.random() * (max - min)) + min };
//let normalize = function(val, max, min) { return (val - min) / (max - min); };
//let normalize = function(val, max, min) { return min + (max - min) * val; };



class Boid {
    constructor(id, x, y) {
        this.id = id;                                               // Unique ID
        this.pos = {x: x, y: y};                                    // Positional information
        this.vel = {x: Math.random() - 1, y: Math.random() - 1};    // Velocity x y components
        this.cluster = 0;                                           // Which cluster the Boid belongs to
        this.minSpeed = 2;                                          // Slowest the Boid can go
        this.maxSpeed = 4;                                          // Fastest the Boid can go
        this.angle = 0.0;                                           // Angle of rotation
        this.jitterChance = 0.01;                                   // Chance to divert directions
        this.steeringStrength = 0.5;                                // How strong the Boid steers to avoid walls
        this.transparency = 0.5;                                    // How transparent the Boid is
        //this.color = [RGB(), RGB(), RGB()];                         // Initialize to a random color
        this.color = [250, 250, 250];                               // Initial color is white
    }

    render(ctx) {
        switch (env.shape) {
            case "circle":
                // Outer circle
                ctx.beginPath();
                ctx.arc(this.pos.x, this.pos.y, env.boid_width, 0, TWOPI, true);
                ctx.fillStyle = "rgba(" + this.color + ", 1)"; // Set the fill color
                //ctx.fillStyle = "rgba(0, 0, 0, 1)"; // Set the fill color
                ctx.stroke();
                ctx.fill();
                break;
            case "eye":
                // Outer circle
                ctx.beginPath();
                ctx.arc(this.pos.x, this.pos.y, env.boid_width, 0, TWOPI, true);
                ctx.stroke(); // Draw the black outline
                ctx.fillStyle = "rgba(" + this.color + ", " + this.transparency + ")"; // Set the fill color
                ctx.fill();

                // Inner circle
                ctx.beginPath();
                ctx.arc(this.vel.x*1.5 + this.pos.x, this.vel.y*1.5 + this.pos.y, env.boid_width / 2, 0, TWOPI, true);
                ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
                ctx.stroke();
                ctx.fill(); // Draw the black outline

                //ctx.fillStyle = "rgba(" + this.color + ", " + this.transparency + ")"; // Set the fill color
                break;

            case "triangle":
            default:
                // Align the canvas with the Boid
                ctx.translate(this.pos.x, this.pos.y);
                ctx.rotate(this.angle);
                ctx.translate(-this.pos.x, -this.pos.y);


                // Begin drawing the Boid (shape + outline)
                ctx.beginPath();
                ctx.moveTo(this.pos.x, this.pos.y);
                ctx.lineTo(this.pos.x - env.boid_length, this.pos.y - env.boid_width);
                ctx.lineTo(this.pos.x - env.boid_length, this.pos.y + env.boid_width);
                ctx.lineTo(this.pos.x, this.pos.y);
                ctx.stroke(); // Draw the black outline
                ctx.fillStyle = "rgba(" + this.color + ", " + this.transparency + ")"; // Set the fill color
                ctx.fill();
        }

        // Resets the canvas' transform
        ctx.resetTransform();
    }

    update(env) {
        this.limitSpeed();
        this.avoidWalls();

        // Update the Boid's color based on its cluster. Unclustered boids are white
        this.color = this.cluster > 0 ? COLORS[this.cluster - 1] : [250, 250, 250];

        // Update position from velocity
        this.pos = mod(add(this.pos, this.vel), {x: env.width, y: env.height}); // Keep within bounds
        //this.pos = add(this.pos, this.vel); // Allow leaving bounds

        // Track the Boid's position in the environment
        env.positions[this.id] = this.pos;

        // Determine the Boid's angle based on its velocity
        this.angle = Math.atan2(this.vel.y, this.vel.x);
    }

    tooClose(other) {
        // "Too close" is within a measure of one Boid's length
        return distance(this.pos, other.pos) < env.boid_length;
    }

    inSight(other) {
        // "In sight" is within the Boid's FOV
        return distance(this.pos, other.pos) < env.boid_length * 3;;
    }

    limitSpeed() {
        // Fetch the speed of the boid (magnitude of the velocity vector)
        let speed = Math.sqrt(this.vel.x**2 + this.vel.y**2);

        // Clamp the speed between min and max
        if (speed > env.maxSpeed) {
            this.vel = mult(div(this.vel, speed), env.minSpeed);
        } else if (speed < env.minSpeed) {
            this.vel = mult(div(this.vel, speed), env.maxSpeed);
        }
    }

    avoidWalls() {
        // Avoid walls that are twice the Boid's length away
        let margin = env.boid_length * 2;

        // If the position is too close to the margin, steer away
        if (this.pos.x < margin) {
            this.vel = add(this.vel, {x: this.steeringStrength, y: 0});
        } else if (this.pos.x > env.width - margin) {
            this.vel = sub(this.vel, {x: this.steeringStrength, y: 0});
        }
        if (this.pos.y < margin) {
            this.vel = add(this.vel, {x: 0, y: this.steeringStrength});
        } else if (this.pos.y > env.height - margin) {
            this.vel = sub(this.vel, {x: 0, y: this.steeringStrength});
        }
    }
}

class Environment {
    constructor(numBoids) {
        this.boids = [];
        this.clusters = [];
        this.positions = [];
        this.size = 0;
        this.max = MAX_BOIDS;
        this.width = 3840;
        this.height = 2160;
        this.ctx = null;
        this.canvas = null;
        this.focalPoint = null;
        this.animationFrame = null;

        // This config info can be edited by the UI
        this.jitter_strength = 0.5;
        this.alignment_strength = 0.1;
        this.separation_strength = 0.01;
        this.cohesion_strength = 0.001;
        this.focus_strength = 0.001;
        this.boid_length = 18;
        this.boid_width = 6;
        this.shape = "triangle";
        this.minSpeed = 2;
        this.maxSpeed = 4;

        if (numBoids > this.max) {
            console.log("Maximum number of boids reached (" + this.max + ")");
            numBoids = this.max
        }

        // Spawn boids
        for (let i = 0; i < numBoids; i++) {
            let x = randRange(50, this.width - 50);
            let y = randRange(50, this.height - 50);

            this.spawnBoid(x, y);
        }
    }

    spawnBoid(x, y) {
        // Only spawn a boid if there is room
        if (this.size < this.max) {
            this.boids.push(new Boid(this.size, x, y));
            this.positions.push(this.boids[this.size].pos);
            this.size++;
        } else {
            console.log("Maximum number of boids reached (" + this.max + ")");
        }
    }

    calculateBoidVelocity(boid) {
        let vel = {x: 0, y: 0};
        let separation = {x: 0, y: 0};
        let cohesion = {x: 0, y: 0};
        let alignment = {x: 0, y: 0};
        let focus = {x: 0, y: 0};
        let jitter = {x: 0, y: 0};

        let numVisible = 0;
        let numTooClose = 0;

        // Iterate over every other boid in the same cluster
        for (let other of this.clusters[boid.cluster]) {
            if (boid !== other) {
                // Separation occurs when the other boid is too close
                if (boid.tooClose(other)) {
                    separation = add(separation, sub(boid.pos, other.pos));
                    numTooClose += 1;
                }

                // Cohesion and alignment occur to boids within sight
                if (boid.inSight(other)) {
                    numVisible += 1;
                    cohesion = add(cohesion, other.pos);
                    alignment = add(alignment, other.vel);
                }
            } 
        }

        // Compute the separation value
        if (numTooClose > 0) {
            separation = div(separation, numTooClose);
        }

        // Compute alignment and cohesion values
        if (numVisible > 0) {
            cohesion = div(cohesion, numVisible);
            alignment = div(alignment, numVisible);

            // Only subtract if at least one neighbor was found
            cohesion = sub(cohesion, boid.pos);
            alignment = sub(alignment, boid.vel);
        }

        // Attract/repel from focal point
        if (this.focalPoint != null) {
            //focus = sub(this.focalPoint, boid.pos); // Attract boids
            focus = sub(boid.pos, this.focalPoint); // Repel boids
        }

        // Check jitter chance
        /*
        if (Math.random() < boid.jitterChance) {
            jitter.x = randRange(-boid.vel.y, boid.vel.y);
            jitter.y = randRange(-boid.vel.x, boid.vel.x);
        }
        */

        // Add all of the factors together
        vel = add(vel, mult(separation, env.separation_strength));
        vel = add(vel, mult(cohesion, env.cohesion_strength));
        vel = add(vel, mult(alignment, env.alignment_strength));
        vel = add(vel, mult(focus, env.focus_strength));
        vel = add(vel, mult(jitter, env.jitter_strength));

        return vel;
    }
}

function resizeCanvas() {
    env.canvas = document.getElementById("cnvs");
    let sidebar = window.getComputedStyle(document.getElementById("sidemenu"));
    
    // Set the dimensions of the window
    let new_width = window.innerWidth - parseInt(sidebar.width) - 25;
    let new_height = window.innerHeight - 45;

    env.width = env.canvas.width = new_width;
    env.height = env.canvas.height = new_height;
}

function distance(a, b) {
    return Math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2);
}

function add(a, b) {
    if (typeof b == "number") {
        return {x: a.x + b, y: a.y + b};
    } else if (typeof a == typeof b && typeof a == "object") {
        return {x: a.x + b.x, y: a.y + b.y};
    }
}

function sub(a, b) {
    if (typeof b == "number") {
        return {x: a.x - b, y: a.y - b};
    } else if (typeof a == typeof b && typeof a == "object") {
        return {x: a.x - b.x, y: a.y - b.y};
    }
}

function mult(a, b) {
    if (typeof b == "number") {
        return {x: a.x * b, y: a.y * b};
    } else if (typeof a == typeof b && typeof a == "object") {
        return {x: a.x * b.x, y: a.y * b.y};
    }
}

function div(a, b) {
    if (typeof b == "number") {
        return {x: a.x / b, y: a.y / b};
    } else if (typeof a == typeof b && typeof a == "object") {
        return {x: a.x / b.x, y: a.y / b.y};
    }
}

function mod(a, b) {
    if (typeof b == "number") {
        return {x: ((a.x % b) + b) % b, y: ((a.y % b) + b) % b};
    } else if (typeof a == typeof b && typeof a == "object") {
        return {x: ((a.x % b.x) + b.x) % b.x, y: ((a.y % b.y) + b.y) % b.y};
    }
}

function main(env) {
    // Fetch canvas information
    env.canvas = document.getElementById("cnvs");
    env.ctx = env.canvas.getContext("2d");

    // Create a Density-Based Scanner for clustering
    let dbscanner = jDBSCAN().eps(env.boid_length * 2).minPts(1);

    let cycle = function() {
        // Clear the screen
        env.ctx.clearRect(0, 0, env.width, env.height);

        // Assign every boid a cluster ID (clusterMap[boid.id] = clusterId)
        let clusterMap = dbscanner.data(env.positions)();
        clusterMap.forEach(function(clusterId, boidId) { env.boids[boidId].cluster = clusterId });

        // Reset the clusters; It's a new iteration, so boids may change clusters
        env.clusters = [];

        for (let boid of env.boids) {
            // Create clusters
            if (env.clusters[boid.cluster] == null) {
                env.clusters[boid.cluster] = [];
            }
            // Add boids to their respective clusters
            env.clusters[boid.cluster].push(boid)

            // Calculate the new velocity of the boid
            let newVel = env.calculateBoidVelocity(boid);
            boid.vel = add(boid.vel, newVel);

            // Update position and render
            boid.update(env);
            boid.render(env.ctx);
        }
        env.animationFrame = window.requestAnimationFrame(cycle);
    }

    env.canvas.addEventListener('mouseover', function(e) {
        // Only start the animation if it hasn't yet been started
        if (env.animationFrame == null) {
            env.animationFrame = window.requestAnimationFrame(cycle);
        } 
    });

    env.canvas.addEventListener('mouseout', function(e) {
        // Uncomment this line to pause simulation when not in focus
        //window.cancelAnimationFrame(env.animationFrame);

        // Remove the focal point
        env.focalPoint = null;
    });

    env.canvas.addEventListener("mousemove", function(e) {
        // Set the focal point to the mouse's position
        //env.focalPoint = { x: e.offsetX, y: e.offsetY};
    });

    env.canvas.addEventListener("mousedown", function(e) {
        // OffsetX/Y is the point on the canvas clicked. X/Y is the actual screen coordinates
        env.spawnBoid(e.offsetX, e.offsetY);
    });

    
    // TODO: Figure out how to normalize the values
    // I want each slider to go from [0, 100] and start at 50
    // But each slider needs to normalize between different ranges, like [0, 0.05]
    /*
    let dummySlider = document.getElementById("DUMMYSLIDER");
    dummySlider.oninput = function() {
        console.log(this.value, normalize(this.value, 1, 0.1));
    }
    */
    
    let sepSlider = document.getElementById("sepSlider");
    let cohSlider = document.getElementById("cohSlider");
    let aliSlider = document.getElementById("aliSlider");
    let sizeSlider = document.getElementById("sizeSlider");
    let speedSlider = document.getElementById("speedSlider");

    sepSlider.oninput = function() {
        env.separation_strength = +this.value;
        console.log("Separation: " + env.separation_strength);
    }

    cohSlider.oninput = function() {
        env.cohesion_strength = +this.value;
        console.log("Cohesion: " + env.cohesion_strength);
    }

    aliSlider.oninput = function() {
        env.alignment_strength = +this.value;
        console.log("Alignment: " + env.alignment_strength);
    }

    sizeSlider.oninput = function() {
        env.boid_length = +this.value;
        env.boid_width = this.value / 3;
        dbscanner = jDBSCAN().eps(env.boid_length * 2).minPts(1);
    }

    speedSlider.oninput = function() {
        env.minSpeed = this.value >> 1;
        env.maxSpeed = +this.value;
    }

    document.getElementById("shadowCheck").oninput = function() {
        if (this.checked) {
            // Cast a shadow
            env.ctx.shadowOffsetX = env.boid_length / 5;
            env.ctx.shadowOffsetY = env.boid_length / 5;
            env.ctx.shadowBlur = 10;
            env.ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        } else {
            env.ctx.shadowOffsetX = null;
            env.ctx.shadowOffsetY = null;
            env.ctx.shadowBlur = null;
            env.ctx.shadowColor = null;
        }
    }

    document.getElementById("shapeSelect").oninput = function() {
        env.shape = this.value;
    }

    document.getElementById("resetButton").onclick = function() {
        aliSlider.value = env.alignment_strength = 0.1;
        sepSlider.value = env.separation_strength = 0.01;
        cohSlider.value = env.cohesion_strength = 0.001;

        env.boid_width = 6;
        sizeSlider.value = env.boid_length = 18;

        env.minSpeed = 2;
        speedSlider.value = env.maxSpeed = 4;

        dbscanner = jDBSCAN().eps(env.boid_length * 2).minPts(1);
    }
}

// Global environment variable to hold configuration info
var env = new Environment(INITIAL_NUM);

window.onload = function() {
    window.addEventListener("resize", resizeCanvas, false);
    resizeCanvas();

    main(env);
}

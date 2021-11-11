const SEPARATION_STRENGTH = 0.005;
const COHESION_STRENGTH = 0.00025;
const ALIGNMENT_STRENGTH = 0.05;
const FOCUS_STRENGTH = 0.0005;
const JITTER_STRENGTH = 0.5;

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

let RGB = function () { return Math.floor(Math.random() * 256); };
let randRange = function(min, max) { return Math.round(Math.random() * (max - min)) + min };
//let normalize = function(val, min, max) { return (val - min) / (max - min); };


class Boid {
    constructor(id, x, y) {
        // Unique ID of the boid
        this.id = id;
        this.pos = {x: x, y: y};
        this.length = 30;
        this.width = this.length / 3;
        this.fov = this.length * 3;
        this.cluster = 0;
        this.minSpeed = 2;
        this.maxSpeed = 4;
        this.vel = {x: 0, y: 0};
        this.angle = 0.0;
        this.jitterChance = 0.01;
        this.steeringStrength = 0.5;
        this.transparency = 0.5;
        //this.color = [RGB(), RGB(), RGB(), 0.5];
        this.color = [250, 250, 250];
    }

    render(ctx) {
        // Align the canvas with the Boid
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.angle);
        ctx.translate(-this.pos.x, -this.pos.y);

        // Begin drawing the Boid (shape + outline)
        ctx.beginPath();
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.lineTo(this.pos.x - this.length, this.pos.y - this.width);
        ctx.lineTo(this.pos.x - this.length, this.pos.y + this.width);
        ctx.lineTo(this.pos.x, this.pos.y);
        ctx.stroke(); // Draw the black outline
        ctx.fillStyle = "rgba(" + this.color + ", " + this.transparency + ")"; // Set the fill color

        // Cast a shadow
        ctx.shadowOffsetX = this.length / 5;
        ctx.shadowOffsetY = this.length / 5;
        ctx.shadowBlur = 5 / this.transparency;
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";

        // Render the boid
        ctx.fill();

        // Display the Boid's ID
        ctx.font = (this.length / 4) + "px mono";
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(1.57079); // Rotate 90 degrees
        ctx.translate(-this.pos.x, -this.pos.y);
        ctx.fillStyle = "rgba(0, 0, 0, 1)";
        ctx.textAlign = "center";
        ctx.fillText(this.id, this.pos.x, this.pos.y + this.length - this.width / 2);
        //let pos = "(" + [Math.round(this.pos.x), Math.round(this.pos.y)] + ")";
        //ctx.fillText(pos, this.pos.x, this.pos.y + this.length);

        //let vel = "(" + [Math.round(this.vel.x), Math.round(this.vel.y)] + ")";
        //ctx.fillText(vel, this.pos.x, this.pos.y + this.length);

        // Resets the canvas' transform
        ctx.resetTransform();
    }

    update(env) {
        this.limitSpeed();
        this.avoidWalls();

        // Update the Boid's color based on its cluster
        this.color = this.cluster > 0 ? COLORS[this.cluster] : [250, 250, 250];

        // Update position from velocity
        this.pos = mod(add(this.pos, this.vel), {x: env.width, y: env.height}); // Keep within bounds
        //this.pos = add(this.pos, this.vel); // Allow leaving bounds

        // Determine the Boid's angle based on its velocity
        this.angle = Math.atan2(this.vel.y, this.vel.x);
    }

    tooClose(other) {
        return distance(this.pos, other.pos) < this.length;
    }

    inSight(other) {
        return distance(this.pos, other.pos) < this.fov;
    }

    limitSpeed() {
        let speed = Math.sqrt(this.vel.x**2 + this.vel.y**2);

        if (speed > this.maxSpeed) {
            this.vel = mult(div(this.vel, speed), this.minSpeed);
        } else if (speed < this.minSpeed) {
            this.vel = mult(div(this.vel, speed), this.maxSpeed);
        }
    }

    avoidWalls() {
        let margin = this.length * 2;

        if (this.pos.x < margin) {
            this.vel = add(this.vel, {x: this.steeringStrength, y: 0});
        }
        if (this.pos.x > env.width - margin) {
            this.vel = sub(this.vel, {x: this.steeringStrength, y: 0});
        }
        if (this.pos.y < margin) {
            this.vel = add(this.vel, {x: 0, y: this.steeringStrength});
        }
        if (this.pos.y > env.height - margin) {
            this.vel = sub(this.vel, {x: 0, y: this.steeringStrength});
        }
    }
}

class Environment {
    constructor(numBoids) {

        this.boids = [];
        this.size = numBoids;
        this.max = 100;
        this.canvas = null;
        this.ctx = null;
        this.width = 3840;
        this.height = 2160;
        this.focalPoint = null;
        this.animationFrame = null;
        this.clusters = [];
        this.clusterMap = [];

        if (this.size > this.max) {
            console.log("Maximum number of boids reached (" + this.max + ")");
            this.size = this.max
        }

        for (let i = 0; i < this.size; i++) {
            let x = randRange(50, this.width - 50);
            let y = randRange(50, this.height - 50);
            this.boids.push(new Boid(i, x, y));
        }
    }

    spawnBoid(x, y) {
        if (this.size < this.max) {
            this.boids.push(new Boid(this.size++, x, y));
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

        for (let other of this.boids) {
            if (boid !== other) {
                if (boid.tooClose(other)) {
                    separation = add(separation, sub(boid.pos, other.pos));
                    numTooClose += 1;
                }
                if (boid.inSight(other)) {
                    numVisible += 1;
                    cohesion = add(cohesion, other.pos);
                    alignment = add(alignment, other.vel);
                }
            } 
        }

        if (numTooClose > 0) {
            separation = div(separation, numTooClose);
        }

        if (numVisible > 0) {
            cohesion = div(cohesion, numVisible);
            alignment = div(alignment, numVisible);
        }

        cohesion = sub(cohesion, boid.pos);
        alignment = sub(alignment, boid.vel);

        if (this.focalPoint != null) {
            focus = sub(this.focalPoint, boid.pos);
        }

        if (Math.random() < boid.jitterChance) {
            jitter.x = randRange(-boid.vel.y, boid.vel.y);
            jitter.y = randRange(-boid.vel.x, boid.vel.x);
        }

        vel = add(vel, mult(separation, SEPARATION_STRENGTH));
        vel = add(vel, mult(cohesion, COHESION_STRENGTH));
        vel = add(vel, mult(alignment, ALIGNMENT_STRENGTH));
        vel = add(vel, mult(focus, FOCUS_STRENGTH));
        vel = add(vel, mult(jitter, JITTER_STRENGTH));

        return vel;
    }
}

function resizeCanvas() {
    env.canvas = document.getElementById("cnvs");
    env.width = window.innerWidth;
    env.height = window.innerHeight;
    env.canvas.width = env.width;
    env.canvas.height = env.height;
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
        return {x: a.x % b, y: a.y % b};
    } else if (typeof a == typeof b && typeof a == "object") {
        return {x: a.x % b.x, y: a.y % b.y};
    }
}

function main(env) {
    // Fetch canvas information
    env.canvas = document.getElementById("cnvs");
    env.ctx = env.canvas.getContext("2d");

    // Create a Density-Based Scanner for clustering
    let dbscanner = jDBSCAN().eps(env.boids[0].fov).minPts(2);

    let cycle = function() {
        // Clear the screen
        env.ctx.clearRect(0, 0, env.width, env.height);

        // Get the positions of every boid in the environment
        let pointData = env.boids.map(function (boid) { return boid.pos });

        // Assign a cluster ID to every boid ID
        env.clusterMap = dbscanner.data(pointData)();

        env.clusters = [];

        for (let boid of env.boids) {
            let newVel = env.calculateBoidVelocity(boid);

            boid.vel = add(boid.vel, newVel);
            boid.cluster = env.clusterMap[boid.id];

            /*
            if (env.clusters[boid.cluster] == null) {
                env.clusters[boid.cluster] = [];
            }
            env.clusters[boid.cluster].push(boid)
            */

            boid.update(env);
            boid.render(env.ctx);
        }
        env.animationFrame = window.requestAnimationFrame(cycle);
    }

    env.canvas.addEventListener('mouseover', function(e) {
        if (env.animationFrame == null) {
            env.animationFrame = window.requestAnimationFrame(cycle);
        } else {
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
        env.focalPoint = { x: e.x, y: e.y};
    });

    env.canvas.addEventListener("mousedown", function(e) {
        env.spawnBoid(e.x, e.y);
    });
}

var env = new Environment(50);

window.onload = function() {
    window.addEventListener("resize", resizeCanvas, false);
    resizeCanvas();

    main(env);
}

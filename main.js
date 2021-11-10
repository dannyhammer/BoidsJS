const SEPARATION_STRENGTH = 0.005;
const COHESION_STRENGTH = 0.00025;
const ALIGNMENT_STRENGTH = 0.05;
const FOCUS_STRENGTH = 0.0005;
const JITTER_STRENGTH = 0.5;

let RGB = function () { return Math.floor(Math.random() * 256); };
let randRange = function(min, max) { return Math.round(Math.random() * (max - min)) + min };
//let normalize = function(val, min, max) { return (val - min) / (max - min); };


class Boid {
    constructor(id, x, y) {
        this.id = id;
        // TODO: Convert to { x: num, y: num }
        this.pos = [x, y];
        this.length = 30;
        this.width = this.length / 3;
        this.fov = this.length * 3;
        this.minSpeed = 2;
        this.maxSpeed = 4;
        this.vel = [0, 0];
        this.angle = 0.0;
        this.jitterChance = 0.01;
        this.color = [RGB(), RGB(), RGB(), 0.5];
        this.steeringStrength = 0.5;
    }

    render(ctx) {
        // Align the canvas with the Boid
        ctx.translate(this.pos[0], this.pos[1]);
        ctx.rotate(this.angle);
        ctx.translate(-this.pos[0], -this.pos[1]);

        // Begin drawing the Boid (shape + outline)
        ctx.beginPath();
        ctx.moveTo(this.pos[0], this.pos[1]);
        ctx.lineTo(this.pos[0] - this.length, this.pos[1] - this.width);
        ctx.lineTo(this.pos[0] - this.length, this.pos[1] + this.width);
        ctx.lineTo(this.pos[0], this.pos[1]);
        ctx.stroke(); // Draw the black outline
        ctx.fillStyle = "rgb(" + this.color + ")"; // Set the fill color

        // Cast a shadow
        ctx.shadowOffsetX = this.length / 5;
        ctx.shadowOffsetY = this.length / 5;
        ctx.shadowBlur = 5 / this.color[3];
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";

        // Render the boid
        ctx.fill();


        // Display the Boid's ID
        ctx.font = (this.length / 4) + "px mono";
        ctx.translate(this.pos[0], this.pos[1]);
        ctx.rotate(1.57079); // Rotate 90 degrees
        ctx.translate(-this.pos[0], -this.pos[1]);
        ctx.fillStyle = "rgba(0, 0, 0, 1)";
        ctx.textAlign = "center";
        ctx.fillText(this.id, this.pos[0], this.pos[1] + this.length - this.width / 2);
        //let pos = "(" + [Math.round(this.pos[0]), Math.round(this.pos[1])] + ")";
        //ctx.fillText(pos, this.pos[0], this.pos[1] + this.length);

        //let vel = "(" + [Math.round(this.vel[0]), Math.round(this.vel[1])] + ")";
        //ctx.fillText(vel, this.pos[0], this.pos[1] + this.length);

        // Resets the canvas' transform
        ctx.resetTransform();
    }

    update() {
        this.limitSpeed();
        this.avoidWalls();

        // Update position from velocity
        this.pos = mod(add(this.pos, this.vel), [env.width, env.height]); // Keep within bounds
        //this.pos = add(this.pos, this.vel); // Allow leaving bounds
        this.angle = Math.atan2(this.vel[1], this.vel[0]);
    }

    tooClose(other) {
        return distance(this.pos, other.pos) < this.length;
    }

    inSight(other) {
        return distance(this.pos, other.pos) < this.fov;
    }

    limitSpeed() {
        let speed = Math.sqrt(this.vel[0]**2 + this.vel[1]**2);

        if (speed > this.maxSpeed) {
            this.vel = mult(div(this.vel, speed), this.minSpeed);
        } else if (speed < this.minSpeed) {
            this.vel = mult(div(this.vel, speed), this.maxSpeed);
        }
    }

    avoidWalls() {
        let margin = this.length * 2;

        if (this.pos[0] < margin) {
            this.vel = add(this.vel, [this.steeringStrength, 0]);
        }
        if (this.pos[0] > env.width - margin) {
            this.vel = sub(this.vel, [this.steeringStrength, 0]);
        }
        if (this.pos[1] < margin) {
            this.vel = add(this.vel, [0, this.steeringStrength]);
        }
        if (this.pos[1] > env.height - margin) {
            this.vel = sub(this.vel, [0, this.steeringStrength]);
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
        let vel = [0, 0];
        let separation = [0, 0];
        let cohesion = [0, 0];
        let alignment = [0, 0];
        let focus = [0, 0];
        let jitter = [0, 0];

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
            jitter[0] = randRange(-boid.vel[1], boid.vel[1]);
            jitter[1] = randRange(-boid.vel[0], boid.vel[0]);
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
    return Math.sqrt((a[0] - b[0])**2 + (a[1] - b[1])**2);
}

function add(a, b) {
    if (typeof b == "number") {
        return [a[0] + b, a[1] + b];
    } else if (typeof a == typeof b && typeof a == "object") {
        return [a[0] + b[0], a[1] + b[1]];
    }
}

function sub(a, b) {
    if (typeof b == "number") {
        return [a[0] - b, a[1] - b];
    } else if (typeof a == typeof b && typeof a == "object") {
        return [a[0] - b[0], a[1] - b[1]];
    }
}

function mult(a, b) {
    if (typeof b == "number") {
        return [a[0] * b, a[1] * b];
    } else if (typeof a == typeof b && typeof a == "object") {
        return [a[0] * b[0], a[1] * b[1]];
    }
}

function div(a, b) {
    if (typeof b == "number") {
        return [a[0] / b, a[1] / b];
    } else if (typeof a == typeof b && typeof a == "object") {
        return [a[0] / b[0], a[1] / b[1]];
    }
}

function mod(a, b) {
    if (typeof b == "number") {
        return [a[0] % b, a[1] % b];
    } else if (typeof a == typeof b && typeof a == "object") {
        return [a[0] % b[0], a[1] % b[1]];
    }
}

function main(env) {
    env.canvas = document.getElementById("cnvs");
    env.ctx = env.canvas.getContext("2d");

    let cycle = function() {
        // Render Code
        env.ctx.clearRect(0, 0, env.width, env.height);

        for (let boid of env.boids) {
            let newVel = env.calculateBoidVelocity(boid);

            boid.vel = add(boid.vel, newVel);
            boid.update();
            boid.render(env.ctx);
        }
        env.animationFrame = window.requestAnimationFrame(cycle);
    }

    env.canvas.addEventListener('mouseover', function(e) {
        if (env.animationFrame == null) {
            env.animationFrame = window.requestAnimationFrame(cycle);
        } 
    });

    env.canvas.addEventListener('mouseout', function(e) {
        //window.cancelAnimationFrame(animationFrame);
        env.animationFrame = null;
        env.focalPoint = null;
    });

    env.canvas.addEventListener("mousemove", function(e) {
        env.focalPoint = [e.x, e.y];
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

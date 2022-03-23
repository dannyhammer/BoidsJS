"use strict";
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
];
var focalPoint;
var separationStr;
var cohesionStr;
var alignmentStr;
var defaultLength = 18;
var defaultWidth = defaultLength / 3;
var defaultMinSpeed = 2;
var defaultMaxSpeed = 4;
var steerStr = 0.5;
var personalSpace = defaultLength;
var fovDist = defaultLength * 3;
var windowWidth = 3960;
var windowHeight = 2160;

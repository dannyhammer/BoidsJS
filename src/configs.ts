
const INITIAL_NUM: number = 200;
const MAX_BOIDS: number = 500;
const UNDEFINED: number = -1;
const NOISE: number = 0;
const MIN_CLUSTER_SIZE: number = 1;

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

var focalPoint: Position;
var separationStr: number;
var cohesionStr: number;
var alignmentStr: number;
var defaultLength = 18;
var defaultWidth = defaultLength / 3;
var defaultMinSpeed = 2;
var defaultMaxSpeed = 4;
var steerStr = 0.5; // Boids do a clockwise motion around the room
var personalSpace = defaultLength;
var fovDist = defaultLength * 3;
var windowWidth = 3960
var windowHeight = 2160
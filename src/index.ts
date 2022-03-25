function main() {
    let canvas = document.getElementById("cnvs") as HTMLCanvasElement;
    if (canvas != null) {
        let ctx = canvas.getContext("2d");

        simulate(canvas, ctx);
    }
}

function resizeCanvas() {
    // Need to typecast this to ensure height/width fields
    let canvas = document.getElementById("cnvs") as HTMLCanvasElement;
    let sidebar = window.getComputedStyle(document.getElementById("sidemenu"));

    if (canvas != null) {
        // Set the dimensions of the window
        // The magic numbers are to prevent the scroll bars from appearing
        windowWidth = window.innerWidth - parseInt(sidebar.width) - 25;
        windowHeight = window.innerHeight - 30;

        // Update the dimensions of the canvas element
        canvas.height = windowHeight;
        canvas.width = windowWidth;

        console.log("Canvas Dimensions: (" + windowWidth + ", " + windowHeight + ")");
    }
}
    

function initSlider (sliderId: string, min: number, max: number, value: number, configVar: number): HTMLInputElement {
    let slider = document.getElementById(sliderId) as HTMLInputElement;
    slider.min = "" + min;
    //max = value * 2;
    slider.max = "" + max;
    slider.step = "" + (max - min) / 100;
    slider.value = "" + value;

    // Link the slider to the global config variable
    slider.onclick = () => {
        configVar = slider.valueAsNumber;
        console.log(slider.name + ": " + slider.value);
    }

    return slider;
}


/*
function initSlider (sliderId: string, name: string, min: number, max: number, value: number, configVar: number): HTMLInputElement {
    let slider = document.getElementById(sliderId) as HTMLInputElement;
    slider.min = "0";
    slider.max = "1";
    slider.step = "0.01";
    slider.value = "0.5";

    slider.onclick = () => {
        configVar = slider.valueAsNumber;
        console.log(name + ": " + slider.value);
    }

    return slider;
}
*/



function resetConfig() {
    let sepSlider = initSlider("sepSlider", 0, 0.05, 0.01, separationStr);
    let cohSlider = initSlider("cohSlider", 0, 0.01, 0.001, cohesionStr);
    let aliSlider = initSlider("aliSlider", 0, 0.5, 0.1, alignmentStr);

    separationStr = sepSlider.valueAsNumber;
    cohesionStr = cohSlider.valueAsNumber;
    alignmentStr = aliSlider.valueAsNumber;


    defaultWidth = 6;
    defaultLength = 18;

    defaultMinSpeed = 2;
    defaultMaxSpeed = 4;


    console.log("Config Reset:");
    console.log("Separation: " + separationStr);
    console.log("Cohesion: " + cohesionStr);
    console.log("Alignment: " + alignmentStr);
}


function setupControls() {
    document.getElementById("resetButton").onclick = resetConfig;

    resetConfig();
}

window.onload = () => {
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    setupControls();

    main();
}
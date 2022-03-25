"use strict";
function main() {
    let canvas = document.getElementById("cnvs");
    if (canvas != null) {
        let ctx = canvas.getContext("2d");
        simulate(canvas, ctx);
    }
}
function resizeCanvas() {
    // Need to typecast this to ensure height/width fields
    let canvas = document.getElementById("cnvs");
    let sidebar = window.getComputedStyle(document.getElementById("sidemenu"));
    if (canvas != null) {
        // Set the dimensions of the window
        // The magic numbers are to prevent the scroll bars from appearing
        windowWidth = window.innerWidth - parseInt(sidebar.width) - 25;
        windowHeight = window.innerHeight - 30;
        // Update the dimensions of the canvas element
        canvas.height = windowHeight;
        canvas.width = windowWidth;
        console.log("Canvas Resized: (" + windowHeight + ", " + windowWidth + ")");
    }
}
function initSlider(sliderId, min, max, value, configVar) {
    let slider = document.getElementById(sliderId);
    slider.min = "" + min;
    //max = value * 2;
    slider.max = "" + max;
    slider.step = "" + (max - min) / 100;
    slider.value = "" + value;
    // Link the slider to the global config variable
    slider.onclick = () => {
        configVar = slider.valueAsNumber;
        console.log(slider.name + ": " + configVar);
    };
    return slider;
}
function defaultSlider(sliderId, valueField, min, max, value, configVar) {
    let slider = document.getElementById(sliderId);
    slider.min = "0";
    slider.max = "1";
    slider.step = "0.01";
    slider.value = "0.5";
    slider.onclick = () => {
        behaviorRules[configVar] = scale(min, max, value, slider.valueAsNumber);
        document.getElementById(valueField).innerHTML = "" + parseFloat(behaviorRules[configVar].toFixed(3));
        //document.getElementById(valueField).innerHTML = "" + slider.valueAsNumber * 100 + "%"
    };
    slider.click();
    return slider;
}
function scale(min, max, mid, value) {
    let scaled;
    /*
        if (0 <= value && value <= 0.5) {
            scaled = (mid - min) * value;
    
        } else if (value <= 1.0) {
            scaled = (max - mid) * value;
    
        } else {
            console.log("OUT OF RANGE")
            scaled = 0;
        }
        */
    scaled = (max + mid) * value ** 2 - mid * value;
    return scaled;
}
function resetConfig() {
    /*
    let sepSlider = initSlider("sepSlider", 0, 0.05, 0.01, separationStr);
    let cohSlider = initSlider("cohSlider", 0, 0.01, 0.001, cohesionStr);
    let aliSlider = initSlider("aliSlider", 0, 0.5, 0.1, alignmentStr);
    */
    let sepSlider = defaultSlider("sepSlider", "sepValue", 0, 0.05, 0.01, "separation");
    let cohSlider = defaultSlider("cohSlider", "cohValue", 0, 0.005, 0.001, "cohesion");
    let aliSlider = defaultSlider("aliSlider", "aliValue", 0, 0.5, 0.1, "alignment");
    //separationStr = sepSlider.valueAsNumber;
    //cohesionStr = cohSlider.valueAsNumber;
    //alignmentStr = aliSlider.valueAsNumber;
    defaultWidth = 6;
    defaultLength = 18;
    defaultMinSpeed = 2;
    defaultMaxSpeed = 4;
    /*
    console.log("Config Reset:");
    console.log("Separation: " + separationStr);
    console.log("Cohesion: " + cohesionStr);
    console.log("Alignment: " + alignmentStr);
    */
    console.log("Config Reset:");
    console.log(behaviorRules);
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
};

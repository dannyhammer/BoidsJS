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
function initSlider(sliderId, min, max, value) {
    let slider = document.getElementById(sliderId);
    slider.min = "" + min;
    slider.max = "" + max;
    //slider.step = "" + (max - min) / 100;
    //slider.step = "any";
    slider.value = "" + value;
    return slider;
}
function defaultSlider(sliderId, valueField, min, mid, max, configVar) {
    let slider = document.getElementById(sliderId);
    slider.min = "0";
    slider.max = "1";
    slider.step = "any";
    slider.value = "0.5";
    // Same functionality whether you click or input
    slider.oninput = slider.onclick = () => {
        let newValue = scale(min, mid, max, slider.valueAsNumber);
        document.getElementById(valueField).innerHTML = "" + parseFloat(newValue.toFixed(9));
        behaviorRules[configVar] = newValue;
        //document.getElementById(valueField).innerHTML = "" + behaviorRules[configVar];
        //document.getElementById(valueField).innerHTML = "" + slider.valueAsNumber * 100 + "%"
    };
    // Initial click of the slider
    slider.click();
    return slider;
}
function scale(min, mid, max, value) {
    return (max + mid) * value ** 2 + (-mid) * value + min;
}
function resetConfig() {
    /*
    let sepSlider = initSlider("sepSlider", 0, 0.05, 0.01);
    let cohSlider = initSlider("cohSlider", 0, 0.01, 0.001);
    let aliSlider = initSlider("aliSlider", 0, 0.5, 0.1);
    */
    let sepSlider = defaultSlider("sepSlider", "sepValue", 0, 0.01, 0.05, "separation");
    let cohSlider = defaultSlider("cohSlider", "cohValue", 0, 0.001, 0.005, "cohesion");
    let aliSlider = defaultSlider("aliSlider", "aliValue", 0, 0.1, 0.5, "alignment");
    defaultWidth = 6;
    defaultLength = 18;
    defaultMinSpeed = 2;
    defaultMaxSpeed = 4;
    console.log("Config Reset:");
    for (let key in behaviorRules) {
        console.log("\t" + key + ":", parseFloat(behaviorRules[key].toFixed(6)));
    }
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

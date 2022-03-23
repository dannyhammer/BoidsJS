function main() {
    let canvas = document.getElementById("cnvs") as HTMLCanvasElement;
    if (canvas != null) {
        let ctx = canvas.getContext("2d");

        setupControls();
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


function setupControls() {
    let sepSlider: any = document.getElementById("sepSlider");
    let cohSlider: any = document.getElementById("cohSlider");
    let aliSlider: any = document.getElementById("aliSlider");

    sepSlider.oninput = () => {
        separationStr = +sepSlider.value;
        console.log("Separation: " + separationStr);
    }

    cohSlider.oninput = () => {
        cohesionStr = +cohSlider.value;
        console.log("Cohesion: " + cohesionStr);
    }

    aliSlider.oninput = () => {
        alignmentStr = +aliSlider.value;
        console.log("Alignment: " + alignmentStr);
    }
    
    let resetButton: any = document.getElementById("resetButton");
    resetButton.onclick = () => {
        aliSlider.value = alignmentStr = 0.1;
        sepSlider.value = separationStr = 0.01;
        cohSlider.value = cohesionStr = 0.001;

        defaultWidth = 6;
        defaultLength = 18;

        defaultMinSpeed = 2;
        defaultMaxSpeed = 4;

        //dbscanner = jDBSCAN().eps(env.defaultLength * 2).minPts(1);
    }
    
    separationStr = sepSlider.value;
    cohesionStr = cohSlider.value;
    alignmentStr = aliSlider.value;
}

window.onload = () => {
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    main();
}
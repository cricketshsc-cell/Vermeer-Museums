const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

function resetCanvas() {
    ctx.fillStyle = "#d8c7a5";
ctx.strokeStyle = "#222222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#222222";
}

const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");

colorPicker.addEventListener("input", () => {
    ctx.strokeStyle = colorPicker.value;
});

brushSize.addEventListener("input", () => {
    ctx.lineWidth = brushSize.value;
});

function resetCanvas() {

    // Remove previous drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Choose canvas appearance based on ageing result
    let canvasColor = "#d8c7a5";

    if (typeof preparationScore !== "undefined") {

        if (preparationScore === 30) {
            canvasColor = "#b6a078";
        }
        else if (preparationScore === 22) {
            canvasColor = "#c9b58d";
        }
        else if (preparationScore === 12) {
            canvasColor = "#a88e69";
        }
        else {
            canvasColor = "#e9ddc5";
        }
    }

    // Paint the base canvas
    ctx.fillStyle = canvasColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add ageing texture after preparation
    if (typeof preparationScore !== "undefined" &&
        preparationScore > 0) {

        drawCanvasAgeing(preparationScore);
    }

    // Restore drawing settings
    ctx.globalAlpha = 1;
    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = Number(brushSize.value);
    ctx.lineCap = "round";
}

let drawing = false;
let lastPaintPosition = null;
ctx.lineWidth = 8;
ctx.lineCap = "round";
ctx.strokeStyle = "#222";


canvas.addEventListener("pointerdown", startDrawing);
canvas.addEventListener("pointermove", draw);
canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);
canvas.addEventListener("pointerleave", stopDrawing);


function getMousePosition(event) {
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
    };
}

function startDrawing(event) {
    drawing = true;

    canvas.setPointerCapture(event.pointerId);

    const pos = getMousePosition(event);
    lastPaintPosition = pos;

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
}

function stopDrawing(event) {
    drawing = false;
    lastPaintPosition = null;

    if (
        event &&
        canvas.hasPointerCapture(event.pointerId)
    ) {
        canvas.releasePointerCapture(event.pointerId);
    }
}

function draw(event) {
    if (!drawing) return;

    const pos = getMousePosition(event);

    if (lastPaintPosition !== null) {
        const dx = pos.x - lastPaintPosition.x;
        const dy = pos.y - lastPaintPosition.y;

        paintingDistance += Math.sqrt(
            dx * dx + dy * dy
        );
    }

    lastPaintPosition = pos;

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
}

document.getElementById("clear").addEventListener("click", () => {
    resetCanvas();
    paintingDistance = 0;
    lastPaintPosition = null;
    drawing = false;
});

// STAGE 3 - EXPERT VERDICT

document.getElementById("submit").addEventListener("click", () => {

    const paintingScore = calculatePaintingScore();

    const totalScore = preparationScore + paintingScore;

    const fooledExperts = totalScore >= 80;

    const verdict = fooledExperts
        ? "YOU FOOLED THE EXPERTS"
        : "FORGERY DETECTED";

    const explanation = fooledExperts
        ? "Your forgery has convinced the experts!"
        : "The experts noticed something suspicious.";

    const result = document.getElementById("result");

    result.innerHTML = `
        <div class="verdict-label">THE EXPERT'S VERDICT · 1937</div>

        <h2 class="verdict-title">${verdict}</h2>

        <div class="score-breakdown">
            <p>Canvas Preparation: ${preparationScore} / 30</p>
            <p>Painting Attempt: ${paintingScore} / 70</p>
        </div>

        <h2 class="final-score">${totalScore}%</h2>

        <p>${explanation}</p>

        <div class="history-reveal">
            <h3>THE REAL STORY</h3>
            <p>
                In 1937, Han van Meegeren created
                The Supper at Emmaus, a forgery
                that experts accepted as a genuine Vermeer.
            </p>
            <p>
                His deception was exposed in 1945.
                Could you have spotted the fake?
            </p>
        </div>

        <button onclick="location.reload()">
            TRY AGAIN
        </button>
    `;

    result.classList.remove("hidden");

    result.scrollIntoView({
        behavior: "smooth"
    });

});

function getMessage(score) {

    if (score >= 90) {
        return "You might actually have fooled the experts.";
    }

    if (score >= 75) {
        return "Pretty convincing. Van Meegeren would approve.";
    }

    if (score >= 50) {
        return "Not bad... but the experts might notice.";
    }

    return "Yeah... definitely not a Vermeer.";
}
function calculateSimilarity() {

    const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
    ).data;

    const background = {
        r: 216,
        g: 199,
        b: 165
    };

    let paintedPixels = 0;
    let totalPixels = 0;

    // Check every 20th pixel to keep it fast
    for (let i = 0; i < imageData.length; i += 80) {

        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];

        const difference =
            Math.abs(r - background.r) +
            Math.abs(g - background.g) +
            Math.abs(b - background.b);

        // Has the player actually painted here?
        if (difference > 40) {
            paintedPixels++;
        }

        totalPixels++;
    }

    const coverage = paintedPixels / totalPixels;

    // Completely blank canvas
    if (coverage < 0.001) {
        return 0;
    }

    // Participation alone earns points.
    let score = 25;

    // Reward how much of the canvas they attempted.
    score += Math.min(coverage * 300, 45);

    // Small bonus simply for making a proper attempt.
    if (coverage > 0.03) {
        score += 10;
    }

    if (coverage > 0.08) {
        score += 10;
    }

    // Maximum 90% for now.
    score = Math.min(score, 90);

    return Math.round(score);
}

// ================================
// PREPARE THE FORGERY - TIMING GAME
// ================================

const timingMarker = document.getElementById("timingMarker");
const stopTimingButton = document.getElementById("stopTiming");
const timingResult = document.getElementById("timingResult");
const continueButton = document.getElementById("continueToPainting");

let markerPosition = 0;
let markerDirection = 1;
let timingRunning = true;

let preparationScore = 0;

function moveTimingMarker() {
    if (!timingRunning) return;

    markerPosition += 0.95 * markerDirection;

    if (markerPosition >= 99) {
        markerPosition = 99;
        markerDirection = -1;
    }

    if (markerPosition <= 0) {
        markerPosition = 0;
        markerDirection = 1;
    }

    timingMarker.style.left = markerPosition + "%";

    requestAnimationFrame(moveTimingMarker);
}

moveTimingMarker();

stopTimingButton.addEventListener("click", () => {

    if (!timingRunning) return;

    timingRunning = false;

    // PERFECT AREA
    if (markerPosition >= 48 && markerPosition <= 52) {

        preparationScore = 30;

        timingResult.innerHTML =
            "<strong>PERFECT</strong><br>The canvas looks convincingly aged.";

    }

    // GOOD AREA
    else if (markerPosition >= 40 && markerPosition <= 60) {

        preparationScore = 22;

        timingResult.innerHTML =
            "<strong>GOOD</strong><br>The experts might believe it.";

    }

    // CLOSE
    else if (markerPosition >= 25 && markerPosition <= 75) {

        preparationScore = 12;

        timingResult.innerHTML =
            "<strong>RISKY</strong><br>Something about the canvas looks suspicious.";

    }

    // BAD
    else {

        preparationScore = 5;

        timingResult.innerHTML =
            "<strong>POOR</strong><br>The ageing process doesn't look convincing.";

    }

    stopTimingButton.disabled = true;

    continueButton.classList.remove("hidden");

});

// SWITCH FROM PREPARATION TO DRAWING

continueButton.addEventListener("click", () => {

    // Hide the preparation game
    document.getElementById("prepareScreen").style.display = "none";

    // Show the drawing game
    document.getElementById("drawingScreen").style.display = "grid";
resetCanvas();

const condition = document.getElementById("canvasCondition");

if (preparationScore === 30) {
    condition.textContent =
        "MASTERFULLY AGED — Fine cracks and antique tones";
}
else if (preparationScore === 22) {
    condition.textContent =
        "WELL AGED — Slight discolouration";
}
else if (preparationScore === 12) {
    condition.textContent =
        "UNEVEN AGEING — Visible staining";
}
else {
    condition.textContent =
        "POORLY AGED — The canvas looks unusually new";
}

    // Scroll to the drawing game
    document.getElementById("drawingScreen").scrollIntoView({
        behavior: "smooth"
    });

});

// PAINTING ATTEMPT SCORE - MAX 70 POINTS


// Track how much the player actually paints
let paintingDistance = 0;


function calculatePaintingScore() {
    if (paintingDistance < 100) {
        return 0;
    }

    // Drawing effort earns a maximum of 35 points
    const effortScore = Math.min(
        35,
        Math.round(paintingDistance / 150)
    );

    // The remaining 35 points will come from
    // composition and canvas coverage later
    return effortScore;
}


// MUSEUM START SCREEN

const startGameButton = document.getElementById("startGame");

startGameButton.addEventListener("click", () => {

    document.getElementById("startScreen").style.display = "none";

    document.getElementById("prepareScreen").style.display = "block";

    document.getElementById("prepareScreen").scrollIntoView({
        behavior: "smooth"
    });

});


// =====================================
// HISTORICAL CANVAS AGEING EFFECTS
// =====================================

function drawCanvasAgeing(score) {

    const w = canvas.width;
    const h = canvas.height;

    // Fixed random pattern so Clear doesn't
    // generate completely different ageing
    let seed = 1937;

    function random() {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    }

    // Fine canvas grain
    const grainCount = 3200;

    for (let i = 0; i < grainCount; i++) {

        const x = random() * w;
        const y = random() * h;

        ctx.fillStyle = "rgba(65, 42, 20, 0.07)";
        ctx.fillRect(x, y, 2, 2);
    }

    // Uneven ageing for risky preparation
    if (score === 12) {

        for (let i = 0; i < 18; i++) {

            const x = random() * w;
            const y = random() * h;
            const radius = 25 + random() * 85;

            const stain = ctx.createRadialGradient(
                x, y, 0,
                x, y, radius
            );

            stain.addColorStop(
                0, "rgba(70, 38, 15, 0.22)"
            );

            stain.addColorStop(
                1, "rgba(70, 38, 15, 0)"
            );

            ctx.fillStyle = stain;

            ctx.fillRect(
                x - radius,
                y - radius,
                radius * 2,
                radius * 2
            );
        }
    }

    // Fine simulated surface cracks
    // Best preparation has subtle, controlled ageing
    if (score === 30 || score === 22) {

        const crackCount = score === 30 ? 32 : 12;

        ctx.lineWidth = 0.8;
        ctx.strokeStyle = "rgba(65, 43, 23, 0.22)";

        for (let i = 0; i < crackCount; i++) {

            let x = random() * w;
            let y = random() * h;

            ctx.beginPath();
            ctx.moveTo(x, y);

            for (let j = 0; j < 5; j++) {
                x += (random() - 0.5) * 24;
                y += (random() - 0.5) * 24;
                ctx.lineTo(x, y);
            }

            ctx.stroke();
        }
    }

    // Darkened edges for antique appearance
    if (score === 30 || score === 22 || score === 12) {

        const edge = ctx.createRadialGradient(
            w / 2, h / 2, h * 0.2,
            w / 2, h / 2, w * 0.75
        );

        edge.addColorStop(0, "rgba(0,0,0,0)");
        edge.addColorStop(1, "rgba(55,30,12,0.18)");

        ctx.fillStyle = edge;
        ctx.fillRect(0, 0, w, h);
    }
}


/* Touchscreen drawing support */
#canvas {
    touch-action: none;
    cursor: crosshair;
    max-width: 100%;
    display: block;
}
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

resetCanvas();

let drawing = false;

ctx.lineWidth = 8;
ctx.lineCap = "round";
ctx.strokeStyle = "#222";

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mousemove", draw);

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

    const pos = getMousePosition(event);

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
}

function stopDrawing() {
    drawing = false;
}

function draw(event) {
    if (!drawing) return;

    const pos = getMousePosition(event);

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
}

document.getElementById("clear").addEventListener("click", () => {

   resetCanvas();

});

document.getElementById("submit").addEventListener("click", () => {

    const score = calculateSimilarity();

    document.getElementById("score").textContent =
        score + "%";

    document.getElementById("message").textContent =
        getMessage(score);

    document.getElementById("result")
        .classList.remove("hidden");

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
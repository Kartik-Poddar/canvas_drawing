document.addEventListener("DOMContentLoaded", function () {
    // Ensure fabric is loaded
    if (typeof fabric === 'undefined') {
        console.error('Fabric.js is not loaded');
        return;
    }

    var $ = function (id) { return document.getElementById(id); };

    // Initialize canvas
    var initCanvas = function (id) {
        return new fabric.Canvas(id, {
            isDrawingMode: false,
            width: 750,
            height: 650,
            backgroundColor: 'transparent'
        });
    };

    // Initialize canvas
    var canvas = initCanvas('c');

    // Fabric.js drawing options
    fabric.Object.prototype.transparentCorners = false;

    var brushSelector = $('brush-selector'),
        drawingColorEl = $('drawing-color'),
        drawingLineWidthEl = $('drawing-line-width'),
        exportEl = $('export-image'),
        clearEl = $('clear-canvas'),
        drawingModeEl = $('drawing-mode'),
        drawingOptionsEl = $('drawing-mode-options');

    var cartoonImages = [
        'img1.png',
        'img2.png',
        'img3.png',
        'img4.png',
        'img5.png',
        'img6.png',
        'img7.png',
    ];

    function addRandomCartoon(x, y) {
        var randomImage = cartoonImages[Math.floor(Math.random() * cartoonImages.length)];
        var imgElement = document.createElement('img');
        imgElement.src = randomImage;
        imgElement.classList.add('cartoon');
        imgElement.style.left = x + 'px';
        imgElement.style.top = y + 'px';
        imgElement.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';

        // Set random size
        var randomSize = Math.random() * 100 + 50; // Random size between 50 and 150 pixels
        imgElement.style.width = randomSize + 'px';
        imgElement.style.height = randomSize + 'px';

        document.body.appendChild(imgElement);
    }

    function distributeCartoons() {
        var cols = 5;
        var rows = 10;
        var screenWidth = window.innerWidth;
        var screenHeight = window.innerHeight * 2;
        var cellWidth = screenWidth / cols;
        var cellHeight = screenHeight / rows;

        for (var col = 0; col < cols; col++) {
            for (var row = 0; row < rows; row++) {
                var x = col * cellWidth + Math.random() * cellWidth * 0.5;
                var y = row * cellHeight + Math.random() * cellHeight * 0.5;
                addRandomCartoon(x, y);
            }
        }
    }

    distributeCartoons();

    // Create pattern brushes
    var createPatternBrush = function (type) {
        var brush = new fabric.PatternBrush(canvas);
        brush.getPatternSrc = function () {
            var patternCanvas = fabric.document.createElement('canvas');
            patternCanvas.width = patternCanvas.height = 10;
            var ctx = patternCanvas.getContext('2d');

            switch (type) {
                case 'hline':
                    ctx.strokeStyle = this.color;
                    ctx.lineWidth = 5;
                    ctx.beginPath();
                    ctx.moveTo(0, 5);
                    ctx.lineTo(10, 5);
                    ctx.closePath();
                    ctx.stroke();
                    break;
                case 'vline':
                    ctx.strokeStyle = this.color;
                    ctx.lineWidth = 5;
                    ctx.beginPath();
                    ctx.moveTo(5, 0);
                    ctx.lineTo(5, 10);
                    ctx.closePath();
                    ctx.stroke();
                    break;
                case 'square':
                    var squareWidth = 10, squareDistance = 2.5;
                    patternCanvas.width = patternCanvas.height = squareWidth + squareDistance;
                    ctx.fillStyle = this.color;
                    ctx.fillRect(0, 0, squareWidth, squareWidth);
                    break;
                case 'diamond':
                    ctx.fillStyle = this.color;
                    ctx.beginPath();
                    ctx.moveTo(5, 0);
                    ctx.lineTo(10, 5);
                    ctx.lineTo(5, 10);
                    ctx.lineTo(0, 5);
                    ctx.closePath();
                    ctx.fill();
                    break;
                default:
                    return null;
            }
            return patternCanvas;
        };
        return brush;
    };

    // Create texture brush
    var texturePatternBrush = new fabric.PatternBrush(canvas);
    var img = new Image();
    img.src = '../assets/honey_im_subtle.png';
    texturePatternBrush.source = img;

    // Change brush type
    brushSelector.onchange = function () {
        var brush;
        switch (this.value) {
            case 'hline':
            case 'vline':
            case 'square':
            case 'diamond':
                brush = createPatternBrush(this.value);
                break;
            case 'texture':
                brush = texturePatternBrush;
                break;
            default:
                brush = new fabric[this.value + 'Brush'](canvas);
                break;
        }
        canvas.freeDrawingBrush = brush;

        if (canvas.freeDrawingBrush) {
            brush = canvas.freeDrawingBrush;
            brush.color = drawingColorEl.value;
            if (brush.getPatternSrc) {
                brush.source = brush.getPatternSrc.call(brush);
            }
            brush.width = parseInt(drawingLineWidthEl.value, 10) || 1;
        }
    };

    // Change brush color
    drawingColorEl.onchange = function () {
        canvas.freeDrawingBrush.color = this.value;
        if (canvas.freeDrawingBrush.getPatternSrc) {
            canvas.freeDrawingBrush.source = canvas.freeDrawingBrush.getPatternSrc.call(canvas.freeDrawingBrush);
        }
    };

    // Change brush width
    drawingLineWidthEl.onchange = function () {
        canvas.freeDrawingBrush.width = parseInt(this.value, 10) || 1;
    };

    // Initialize drawing brush
    if (canvas.freeDrawingBrush) {
        var brush = canvas.freeDrawingBrush;
        brush.color = drawingColorEl.value;
        brush.width = parseInt(drawingLineWidthEl.value, 10) || 1;
    }

    // Toggle drawing mode
    drawingModeEl.addEventListener('click', function () {
        drawingModeEl.innerHTML = 'Enter Drawing Mode';
        canvas.isDrawingMode = !canvas.isDrawingMode;
        if (canvas.isDrawingMode) {
            drawingModeEl.innerHTML = 'Cancel Drawing Mode';
            drawingOptionsEl.style.display = 'block';
        } else {
            drawingModeEl.innerHTML = 'Enter Drawing Mode';
            drawingOptionsEl.style.display = 'none';
        }
    });

    // Export the canvas as an image with black background and white drawing
    exportEl.addEventListener('click', function () {
        // Create a temporary canvas to hold the processed image
        var tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        var tempCtx = tempCanvas.getContext('2d');

        // Render the original canvas content onto the temporary canvas
        canvas.renderAll();
        var originalCanvas = canvas.lowerCanvasEl;
        tempCtx.drawImage(originalCanvas, 0, 0);

        // Get image data from the temporary canvas
        var imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        var data = imageData.data;

        // Process the image data to convert drawn pixels to white
        for (var i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0) { // If the pixel is not black
                data[i] = 255; // Red
                data[i + 1] = 255; // Green
                data[i + 2] = 255; // Blue
            }
        }

        // Put the processed image data back to the temporary canvas
        tempCtx.putImageData(imageData, 0, 0);

        // Convert the temporary canvas to a data URL
        var dataURL = tempCanvas.toDataURL('image/png');

        // Create a download link and trigger the download
        var downloadLink = document.createElement('a');
        downloadLink.href = dataURL;
        downloadLink.download = 'canvas_drawing.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    });

    // Clear canvas
    clearEl.addEventListener('click', function () {
        canvas.clear();
    });

});




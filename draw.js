document.addEventListener("DOMContentLoaded", function () {
    if (typeof fabric === 'undefined') {
        console.error('Fabric.js is not loaded');
        return;
    }

    const $ = (id) => document.getElementById(id);

    // Initialize canvas
    const canvas = new fabric.Canvas('c', {
        isDrawingMode: false,
        width: 750,
        height: 650,
        backgroundColor: 'transparent'
    });

    const cartoonImages = [
        'img1.png', 'img2.png', 'img3.png',
        'img4.png', 'img5.png', 'img6.png', 'img7.png'
    ];

    const addRandomCartoon = (x, y) => {
        const randomImage = cartoonImages[Math.floor(Math.random() * cartoonImages.length)];
        const imgElement = document.createElement('img');
        imgElement.src = randomImage;
        imgElement.classList.add('cartoon');
        imgElement.style.left = `${x}px`;
        imgElement.style.top = `${y}px`;
        imgElement.style.transform = `rotate(${Math.random() * 360}deg)`;
        const randomSize = Math.random() * 100 + 50;
        imgElement.style.width = `${randomSize}px`;
        imgElement.style.height = `${randomSize}px`;
        document.body.appendChild(imgElement);
    };

    const distributeCartoons = () => {
        const cols = 5;
        const rows = 10;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight * 2;
        const cellWidth = screenWidth / cols;
        const cellHeight = screenHeight / rows;

        for (let col = 0; col < cols; col++) {
            for (let row = 0; row < rows; row++) {
                const x = col * cellWidth + Math.random() * cellWidth * 0.5;
                const y = row * cellHeight + Math.random() * cellHeight * 0.5;
                addRandomCartoon(x, y);
            }
        }
    };

    distributeCartoons();

    const changeBackgroundButton = $('changebackground');
    const backgroundOptions = $('change');
    const changeBackground = $('changeBack');
    const imgInput = $('upload_image');
    const backgroundImage = $('background-image');

    changeBackgroundButton.addEventListener('click', () => {
        backgroundOptions.style.display = backgroundOptions.style.display === 'none' || backgroundOptions.style.display === '' ? 'flex' : 'none';
    });

    changeBackground.addEventListener('click', () => {
        const file = imgInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataURL = e.target.result;
                localStorage.setItem('uploadedImage', dataURL);
                backgroundImage.src = dataURL;

                backgroundImage.style.objectFit = 'cover';
                backgroundImage.style.width = '100%';
                backgroundImage.style.height = '100%';
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please select an image to upload.');
        }
    });

    const savedImage = localStorage.getItem('uploadedImage');
    if (savedImage) {
        backgroundImage.src = savedImage;
    }

    const createPatternBrush = (type) => {
        const brush = new fabric.PatternBrush(canvas);
        brush.getPatternSrc = function () {
            const patternCanvas = fabric.document.createElement('canvas');
            patternCanvas.width = patternCanvas.height = 10;
            const ctx = patternCanvas.getContext('2d');

            switch (type) {
                case 'hline':
                    ctx.strokeStyle = this.color;
                    ctx.lineWidth = 5;
                    ctx.moveTo(0, 5);
                    ctx.lineTo(10, 5);
                    ctx.stroke();
                    break;
                case 'vline':
                    ctx.strokeStyle = this.color;
                    ctx.lineWidth = 5;
                    ctx.moveTo(5, 0);
                    ctx.lineTo(5, 10);
                    ctx.stroke();
                    break;
                case 'square':
                    var squareWidth = 10, squareDistance = 2;
                    patternCanvas.width = patternCanvas.height = squareWidth + squareDistance;
                    ctx.fillStyle = this.color;
                    ctx.fillRect(0, 0, squareWidth, squareWidth);
                    break;
                case 'diamond':
                    ctx.fillStyle = this.color;
                    ctx.moveTo(5, 0);
                    ctx.lineTo(10, 5);
                    ctx.lineTo(5, 10);
                    ctx.lineTo(0, 5);
                    ctx.fill();
                    break;
            }
            return patternCanvas;
        };
        return brush;
    };

    const brushSelector = $('brush-selector');
    const drawingColorEl = $('drawing-color');
    const drawingLineWidthEl = $('drawing-line-width');
    const exportEl = $('export-image');
    const clearEl = $('clear-canvas');
    const drawingModeEl = $('drawing-mode');
    const drawingOptionsEl = $('drawing-mode-options');

    const texturePatternBrush = new fabric.PatternBrush(canvas);
    const img = new Image();
    img.src = '../assets/honey_im_subtle.png';
    texturePatternBrush.source = img;

    brushSelector.onchange = function () {
        const brushType = this.value;
        let brush;
        switch (brushType) {
            case 'hline':
            case 'vline':
            case 'square':
            case 'diamond':
                brush = createPatternBrush(brushType);
                break;
            case 'texture':
                brush = texturePatternBrush;
                break;
            default:
                brush = new fabric[`${brushType}Brush`](canvas);
                break;
        }
        canvas.freeDrawingBrush = brush;

        if (brush) {
            brush.color = drawingColorEl.value;
            brush.width = parseInt(drawingLineWidthEl.value, 10) || 1;
            if (brush.getPatternSrc) {
                brush.source = brush.getPatternSrc.call(brush);
            }
        }
    };

    drawingColorEl.onchange = function () {
        const brush = canvas.freeDrawingBrush;
        brush.color = this.value;
        if (brush.getPatternSrc) {
            brush.source = brush.getPatternSrc.call(brush);
        }
    };

    drawingLineWidthEl.onchange = function () {
        canvas.freeDrawingBrush.width = parseInt(this.value, 10) || 1;
    };

    if (canvas.freeDrawingBrush) {
        const brush = canvas.freeDrawingBrush;
        brush.color = drawingColorEl.value;
        brush.width = parseInt(drawingLineWidthEl.value, 10) || 1;
    }

    drawingModeEl.addEventListener('click', () => {
        canvas.isDrawingMode = !canvas.isDrawingMode;
        drawingModeEl.innerHTML = canvas.isDrawingMode ? 'Cancel Drawing Mode' : 'Enter Drawing Mode';
        drawingOptionsEl.style.display = canvas.isDrawingMode ? 'block' : 'none';
    });

    exportEl.addEventListener('click', () => {
        const originalWidth = canvas.getWidth();
        const originalHeight = canvas.getHeight();
        const aspectRatio = originalWidth / originalHeight;
        const maxExportWidth = 1500;
        const exportWidth = Math.min(originalWidth, maxExportWidth);
        const exportHeight = exportWidth / aspectRatio;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = exportWidth;
        tempCanvas.height = exportHeight;
        const tempCtx = tempCanvas.getContext('2d');

        canvas.setDimensions({ width: exportWidth, height: exportHeight });
        canvas.renderAll();
        tempCtx.drawImage(canvas.lowerCanvasEl, 0, 0, exportWidth, exportHeight);

        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0) {
                data[i] = data[i + 1] = data[i + 2] = 255; // White
            } else {
                data[i] = data[i + 1] = data[i + 2] = 0; // Black
            }
        }

        tempCtx.putImageData(imageData, 0, 0);

        canvas.setDimensions({ width: originalWidth, height: originalHeight });
        canvas.renderAll();

        const dataURL = tempCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'canvas_drawing.png';
        link.href = dataURL;
        link.click();
    });

    clearEl.addEventListener('click', () => {
        canvas.clear();
    });
});
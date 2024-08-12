document.addEventListener("DOMContentLoaded", () => {
    if (typeof fabric === 'undefined') {
        console.error('Fabric.js is not loaded');
        return;
    }

    const $ = (id) => document.getElementById(id);

    const canvasElement = $('c');
    const canvas = new fabric.Canvas('c', {
        isDrawingMode: false,
        backgroundColor: 'transparent'
    });

    const compressImage = (img, quality = 0.7) => new Promise((resolve, reject) => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        tempCanvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
        tempCanvas.toBlob(blob => {
            if (!blob) return reject(new Error('Image compression failed.'));
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        }, 'image/jpeg', quality);
    });

    const adjustCanvasSize = (img) => {
        const maxDimension = 750;
        const scalingFactor = Math.min(maxDimension / img.width, maxDimension / img.height);
        const newWidth = img.width * scalingFactor;
        const newHeight = img.height * scalingFactor;
        canvas.setWidth(newWidth);
        canvas.setHeight(newHeight);
        return { width: newWidth, height: newHeight };
    };

    const cartoonImages = [
        'img1.png', 'img2.png', 'img3.png',
        'img4.png', 'img5.png', 'img6.png', 'img7.png'
    ];

    const addRandomCartoon = (x, y) => {
        const imgElement = document.createElement('img');
        imgElement.src = cartoonImages[Math.floor(Math.random() * cartoonImages.length)];
        imgElement.classList.add('cartoon');
        imgElement.style.cssText = `
            left: ${x}px;
            top: ${y}px;
            transform: rotate(${Math.random() * 360}deg);
            width: ${Math.random() * 100 + 50}px;
            height: ${Math.random() * 100 + 50}px;
        `;
        document.body.appendChild(imgElement);
    };

    const distributeCartoons = () => {
        const cols = 5, rows = 10;
        const cellWidth = window.innerWidth / cols;
        const cellHeight = (window.innerHeight * 2) / rows;

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

    const setDefaultBackground = () => {
        const img = new Image();
        img.src = 'face.png';
        img.onload = () => {
            const dataURL = compressImage(img);
            localStorage.setItem('uploadedImage', dataURL);
            backgroundImage.src = dataURL;
            adjustCanvasSize(img);
        };
    };

    const savedImg = localStorage.getItem('uploadedImage');
    if (!savedImg) {
        setDefaultBackground();
    } else {
        backgroundImage.src = savedImg;
        const img = new Image();
        img.onload = () => adjustCanvasSize(img);
        img.src = savedImg;
    }

    changeBackgroundButton.addEventListener('click', () => {
        backgroundOptions.style.display = backgroundOptions.style.display === 'flex' ? 'none' : 'flex';
    });

    changeBackground.addEventListener('click', () => {
        canvas.clear();
        localStorage.clear();
        const file = imgInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    compressImage(img).then(compressedDataURL => {
                        try {
                            localStorage.setItem('uploadedImage', compressedDataURL);
                            backgroundImage.src = compressedDataURL;
                            adjustCanvasSize(img);
                        } catch (e) {
                            console.error('Failed to save image to localStorage:', e);
                            alert('Image is too large to save.');
                        }
                    }).catch(err => console.error('Image compression error:', err));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please select an image to upload.');
        }
    });

    const createPatternBrush = (type) => {
        const brush = new fabric.PatternBrush(canvas);
        brush.getPatternSrc = function () {
            const patternCanvas = fabric.document.createElement('canvas');
            patternCanvas.width = patternCanvas.height = 10;
            const ctx = patternCanvas.getContext('2d');
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 5;

            switch (type) {
                case 'hline':
                    ctx.moveTo(0, 5);
                    ctx.lineTo(10, 5);
                    break;
                case 'vline':
                    ctx.moveTo(5, 0);
                    ctx.lineTo(5, 10);
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
            ctx.stroke();
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
    const textureImg = new Image();
    textureImg.src = './honey_im_subtle.png';
    texturePatternBrush.source = textureImg;

    brushSelector.onchange = () => {
        let brush;
        const brushType = brushSelector.value;
        if (['hline', 'vline', 'square', 'diamond'].includes(brushType)) {
            brush = createPatternBrush(brushType);
        } else if (brushType === 'texture') {
            brush = texturePatternBrush;
        } else {
            brush = new fabric[`${brushType}Brush`](canvas);
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

    drawingColorEl.onchange = () => {
        const brush = canvas.freeDrawingBrush;
        if (brush) {
            brush.color = drawingColorEl.value;
            if (brush.getPatternSrc) {
                brush.source = brush.getPatternSrc.call(brush);
            }
        }
    };

    drawingLineWidthEl.onchange = () => {
        if (canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush.width = parseInt(drawingLineWidthEl.value, 10) || 1;
        }
    };

    if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = drawingColorEl.value;
        canvas.freeDrawingBrush.width = parseInt(drawingLineWidthEl.value, 10) || 1;
    }

    drawingModeEl.addEventListener('click', () => {
        canvas.isDrawingMode = !canvas.isDrawingMode;
        drawingModeEl.textContent = canvas.isDrawingMode ? 'Cancel Drawing Mode' : 'Enter Drawing Mode';
        drawingOptionsEl.style.display = canvas.isDrawingMode ? 'block' : 'none';
    });

    exportEl.addEventListener('click', () => {
        const exportWidth = Math.min(canvas.getWidth(), 1500);
        const exportHeight = exportWidth / (canvas.getWidth() / canvas.getHeight());
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = exportWidth;
        exportCanvas.height = exportHeight;
        const exportCtx = exportCanvas.getContext('2d');
        exportCtx.drawImage(canvas.lowerCanvasEl, 0, 0, exportWidth, exportHeight);

        const imageData = exportCtx.getImageData(0, 0, exportCanvas.width, exportCanvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0) {
                data[i] = data[i + 1] = data[i + 2] = 255; // White
            }
        }

        exportCtx.putImageData(imageData, 0, 0);
        const dataURL = exportCanvas.toDataURL('image/jpeg', 1.0);
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = 'image.jpg';
        a.click();
    });

    clearEl.addEventListener('click', () => {
        canvas.clear();
    });
});

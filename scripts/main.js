document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('gridCanvas');
    const ctx = canvas.getContext('2d');
    let regions = [];
    let isDrawing = false;
    let selectedRegion = null;
    let isResizing = false;
    let resizeDirection = '';
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;
    let history = [];
    let historyIndex = -1;
    let zoomLevel = 1;
    let panX = 0;
    let panY = 0;

    canvas.addEventListener('wheel', handleZoom);
    canvas.addEventListener('mousemove', handlePan);
    canvas.addEventListener('mousedown', initiateRegionDrawing);
    canvas.addEventListener('mousemove', handleRegionDrawing);
    canvas.addEventListener('mouseup', finalizeRegionDrawing);
    document.addEventListener('keydown', handleKeyboardShortcuts);
    function handleZoom(e) {
        const scaleFactor = 1.1;
        zoomLevel *= e.deltaY < 0 ? scaleFactor : 1 / scaleFactor;
        redrawRegions();
    }

    function handlePan(e) {
        if (e.buttons === 1) {
            panX += e.movementX;
            panY += e.movementY;
            redrawRegions();
        }
    }

    function initiateRegionDrawing(e) {
        const x = e.offsetX;
        const y = e.offsetY;
        isDrawing = true;
        startX = x;
        startY = y;
        selectedRegion = regions.find(region => x > region.startX && x < region.endX && y > region.startY && y < region.endY);
        if (selectedRegion) {
            determineResizeDirection(x, y, selectedRegion);
        }
    }

    function determineResizeDirection(x, y, region) {
        if (Math.abs(x - region.startX) < 10) {
            isResizing = true;
            resizeDirection = 'left';
        } else if (Math.abs(x - region.endX) < 10) {
            isResizing = true;
            resizeDirection = 'right';
        } else if (Math.abs(y - region.startY) < 10) {
            isResizing = true;
            resizeDirection = 'top';
        } else if (Math.abs(y - region.endY) < 10) {
            isResizing = true;
            resizeDirection = 'bottom';
        }
    }

    function handleRegionDrawing(e) {
        const x = e.offsetX;
        const y = e.offsetY;
        if (isDrawing && !isResizing) {
            endX = x;
            endY = y;
            redrawRegions();
            ctx.fillStyle = 'rgba(0, 128, 255, 0.5)';
            ctx.fillRect(startX, startY, endX - startX, endY - startY);
        } else if (selectedRegion && isResizing) {
            resizeSelectedRegion(x, y);
            redrawRegions();
        }
    }
    function resizeSelectedRegion(x, y) {
        switch (resizeDirection) {
            case 'left':
                selectedRegion.startX = x;
                break;
            case 'right':
                selectedRegion.endX = x;
                break;
            case 'top':
                selectedRegion.startY = y;
                break;
            case 'bottom':
                selectedRegion.endY = y;
                break;
        }
    }

    function finalizeRegionDrawing(e) {
        if (isDrawing && !isResizing) {
            regions.push({
                startX: startX,
                startY: startY,
                endX: endX,
                endY: endY
            });
            pushToHistory();
        }
        resetDrawingState();
    }

    function resetDrawingState() {
        isDrawing = false;
        selectedRegion = null;
        isResizing = false;
        resizeDirection = '';
    }

    function pushToHistory() {
        history = history.slice(0, historyIndex + 1);
        history.push(JSON.parse(JSON.stringify(regions)));
        historyIndex++;
    }

    function handleKeyboardShortcuts(e) {
        if (e.ctrlKey) {
            switch (e.key) {
                case 'z':
                    undo();
                    break;
                case 'y':
                    redo();
                    break;
                case 's':
                    e.preventDefault();
                    saveConfiguration();
                    break;
                case 'l':
                    e.preventDefault();
                    loadConfiguration();
                    break;
            }
        }
    }

    function undo() {
        if (historyIndex > 0) {
            historyIndex--;
            regions = JSON.parse(JSON.stringify(history[historyIndex]));
            redrawRegions();
        }
    }

    function redo() {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            regions = JSON.parse(JSON.stringify(history[historyIndex]));
            redrawRegions();
        }
    }

    function saveConfiguration() {
        localStorage.setItem('regions', JSON.stringify(regions));
        alert('Configuration saved successfully!');
    }

    function loadConfiguration() {
        const savedRegions = localStorage.getItem('regions');
        if (savedRegions) {
            regions = JSON.parse(savedRegions);
            redrawRegions();
            alert('Configuration loaded successfully!');
        } else {
            alert('No saved configuration found.');
        }
    }

    function redrawRegions() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        drawRegions();
    }

    function drawGrid() {
        ctx.strokeStyle = '#e0e0e0';
        const gridSize = 32;
        for (let x = 0; x <= canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }

    function drawRegions() {
        let labelCount = 1;
        for (let region of regions) {
            ctx.fillStyle = 'rgba(0, 128, 255, 0.5)';
            ctx.fillRect(region.startX, region.startY, region.endX - region.startX, region.endY - region.startY);
            ctx.fillStyle = '#000';
            ctx.fillText('R' + labelCount, region.startX + 5, region.startY + 15);
            labelCount++;
        }
    }

    redrawRegions();
});

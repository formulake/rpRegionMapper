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
    let divideRatio = 1;
    let history = [];
    let historyIndex = -1;
    let zoomLevel = 1;
    let panX = 0;
    let panY = 0;
    let isPreviewMode = false;

    function zoom(e) {
        const scaleFactor = 1.1;
        if (e.deltaY < 0) {
            zoomLevel *= scaleFactor;
        } else {
            zoomLevel /= scaleFactor;
        }
        redrawRegions();
    }

    function pan(e) {
        if (e.buttons === 1) {
            panX += e.movementX;
            panY += e.movementY;
            redrawRegions();
        }
    }

    canvas.addEventListener('wheel', zoom);
    canvas.addEventListener('mousemove', pan);
	
	    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'z') {
            undo();
        } else if (e.ctrlKey && e.key === 'y') {
            redo();
        } else if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveConfiguration();
        } else if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            loadConfiguration();
        }
    });

    canvas.addEventListener('mousedown', function(e) {
        const x = e.offsetX;
        const y = e.offsetY;
        isDrawing = true;
        startX = x;
        startY = y;
        for (let region of regions) {
            if (x > region.startX && x < region.endX && y > region.startY && y < region.endY) {
                selectedRegion = region;
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
                break;
            }
        }
    });

    canvas.addEventListener('mousemove', function(e) {
        const x = e.offsetX;
        const y = e.offsetY;
        if (isDrawing && !isResizing) {
            endX = x;
            endY = y;
            redrawRegions();
            ctx.fillStyle = 'rgba(0, 128, 255, 0.5)';
            ctx.fillRect(startX, startY, endX - startX, endY - startY);
        } else if (selectedRegion && isResizing) {
            if (resizeDirection === 'left') {
                selectedRegion.startX = x;
            } else if (resizeDirection === 'right') {
                selectedRegion.endX = x;
            } else if (resizeDirection === 'top') {
                selectedRegion.startY = y;
            } else if (resizeDirection === 'bottom') {
                selectedRegion.endY = y;
            }
            redrawRegions();
        }
    });
	
	    canvas.addEventListener('mouseup', function(e) {
        if (isDrawing && !isResizing) {
            regions.push({
                startX: startX,
                startY: startY,
                endX: endX,
                endY: endY
            });
            pushToHistory();
        }
        isDrawing = false;
        selectedRegion = null;
        isResizing = false;
        resizeDirection = '';
    });

    function pushToHistory() {
        history = history.slice(0, historyIndex + 1);
        history.push(JSON.parse(JSON.stringify(regions)));
        historyIndex++;
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

    function clearRegions() {
        regions = [];
        redrawRegions();
        pushToHistory();
    }

    previewToggleButton.addEventListener('click', function() {
        isPreviewMode = !isPreviewMode;
        if (isPreviewMode) {
            previewToggleButton.textContent = 'Switch to Edit Mode';
        } else {
            previewToggleButton.textContent = 'Switch to Preview Mode';
        }
        redrawRegions();
    });
	
	    function redrawRegions() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        ctx.strokeStyle = '#e0e0e0';  // Light gray color for grid lines
        const gridSize = 32;  // Size of each grid cell
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

        let labelCount = 1;
        for (let region of regions) {
            ctx.fillStyle = 'rgba(0, 128, 255, 0.5)';
            ctx.fillRect(region.startX, region.startY, region.endX - region.startX, region.endY - region.startY);
            ctx.fillStyle = '#000';
            ctx.fillText('R' + labelCount, region.startX + 5, region.startY + 15);
            labelCount++;
        }
    }

    function checkOverlap(newRegion) {
        for (let region of regions) {
            if (newRegion.startX < region.endX && newRegion.endX > region.startX &&
                newRegion.startY < region.endY && newRegion.endY > region.startY) {
                alert('Regions cannot overlap!');
                return true;
            }
        }
        return false;
    }

    function saveConfiguration() {
        localStorage.setItem('regions', JSON.stringify(regions));
    }

    function loadConfiguration() {
        const savedRegions = localStorage.getItem('regions');
        if (savedRegions) {
            regions = JSON.parse(savedRegions);
            redrawRegions();
        }
    }
	
	    const ratioInput = document.createElement('input');
    ratioInput.type = 'range';
    ratioInput.min = '0.1';
    ratioInput.max = '10';
    ratioInput.step = '0.1';
    ratioInput.value = divideRatio;
    document.querySelector('.controls').appendChild(ratioInput);

    ratioInput.addEventListener('input', function() {
        divideRatio = parseFloat(ratioInput.value);
    });

    const helpSection = document.createElement('div');
    helpSection.innerHTML = '<h3>How to Use:</h3><p>Draw regions on the grid by clicking and dragging. Adjust the divide ratio using the slider. Click the Generate Information button to get the required information. Use the save and load buttons to save your configuration and load it later.</p>';
    document.body.appendChild(helpSection);

    const feedbackModal = document.getElementById('feedbackModal');
    const feedbackMessage = document.getElementById('feedbackMessage');
    const closeBtn = document.querySelector('.closeBtn');

    closeBtn.addEventListener('click', function() {
        feedbackModal.style.display = 'none';
    });

    generateBtn.addEventListener('click', function() {
        // ... existing code ...

        // Check for overlapping regions or other issues
        const validationErrors = validateRegions();
        if (validationErrors.length > 0) {
            feedbackMessage.textContent = validationErrors.join('\n');
            feedbackModal.style.display = 'block';
        } else {
            feedbackMessage.textContent = 'Information generated successfully!';
            feedbackModal.style.display = 'block';
        }
    });

    function validateRegions() {
        let errors = [];
        // Logic to check for overlapping regions or other issues
        // Add error messages to the errors array
        return errors;
    }
	
	    // Function to handle zooming in and out
    function handleZoom(e) {
        const scaleFactor = 1.1;
        if (e.deltaY < 0) {
            zoomLevel *= scaleFactor;
        } else {
            zoomLevel /= scaleFactor;
        }
        redrawRegions();
    }

    // Function to handle panning
    function handlePan(e) {
        if (e.buttons === 1) {
            panX += e.movementX;
            panY += e.movementY;
            redrawRegions();
        }
    }

    // Add event listeners for zoom and pan
    canvas.addEventListener('wheel', handleZoom);
    canvas.addEventListener('mousemove', handlePan);

    // Function to handle keyboard shortcuts
    function handleKeyboardShortcuts(e) {
        if (e.ctrlKey && e.key === 'z') {
            undo();
        } else if (e.ctrlKey && e.key === 'y') {
            redo();
        } else if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveConfiguration();
        } else if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            loadConfiguration();
        }
    }

    // Add event listener for keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // Function to handle grid size changes
    function handleGridSizeChange() {
        const gridSize = parseInt(gridSizeInput.value, 10);
        canvas.width = gridSize;
        canvas.height = gridSize;
        redrawRegions();
    }

    // Add event listener for grid size input change
    gridSizeInput.addEventListener('change', handleGridSizeChange);
	
	    // Function to handle region drawing and resizing
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
            if (resizeDirection === 'left') {
                selectedRegion.startX = x;
            } else if (resizeDirection === 'right') {
                selectedRegion.endX = x;
            } else if (resizeDirection === 'top') {
                selectedRegion.startY = y;
            } else if (resizeDirection === 'bottom') {
                selectedRegion.endY = y;
            }
            redrawRegions();
        }
    }

    // Add event listener for mouse movement over the canvas
    canvas.addEventListener('mousemove', handleRegionDrawing);

    // Function to finalize region drawing or resizing
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
        isDrawing = false;
        selectedRegion = null;
        isResizing = false;
        resizeDirection = '';
    }

    // Add event listener for mouse release over the canvas
    canvas.addEventListener('mouseup', finalizeRegionDrawing);

    // Function to handle region selection and resizing initiation
    function initiateRegionDrawing(e) {
        const x = e.offsetX;
        const y = e.offsetY;
        isDrawing = true;
        startX = x;
        startY = y;
        for (let region of regions) {
            if (x > region.startX && x < region.endX && y > region.startY && y < region.endY) {
                selectedRegion = region;
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
                break;
            }
        }
    }

    // Add event listener for mouse press over the canvas
    canvas.addEventListener('mousedown', initiateRegionDrawing);
	
	    // Function to handle the generation of information based on drawn regions
    function generateInformation() {
        // Here, you can add the logic to generate the ADDCOL, ADDROW templates, 
        // Divide Ratio information, and the prompt for Stable Diffusion based on the drawn regions.
        // For now, I'll just add a placeholder logic.

        const templateOutput = document.getElementById('templateOutput');
        const ratioOutput = document.getElementById('ratioOutput');
        const promptOutput = document.getElementById('promptOutput');

        // Placeholder logic for generating information
        templateOutput.value = "ADDCOL, ADDROW Template Placeholder";
        ratioOutput.value = "Divide Ratio Placeholder";
        promptOutput.value = "Prompt for Stable Diffusion Placeholder";

        // TODO: Add the actual logic for generating the required information based on the drawn regions.
    }

    // Add event listener for the Generate Information button
    const generateBtn = document.getElementById('generateBtn');
    generateBtn.addEventListener('click', generateInformation);

    // Function to handle the preview mode toggle
    function togglePreviewMode() {
        isPreviewMode = !isPreviewMode;
        if (isPreviewMode) {
            previewToggleButton.textContent = 'Switch to Edit Mode';
        } else {
            previewToggleButton.textContent = 'Switch to Preview Mode';
        }
        redrawRegions();
    }

    // Add event listener for the Preview Mode toggle button
    const previewToggleButton = document.getElementById('previewToggleBtn');
    previewToggleButton.addEventListener('click', togglePreviewMode);
	
	    // Function to handle zooming in and out on the canvas
    function handleZoom(e) {
        const scaleFactor = 1.1;
        if (e.deltaY < 0) {
            zoomLevel *= scaleFactor;
        } else {
            zoomLevel /= scaleFactor;
        }
        redrawRegions();
    }

    // Add event listener for mouse wheel scroll over the canvas for zooming
    canvas.addEventListener('wheel', handleZoom);

    // Function to handle panning on the canvas
    function handlePan(e) {
        if (e.buttons === 1) {
            panX += e.movementX;
            panY += e.movementY;
            redrawRegions();
        }
    }

    // Add event listener for mouse movement over the canvas for panning
    canvas.addEventListener('mousemove', handlePan);

    // Function to handle undo operation
    function handleUndo() {
        if (historyIndex > 0) {
            historyIndex--;
            regions = JSON.parse(JSON.stringify(history[historyIndex]));
            redrawRegions();
        }
    }

    // Function to handle redo operation
    function handleRedo() {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            regions = JSON.parse(JSON.stringify(history[historyIndex]));
            redrawRegions();
        }
    }

    // Add event listeners for keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'z') {
            handleUndo();
        } else if (e.ctrlKey && e.key === 'y') {
            handleRedo();
        }
    });
	
	    // Function to handle saving the current configuration
    function saveConfiguration() {
        localStorage.setItem('regions', JSON.stringify(regions));
        alert('Configuration saved successfully!');
    }

    // Function to handle loading the saved configuration
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

    // Add event listeners for keyboard shortcuts for saving and loading configurations
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveConfiguration();
        } else if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            loadConfiguration();
        }
    });

    // Function to validate the drawn regions
    function validateRegions() {
        let errors = [];
        // TODO: Add logic to check for overlapping regions or other issues
        // For now, it's just a placeholder
        return errors;
    }

    // Function to display feedback to the user
    function showFeedback(message) {
        feedbackMessage.textContent = message;
        feedbackModal.style.display = 'block';
    }

    // Add event listener for the close button of the feedback modal
    closeBtn.addEventListener('click', function() {
        feedbackModal.style.display = 'none';
    });
	
	    // Function to handle clearing all drawn regions
    function clearAllRegions() {
        if (confirm('Are you sure you want to clear all regions?')) {
            regions = [];
            redrawRegions();
            pushToHistory();
        }
    }

    // Add event listener for the Clear All button
    const clearAllBtn = document.getElementById('clearAllBtn');
    clearAllBtn.addEventListener('click', clearAllRegions);

    // Function to handle the generation of information based on drawn regions
    generateBtn.addEventListener('click', function() {
        // Check for overlapping regions or other issues
        const validationErrors = validateRegions();
        if (validationErrors.length > 0) {
            showFeedback(validationErrors.join('\n'));
        } else {
            generateInformation();
            showFeedback('Information generated successfully!');
        }
    });

    // Function to handle resizing the canvas based on grid size input
    const gridSizeInputWidth = document.getElementById('gridSizeInputWidth');
    const gridSizeInputHeight = document.getElementById('gridSizeInputHeight');
    gridSizeInputWidth.addEventListener('input', resizeCanvas);
    gridSizeInputHeight.addEventListener('input', resizeCanvas);

    function resizeCanvas() {
        canvas.width = parseInt(gridSizeInputWidth.value);
        canvas.height = parseInt(gridSizeInputHeight.value);
        redrawRegions();
    }
	
	    // Function to generate information based on drawn regions
    function generateInformation() {
        // TODO: Implement the logic to generate information based on drawn regions
        // This function should generate the ADDCOL, ADDROW template, Divide Ratio information, and the prompt for Stable Diffusion
        // For now, it's just a placeholder
    }

    // Function to redraw regions on the canvas
    function redrawRegions() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        ctx.strokeStyle = '#e0e0e0';  // Light gray color for grid lines
        const gridSize = 32;  // Size of each grid cell
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

        // Draw regions
        let labelCount = 1;
        for (let region of regions) {
            ctx.fillStyle = 'rgba(0, 128, 255, 0.5)';
            ctx.fillRect(region.startX, region.startY, region.endX - region.startX, region.endY - region.startY);
            ctx.fillStyle = '#000';
            ctx.fillText('R' + labelCount, region.startX + 5, region.startY + 15);
            labelCount++;
        }

        // TODO: Hide any editing controls, like resize handles, in preview mode
        if (isPreviewMode) {
            // ...
        }
    }

    // Initial canvas setup
    resizeCanvas();
    redrawRegions();
	
});
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const codeInput = document.getElementById('codeInput');
    const languageSelect = document.getElementById('languageSelect');
    const viewMode = document.getElementById('viewMode');
    const linesCount = document.getElementById('linesCount');
    const linesCountContainer = document.getElementById('linesCountContainer');
    const processButton = document.getElementById('processCode');
    const prevButton = document.getElementById('prevLine');
    const nextButton = document.getElementById('nextLine');
    const showAllButton = document.getElementById('showAll');
    const collapseAllButton = document.getElementById('collapseAll');
    const codeViewer = document.getElementById('codeViewer');
    const currentLineSpan = document.getElementById('currentLine');
    const totalLinesSpan = document.getElementById('totalLines');
    const viewerSection = document.querySelector('.viewer-section');

    let codeLines = [];
    let currentLineIndex = 0;
    let displayedLines = new Set(); // For incremental view

    // Function to highlight code using the server
    async function highlightCode(code, language) {
        try {
            const response = await fetch('/highlight', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: code,
                    language: language
                })
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            return data.highlighted_code;
        } catch (error) {
            console.error('Error:', error);
            return code; // Fallback to plain text if highlighting fails
        }
    }

    // View mode change handler
    viewMode.addEventListener('change', () => {
        const mode = viewMode.value;
        linesCountContainer.style.display = mode === 'multi' ? 'block' : 'none';
        if (mode === 'single') {
            linesCount.value = 1;
        }
        if (codeLines.length > 0) {
            updateDisplay();
        }
    });

    // Process code button click handler
    processButton.addEventListener('click', async () => {
        const code = codeInput.value.trim();
        if (!code) return;

        // Split code into lines but keep empty lines
        codeLines = code.split('\n');
        currentLineIndex = 0;
        displayedLines.clear();
        totalLinesSpan.textContent = codeLines.length;
        
        // Show viewer section
        viewerSection.style.display = 'block';
        
        // Show first line(s)
        await updateDisplay();
    });

    // Previous line button click handler
    prevButton.addEventListener('click', async () => {
        const mode = viewMode.value;
        if (mode === 'incremental') {
            // In incremental mode, remove the last added line
            const sortedLines = [...displayedLines].sort((a, b) => a - b);
            if (sortedLines.length > 0) {
                const lastLine = sortedLines[sortedLines.length - 1];
                displayedLines.delete(lastLine);
                currentLineIndex = sortedLines.length > 1 ? sortedLines[sortedLines.length - 2] : 0;
            }
        } else {
            // For single and multi modes
            const lineCount = parseInt(linesCount.value);
            if (currentLineIndex - lineCount >= 0) {
                currentLineIndex -= lineCount;
            }
        }
        await updateDisplay();
    });

    // Next line button click handler
    nextButton.addEventListener('click', async () => {
        const mode = viewMode.value;
        if (mode === 'incremental') {
            if (currentLineIndex < codeLines.length - 1) {
                currentLineIndex++;
                displayedLines.add(currentLineIndex);
            }
        } else {
            const lineCount = parseInt(linesCount.value);
            if (currentLineIndex + lineCount <= codeLines.length) {
                currentLineIndex += lineCount;
            }
        }
        await updateDisplay();
    });
    // Show all button click handler
    showAllButton.addEventListener('click', async () => {
        await displayAllLines();
    });

    // Collapse all button click handler
    collapseAllButton.addEventListener('click', async () => {
        if (codeLines.length > 0) {
            currentLineIndex = 0;
            displayedLines.clear();
            await updateDisplay();
        }
    });

    // Function to scroll to the latest revealed line
    function scrollToLatestLine() {
        const codeViewer = document.getElementById('codeViewer');
        const lines = codeViewer.querySelectorAll('.highlight pre > span');
        
        if (lines.length > 0) {
            const lastLine = lines[lines.length - 1];
            const containerHeight = codeViewer.clientHeight;
            const lastLineOffset = lastLine.offsetTop;
            
            // Calculate position to show the last line in the middle of the container
            const scrollPosition = lastLineOffset - (containerHeight / 2) + lastLine.clientHeight;
            
            // Only scroll vertically
            codeViewer.scrollTo({
                top: scrollPosition,
                behavior: 'smooth'
            });
        }
    }

    // Update the display based on view mode
    async function updateDisplay() {
        const mode = viewMode.value;
        const lineCount = parseInt(linesCount.value);
        currentLineSpan.textContent = currentLineIndex + 1;

        let codeToShow = '';
        
        switch (mode) {
            case 'single':
                codeToShow = codeLines[currentLineIndex];
                break;
                
            case 'multi':
                const endIndex = Math.min(currentLineIndex + lineCount, codeLines.length);
                codeToShow = codeLines.slice(currentLineIndex, endIndex).join('\n');
                break;
                
            case 'incremental':
                // Get all lines up to current index that should be shown
                const linesToShow = [...displayedLines].sort((a, b) => a - b);
                codeToShow = linesToShow.map(i => codeLines[i]).join('\n');
                break;
        }

        const highlightedCode = await highlightCode(codeToShow, languageSelect.value);
        codeViewer.innerHTML = highlightedCode;
        
        // Scroll to the latest line after content update
        if (mode === 'incremental' || mode === 'single') {
            setTimeout(scrollToLatestLine, 100); // Small delay to ensure content is rendered
        }
    }

    // Display all lines
    async function displayAllLines() {
        const highlightedCode = await highlightCode(
            codeLines.join('\n'),
            languageSelect.value
        );
        codeViewer.innerHTML = highlightedCode;
        // Add all line indices to displayedLines
        displayedLines = new Set([...Array(codeLines.length).keys()]);
        currentLineIndex = codeLines.length - 1;
    }

    // Add keyboard navigation
    document.addEventListener('keydown', async (event) => {
        // Only handle keyboard navigation if code is loaded
        if (codeLines.length === 0) return;

        switch (event.key) {
            case 'ArrowRight':
                // Simulate next button click
                nextButton.click();
                break;
            case 'ArrowLeft':
                // Simulate previous button click
                prevButton.click();
                break;
        }
    });
});
document.addEventListener('DOMContentLoaded', () => {

    // =========================
    // ELEMENTS & STATE
    // =========================
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const analyzeBtn = document.getElementById('analyze-btn');
    const loadingOverlay = document.getElementById('loading-overlay');
    const errorMsg = document.getElementById('error-msg');

    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const heatmapContainer = document.getElementById('heatmap-container');

    const predClass = document.getElementById('pred-class');
    const predConfidence = document.getElementById('pred-confidence');
    const predRisk = document.getElementById('pred-risk');
    const predSeverity = document.getElementById('pred-severity');

    const aiInsightText = document.getElementById('ai-insight-text');
    const riskFactorsList = document.getElementById('risk-factors');
    const symptomsList = document.getElementById('symptoms-list');
    const nextStepsList = document.getElementById('next-steps');

    const navItems = document.querySelectorAll('.nav-item');
    const viewSections = document.querySelectorAll('.view-section');
    
    // History
    const historyTableBody = document.getElementById('history-table-body');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const histFilter = document.getElementById('hist-filter');
    const histSort = document.getElementById('hist-sort');

    // PDF
    const downloadPdfBtn = document.getElementById('download-pdf-btn');

    // Diagnostics
    const diagTime = document.getElementById('diag-time');
    const diagVersion = document.getElementById('diag-version');
    const diagRes = document.getElementById('diag-res');
    const diagHw = document.getElementById('diag-hw');

    let probChart, distChart, trendChart;

    // =========================
    // MEDICAL DICTIONARY
    // =========================
    const MEDICAL_DB = {
        "Glioma": {
            desc: "Gliomas are a type of tumor that occurs in the brain and spinal cord, beginning in the gluey supportive cells (glial cells) that surround nerve cells.",
            risks: ["Age (common in adults between 45-65)", "Radiation exposure", "Family history of glioma"],
            symptoms: ["Headaches (especially in the morning)", "Nausea or vomiting", "Confusion or decline in brain function", "Seizures"],
            tests: ["Neurological exam", "MRI (with contrast)", "Biopsy"],
            action: ["Immediate neurological consultation", "Consider neurosurgical evaluation", "Discuss radiation/chemotherapy options"]
        },
        "Meningioma": {
            desc: "Meningiomas are mostly noncancerous (benign) tumors that arise from the meninges — the membranes that surround your brain and spinal cord.",
            risks: ["Female gender (more common in women)", "Radiation exposure", "Inherited nervous system disorders"],
            symptoms: ["Changes in vision", "Headaches that worsen over time", "Hearing loss or ringing", "Memory loss"],
            tests: ["Detailed MRI/CT scans", "Vision and hearing tests"],
            action: ["Often requires 'wait-and-see' approach if small", "Surgical removal if symptomatic", "Regular scan intervals (e.g., 6-12 months)"]
        },
        "Pituitary": {
            desc: "Pituitary tumors are abnormal growths that develop in your pituitary gland. Most are benign adenomas that do not spread to other parts of the body.",
            risks: ["Genetic mutations (e.g., MEN 1)", "Family history (rare)"],
            symptoms: ["Over/under-production of hormones", "Vision loss (peripheral)", "Unexplained weight changes", "Fatigue"],
            tests: ["Blood and urine tests for hormone levels", "MRI of the brain focusing on pituitary", "Vision testing"],
            action: ["Endocrinologist referral", "Evaluate hormone replacement", "Consider transsphenoidal surgery"]
        },
        "None": {
            desc: "No distinct tumor mass detected. The brain structures appear within normal parameters based on the current AI model analysis.",
            risks: ["General age-related risk factors", "Lifestyle factors"],
            symptoms: ["None specifically indicated by the scan"],
            tests: ["Routine checkups", "Evaluate other causes if symptoms persist"],
            action: ["No immediate oncological action required", "Maintain regular health check-ups"]
        }
    };


    // =========================
    // INITIALIZATION
    // =========================
    initCharts();
    loadHistory();
    renderPlotlyCharts(); // Initial empty/dummy render

    // =========================
    // NAVIGATION
    // =========================
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetViewId = item.getAttribute('data-view');
            
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            viewSections.forEach(section => {
                if (section.id === targetViewId) {
                    section.classList.add('active-view');
                    if(targetViewId === 'analytics-view') {
                        // Resize plotly on view switch to prevent layout bugs
                        window.dispatchEvent(new Event('resize')); 
                    }
                } else {
                    section.classList.remove('active-view');
                }
            });
        });
    });

    // =========================
    // MAIN UPLOAD FLOW
    // =========================
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('dragover'); });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault(); dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFile(fileInput.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleFile(e.target.files[0]);
    });

    analyzeBtn.addEventListener('click', () => {
        if (fileInput.files.length) runAnalysis(fileInput.files[0]);
    });

    function handleFile(file) {
        errorMsg.textContent = '';
        if (!file.type.startsWith('image/')) {
            errorMsg.textContent = 'Please upload a valid image file.';
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            previewContainer.style.display = 'flex';
            analyzeBtn.disabled = false;
            resetDashboard();
        };
        reader.readAsDataURL(file);
    }

    function resetDashboard() {
        predClass.textContent = '--';
        predConfidence.textContent = '--%';
        predRisk.textContent = '--';
        predRisk.className = '';
        predSeverity.textContent = '--';
        heatmapContainer.innerHTML = '<span>Awaiting Analysis...</span>';
        
        aiInsightText.textContent = 'Upload an MRI scan to generate detailed insights.';
        riskFactorsList.innerHTML = '<li>--</li>';
        symptomsList.innerHTML = '<li>--</li>';
        nextStepsList.innerHTML = '<li>--</li>';
        downloadPdfBtn.disabled = true;

        if (probChart) { probChart.destroy(); probChart = null; }
    }

    async function runAnalysis(file) {
        loadingOverlay.style.display = 'flex';
        analyzeBtn.disabled = true;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/predict', { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Server error occurred');

            updateDashboard(data);
            saveToHistory(data);
            updatePlotlyChartsWithData(data);

        } catch (err) {
            console.error(err);
            errorMsg.textContent = err.message;
        } finally {
            loadingOverlay.style.display = 'none';
            analyzeBtn.disabled = false;
        }
    }

    // =========================
    // UPDATE DASHBOARD
    // =========================
    function updateDashboard(data) {
        // Predictions
        predClass.textContent = data.prediction;
        predConfidence.textContent = data.confidence + '%';
        predRisk.textContent = data.risk_level;
        predSeverity.textContent = data.severity;

        predRisk.className = '';
        if (data.risk_level === 'High') predRisk.classList.add('risk-high');
        else if (data.risk_level === 'Medium') predRisk.classList.add('risk-medium');
        else predRisk.classList.add('risk-low');

        // Heatmap
        if (data.heatmap_image) {
            heatmapContainer.innerHTML = `<img src="data:image/jpeg;base64,${data.heatmap_image}" alt="Heatmap" style="max-width: 100%; border-radius: 6px; max-height: 250px; object-fit: contain;">`;
        }

        updateProbabilityChart(data.probabilities);

        // Diagnostics
        if(data.diagnostics) {
            diagTime.textContent = data.diagnostics.inference_time_ms + " ms";
            diagVersion.textContent = data.diagnostics.model_version;
            diagRes.textContent = data.diagnostics.input_resolution;
            diagHw.textContent = data.diagnostics.hardware_status;
        }

        // Deep Insights (Medical DB)
        const info = MEDICAL_DB[data.prediction] || MEDICAL_DB['None'];
        aiInsightText.textContent = info.desc;
        
        riskFactorsList.innerHTML = info.risks.map(r => `<li>${r}</li>`).join('');
        symptomsList.innerHTML = info.symptoms.map(s => `<li>${s}</li>`).join('');
        nextStepsList.innerHTML = info.action.map(a => `<li>${a}</li>`).join('');

        downloadPdfBtn.disabled = false;
    }

    // =========================
    // PDF GENERATION
    // =========================
    downloadPdfBtn.addEventListener('click', () => {
        const element = document.getElementById('pdf-content-area');
        const opt = {
            margin:       10,
            filename:     `NeuroScan_Report_${new Date().getTime()}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        // Temporarily change styling for better PDF look if needed, but html2pdf usually handles it
        html2pdf().set(opt).from(element).save();
    });

    // =========================
    // COMPARISON VIEW LOGIC
    // =========================
    const setupComp = (idNum) => {
        const fileInput = document.getElementById(`comp-file-${idNum}`);
        const img = document.getElementById(`comp-img-${idNum}`);
        const btn = document.getElementById(`comp-btn-${idNum}`);
        const resDiv = document.getElementById(`comp-res-${idNum}`);

        fileInput.addEventListener('change', (e) => {
            if(e.target.files.length) {
                img.src = URL.createObjectURL(e.target.files[0]);
                img.style.display = 'block';
                btn.style.display = 'inline-block';
                resDiv.style.display = 'none';
            }
        });

        btn.addEventListener('click', async () => {
            btn.textContent = "Analyzing...";
            btn.disabled = true;
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            
            try {
                const res = await fetch('/predict', { method: 'POST', body: formData });
                const data = await res.json();
                
                document.getElementById(`comp-pred-${idNum}`).textContent = data.prediction;
                document.getElementById(`comp-conf-${idNum}`).textContent = data.confidence + "%";
                document.getElementById(`comp-heat-${idNum}`).innerHTML = `<img src="data:image/jpeg;base64,${data.heatmap_image}" style="width:100%; border-radius:6px;">`;
                resDiv.style.display = 'block';
                
            } catch(e) {
                alert("Error analyzing scan " + idNum);
            } finally {
                btn.textContent = "Analyze";
                btn.disabled = false;
                btn.style.display = 'none'; // hide analyze btn once done
            }
        });
    };
    setupComp(1);
    setupComp(2);

    // =========================
    // HISTORY FEATURE
    // =========================
    function saveToHistory(data) {
        let history = JSON.parse(localStorage.getItem('ns_history') || '[]');
        history.unshift({
            id: new Date().getTime(),
            timestamp: new Date().toLocaleString(),
            prediction: data.prediction,
            confidence: data.confidence,
            risk: data.risk_level
        });
        localStorage.setItem('ns_history', JSON.stringify(history));
        loadHistory();
    }

    function loadHistory() {
        let history = JSON.parse(localStorage.getItem('ns_history') || '[]');
        
        // Apply Filters
        const filterVal = histFilter.value;
        if(filterVal !== 'all') {
            history = history.filter(h => h.prediction === filterVal);
        }

        // Apply Sort
        const sortVal = histSort.value;
        history.sort((a, b) => {
            if(sortVal === 'date-desc') return b.id - a.id;
            if(sortVal === 'date-asc') return a.id - b.id;
            if(sortVal === 'conf-desc') return b.confidence - a.confidence;
            if(sortVal === 'conf-asc') return a.confidence - b.confidence;
        });

        if (history.length === 0) {
            historyTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem;">No matching history found.</td></tr>`;
            return;
        }

        historyTableBody.innerHTML = history.map(item => {
            let riskClass = item.risk === 'High' ? 'risk-high' : (item.risk === 'Medium' ? 'risk-medium' : 'risk-low');
            let confWidth = Math.max(0, Math.min(100, item.confidence));
            let color = '#38bdf8';
            if(item.prediction === 'Glioma') color = '#ef4444';
            if(item.prediction === 'Meningioma') color = '#f59e0b';
            
            return `
                <tr>
                    <td>${item.timestamp}</td>
                    <td><strong>${item.prediction}</strong></td>
                    <td>${item.confidence}%</td>
                    <td class="${riskClass}"><strong>${item.risk}</strong></td>
                    <td>
                        <div class="mini-bar-bg">
                            <div class="mini-bar-fill" style="width: ${confWidth}%; background: ${color}"></div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    histFilter.addEventListener('change', loadHistory);
    histSort.addEventListener('change', loadHistory);
    clearHistoryBtn.addEventListener('click', () => {
        localStorage.removeItem('ns_history');
        loadHistory();
    });

    // =========================
    // CHART.JS
    // =========================
    function updateProbabilityChart(probs) {
        const ctx = document.getElementById('probChart').getContext('2d');
        if (probChart) probChart.destroy();

        probChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(probs),
                datasets: [{
                    data: Object.values(probs),
                    backgroundColor: ['#38bdf8', '#10b981', '#f59e0b', '#ef4444'],
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { max: 100, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } }
            }
        });
    }

    function initCharts() {
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.font.family = 'Inter';

        distChart = new Chart(document.getElementById('distChart').getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['None', 'Meningioma', 'Glioma', 'Pituitary'],
                datasets: [{ data: [45, 20, 25, 10], backgroundColor: ['#38bdf8', '#10b981', '#f59e0b', '#ef4444'], borderColor: '#0f172a', borderWidth: 2 }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'right' } } }
        });

        const trendCanvas = document.getElementById('trendChart');
        if (trendCanvas) {
            trendChart = new Chart(trendCanvas.getContext('2d'), {
                type: 'line',
                data: {
                    labels: ['E10', 'E20', 'E30', 'E40', 'E50'],
                    datasets: [{
                        label: 'Training Acc', data: [75, 82, 88, 92, 96.5],
                        borderColor: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.1)', fill: true, tension: 0.4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' }, min: 60 } } }
            });
        }
    }

    // =========================
    // PLOTLY ADVANCED CHARTS
    // =========================
    function renderPlotlyCharts() {
        const layoutBase = {
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#94a3b8', family: 'Inter' },
            margin: { t: 20, b: 40, l: 40, r: 20 }
        };

        // 1. Histogram (Simulated distribution of past confidences)
        const histData = [{ x: Array.from({length: 100}, () => Math.random() * 40 + 60), type: 'histogram', marker: { color: '#38bdf8' } }];
        Plotly.newPlot('plotly-hist', histData, { ...layoutBase, xaxis: { title: 'Confidence %' } }, {displayModeBar: false});

        // 2. Box Plot (Confidence Spread per Class)
        const boxData = [
            { y: Array.from({length: 30}, () => Math.random() * 20 + 75), type: 'box', name: 'Mening.', marker: { color: '#10b981' } },
            { y: Array.from({length: 30}, () => Math.random() * 15 + 80), type: 'box', name: 'Glioma', marker: { color: '#ef4444' } },
            { y: Array.from({length: 30}, () => Math.random() * 10 + 85), type: 'box', name: 'Pituitary', marker: { color: '#f59e0b' } },
            { y: Array.from({length: 30}, () => Math.random() * 5 + 90), type: 'box', name: 'None', marker: { color: '#38bdf8' } }
        ];
        Plotly.newPlot('plotly-box', boxData, { ...layoutBase, showlegend: false }, {displayModeBar: false});

        // 3. Matrix Heatmap (Simulated Confusion Matrix)
        const matrixZ = [
            [95, 2, 3, 0],
            [1, 92, 4, 3],
            [2, 3, 90, 5],
            [0, 1, 2, 97]
        ];
        const classes = ['None', 'Mening.', 'Glioma', 'Pitu.'];
        const matrixData = [{ z: matrixZ, x: classes, y: classes, type: 'heatmap', colorscale: 'Blues' }];
        Plotly.newPlot('plotly-matrix', matrixData, { ...layoutBase, margin: {l: 60, b: 40, t: 20, r: 20} }, {displayModeBar: false});

        // 4. ROC Curve (Simulated Multiclass ROC)
        const rocData = [
            { x: [0, 0.1, 0.2, 0.4, 0.8, 1], y: [0, 0.8, 0.9, 0.95, 0.99, 1], type: 'scatter', mode: 'lines', name: 'Class 0' },
            { x: [0, 1], y: [0, 1], type: 'scatter', mode: 'lines', line: {dash: 'dash', color: '#555'}, showlegend: false }
        ];
        Plotly.newPlot('plotly-roc', rocData, { ...layoutBase, xaxis: { title: 'FPR' }, yaxis: { title: 'TPR' }, showlegend: true, legend: {x: 0.8, y: 0.2} }, {displayModeBar: false});
    }

    // Called on new prediction to simulate data updates
    function updatePlotlyChartsWithData(data) {
        // Here we could dynamically push the new prediction into the Plotly trace.
        // For the demo, simply re-rendering the base layout guarantees it looks active.
        renderPlotlyCharts();
    }

});
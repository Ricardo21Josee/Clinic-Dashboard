// --------------------------------------------------------
// Medical Clinic Dashboard
// Dashboard de Clínica Médica
// Author / Autor: Ricardo Márquez
// GitHub: https://github.com/Ricardo21Josee
// LinkedIn: https://www.linkedin.com/in/ric21marquez
// Instagram: @mar_quez_g
// Threads: @mar_quez_g
// Email: josemarquez21garcia@gmail.com
// --------------------------------------------------------

/**
 * Módulo principal de la aplicación / Main application module
 * Maneja la inicialización y coordinación de todos los componentes / Handles initialization and coordination of all components
 */
const App = (() => {
    // Configuración de la API / API configuration
    const API_URL = 'https://fedskillstest.coalitiontechnologies.workers.dev';
    const API_CREDENTIALS = {
        username: 'coalition',
        password: 'skills-test'
    };
    
    // Estado de la aplicación / Application state
    let state = {
        patient: null,
        bpChart: null
    };
    
    // Elementos del DOM / DOM elements
    const elements = {
        patientName: document.getElementById('patient-name'),
        patientId: document.getElementById('patient-id'),
        patientDob: document.getElementById('patient-dob'),
        patientGender: document.getElementById('patient-gender'),
        patientPhone: document.getElementById('patient-phone'),
        patientEmergencyContact: document.getElementById('patient-emergency-contact'),
        patientInsurance: document.getElementById('patient-insurance'),
        patientAvatar: document.querySelector('.patient-avatar img'),
        systolicValue: document.getElementById('current-systolic'),
        diastolicValue: document.getElementById('current-diastolic'),
        heartRateValue: document.getElementById('current-heart-rate'),
        bpStatus: document.getElementById('bp-status'),
        hrStatus: document.getElementById('hr-status'),
        diagnosesContainer: document.getElementById('diagnoses-container'),
        avgSystolic: document.getElementById('avgSystolic'),
        avgDiastolic: document.getElementById('avgDiastolic'),
        lastReading: document.getElementById('lastReading'),
        timeRangeSelect: document.getElementById('timeRange'),
        exportChartBtn: document.getElementById('exportChart')
    };
    
    /**
     * Codifica las credenciales para Basic Auth / Encodes credentials for Basic Auth
     */
    const encodeCredentials = () => {
        const credentials = `${API_CREDENTIALS.username}:${API_CREDENTIALS.password}`;
        return btoa(credentials);
    };
    
    /**
     * Maneja errores de la aplicación / Handles application errors
     * @param {Error} error - Objeto de error / Error object
     * @param {string} context - Contexto donde ocurrió el error / Context where the error occurred
     */
    const handleError = (error, context = '') => {
        console.error(`Error${context ? ` en ${context}` : ''}:`, error);
        
        // Mostrar notificación al usuario / Show notification to user
        const errorEl = document.createElement('div');
        errorEl.className = 'error-notification';
        errorEl.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>Error${context ? ` en ${context}` : ''}: ${error.message}</span>
        `;
        
        document.querySelector('.main-content').prepend(errorEl);
        
        // Eliminar después de 5 segundos / Remove after 5 seconds
        setTimeout(() => {
            errorEl.remove();
        }, 5000);
    };
    
    /**
     * Formatea una fecha en formato legible / Formats a date to a readable format
     * @param {string} dateString - Fecha en formato ISO o similar / Date in ISO or similar format
     * @returns {string} Fecha formateada / Formatted date
     */
    const formatDate = (dateString) => {
        try {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return new Date(dateString).toLocaleDateString('en-US', options);
        } catch (error) {
            handleError(error, 'formatear fecha');
            return dateString; // Devolver el valor original si falla el formateo / Return original value if formatting fails
        }
    };
    
    /**
     * Obtiene el icono correspondiente para un tipo de prueba de laboratorio
     * Gets the corresponding icon for a lab test type
     * @param {string} labTest - Nombre de la prueba / Test name
     * @returns {string} Clase de icono de FontAwesome / FontAwesome icon class
     */
    const getLabIcon = (labTest) => {
        const iconMap = {
            'Blood Tests': 'fa-tint',
            'CT Scans': 'fa-procedures',
            'X-Rays': 'fa-x-ray',
            'Urine Test': 'fa-vial',
            'Radiology Reports': 'fa-file-medical-alt'
        };
        return iconMap[labTest] || 'fa-flask';
    };
    
    /**
     * Actualiza el indicador de estado (normal, alto, bajo)
     * Updates the status indicator (normal, high, low)
     * @param {HTMLElement} element - Elemento DOM a actualizar / DOM element to update
     * @param {number} value - Valor a evaluar / Value to evaluate
     * @param {object} thresholds - Umbrales para high y low / Thresholds for high and low
     */
    const updateStatusIndicator = (element, value, thresholds) => {
        if (!element) return;
        
        let status, className;
        
        if (value > thresholds.high) {
            status = 'High';
            className = 'status-danger';
        } else if (value < thresholds.low) {
            status = 'Low';
            className = 'status-warning';
        } else {
            status = 'Normal';
            className = 'status-normal';
        }
        
        element.textContent = status;
        element.className = `status-badge ${className}`;
    };
    
    /**
     * Actualiza la información del paciente en la UI
     * Updates patient information in the UI
     * @param {object} patientData - Datos del paciente / Patient data
     */
    const updatePatientInfo = (patientData) => {
        try {
            // Actualizar datos básicos / Update basic data
            elements.patientName.textContent = patientData.name;
            elements.patientId.textContent = `ID: PT-${patientData.date_of_birth.replace(/-/g, '').substring(2)}`;
            elements.patientDob.textContent = formatDate(patientData.date_of_birth);
            elements.patientGender.textContent = patientData.gender;
            
            // Actualizar información de contacto / Update contact info
            elements.patientPhone.textContent = patientData.phone_number;
            elements.patientEmergencyContact.textContent = patientData.emergency_contact;
            elements.patientInsurance.textContent = patientData.insurance_type;
            
            // Actualizar avatar si está disponible / Update avatar if available
            if (patientData.profile_picture && elements.patientAvatar) {
                elements.patientAvatar.src = patientData.profile_picture;
                elements.patientAvatar.alt = patientData.name;
            }
            
            // Calcular y mostrar edad / Calculate and show age
            if (patientData.date_of_birth) {
                try {
                    const birthDate = new Date(patientData.date_of_birth);
                    const ageDiff = Date.now() - birthDate.getTime();
                    const ageDate = new Date(ageDiff);
                    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
                    document.getElementById('patient-age').textContent = age;
                } catch (e) {
                    console.error('Error calculando edad:', e);
                }
            }
            
        } catch (error) {
            handleError(error, 'actualizar información del paciente');
        }
    };
    
    /**
     * Actualiza el historial de diagnóstico en la UI
     * Updates diagnosis history in the UI
     * @param {Array} history - Array de entradas de diagnóstico / Array of diagnosis entries
     */
    const updateDiagnosisHistory = (history) => {
        if (!history || history.length === 0) return;
        
        try {
            const latest = history[0]; // La entrada más reciente / Most recent entry
            
            // Actualizar valores de presión arterial / Update blood pressure values
            if (latest.blood_pressure) {
                elements.systolicValue.textContent = latest.blood_pressure.systolic.value;
                elements.diastolicValue.textContent = latest.blood_pressure.diastolic.value;
                
                updateStatusIndicator(
                    elements.bpStatus,
                    latest.blood_pressure.systolic.value,
                    { high: 140, low: 90 }
                );
            }
            
            // Actualizar frecuencia cardíaca / Update heart rate
            if (latest.heart_rate) {
                elements.heartRateValue.textContent = latest.heart_rate.value;
                
                updateStatusIndicator(
                    elements.hrStatus,
                    latest.heart_rate.value,
                    { high: 100, low: 60 }
                );
            }
            
        } catch (error) {
            handleError(error, 'actualizar historial de diagnóstico');
        }
    };
    
    /**
     * Actualiza la lista de diagnósticos en la UI
     * Updates the diagnoses list in the UI
     * @param {Array} diagnoses - Array de diagnósticos / Array of diagnoses
     */
    const updateDiagnoses = (diagnoses) => {
        if (!elements.diagnosesContainer) return;
        
        try {
            elements.diagnosesContainer.innerHTML = '';
            
            if (!diagnoses || diagnoses.length === 0) {
                elements.diagnosesContainer.innerHTML = '<p class="no-data">No active diagnoses found</p>';
                return;
            }
            
            // Filtrar solo diagnósticos activos / Filter only active diagnoses
            const activeDiagnoses = diagnoses.filter(d => 
                !d.status.toLowerCase().includes('inactive') && 
                !d.status.toLowerCase().includes('resolved')
            );
            
            if (activeDiagnoses.length === 0) {
                elements.diagnosesContainer.innerHTML = '<p class="no-data">No active diagnoses found</p>';
                return;
            }
            
            // Crear elementos para cada diagnóstico / Create elements for each diagnosis
            activeDiagnoses.forEach(diagnosis => {
                const status = diagnosis.status.toLowerCase().replace(/\s+/g, '-');
                const diagnosisEl = document.createElement('div');
                diagnosisEl.className = `diagnostic-item ${status}`;
                
                diagnosisEl.innerHTML = `
                    <h3>${diagnosis.name}</h3>
                    <p>${diagnosis.description}</p>
                    <span class="status-badge">${diagnosis.status}</span>
                `;
                
                elements.diagnosesContainer.appendChild(diagnosisEl);
            });
            
        } catch (error) {
            handleError(error, 'actualizar diagnósticos');
        }
    };
    
    /**
     * Actualiza los resultados de laboratorio en la UI
     * Updates lab results in the UI
     * @param {Array} labResults - Array de resultados de laboratorio / Array of lab results
     */
    const updateLabResults = (labResults) => {
        const labContainer = document.querySelector('.lab-results');
        if (!labContainer) return;
        
        try {
            if (!labResults || labResults.length === 0) {
                labContainer.innerHTML = `
                    <h2><i class="fas fa-flask"></i> Lab Results</h2>
                    <p class="no-data">No lab results available</p>
                `;
                return;
            }
            
            labContainer.innerHTML = `
                <h2><i class="fas fa-flask"></i> Lab Results</h2>
                <div class="lab-grid">
                    ${labResults.map(result => `
                        <div class="lab-item">
                            <i class="fas ${getLabIcon(result)}"></i>
                            ${result}
                        </div>
                    `).join('')}
                </div>
            `;
            
        } catch (error) {
            handleError(error, 'actualizar resultados de laboratorio');
        }
    };
    
    /**
     * Convierte el nombre de un mes a su número correspondiente
     * Converts a month name to its corresponding number
     * @param {string} monthName - Nombre del mes / Month name
     * @returns {string} Número del mes (01-12) / Month number (01-12)
     */
    const getMonthNumber = (monthName) => {
        const months = {
            'January': '01', 'February': '02', 'March': '03', 'April': '04',
            'May': '05', 'June': '06', 'July': '07', 'August': '08',
            'September': '09', 'October': '10', 'November': '11', 'December': '12'
        };
        return months[monthName] || '01';
    };
    
    /**
     * Exporta el gráfico como imagen PNG
     * Exports the chart as a PNG image
     */
    const exportChartAsPNG = () => {
        try {
            if (!state.bpChart) {
                throw new Error('No chart available to export');
            }
            
            const link = document.createElement('a');
            link.download = `blood-pressure-${new Date().toISOString().split('T')[0]}.png`;
            link.href = document.getElementById('bloodPressureChart').toDataURL('image/png');
            link.click();
            
            // Mostrar notificación de éxito / Show success notification
            const notification = document.createElement('div');
            notification.className = 'notification success';
            notification.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <span>Chart exported successfully</span>
            `;
            document.body.appendChild(notification);
            
            setTimeout(() => notification.remove(), 3000);
            
        } catch (error) {
            handleError(error, 'exportar gráfico');
        }
    };
    
    /**
     * Maneja el cambio en el selector de rango de tiempo
     * Handles the change in the time range selector
     * @param {Event} event - Evento de cambio / Change event
     */
    const handleTimeRangeChange = (event) => {
        try {
            const range = event.target.value;
            console.log('Time range changed to:', range);
            
            // Aquí implementarías la lógica para cambiar el rango de tiempo
            // Here you would implement logic to change the time range
            
            if (state.patient && state.patient.diagnosis_history) {
                let filteredData = [...state.patient.diagnosis_history];
                
                // Simular filtrado por rango de tiempo / Simulate filtering by time range
                if (range === 'yearly') {
                    // Agrupar por año / Group by year
                    const yearlyData = {};
                    state.patient.diagnosis_history.forEach(entry => {
                        const year = entry.year || new Date(entry.date).getFullYear();
                        if (!yearlyData[year]) {
                            yearlyData[year] = {
                                ...entry,
                                month: 'Annual',
                                blood_pressure: {
                                    systolic: { value: 0, count: 0 },
                                    diastolic: { value: 0, count: 0 }
                                }
                            };
                        }
                        
                        yearlyData[year].blood_pressure.systolic.value += entry.blood_pressure.systolic.value;
                        yearlyData[year].blood_pressure.systolic.count++;
                        yearlyData[year].blood_pressure.diastolic.value += entry.blood_pressure.diastolic.value;
                        yearlyData[year].blood_pressure.diastolic.count++;
                    });
                    
                    // Calcular promedios / Calculate averages
                    filteredData = Object.values(yearlyData).map(entry => ({
                        ...entry,
                        blood_pressure: {
                            systolic: { 
                                value: Math.round(entry.blood_pressure.systolic.value / entry.blood_pressure.systolic.count),
                                levels: entry.blood_pressure.systolic.levels
                            },
                            diastolic: { 
                                value: Math.round(entry.blood_pressure.diastolic.value / entry.blood_pressure.diastolic.count),
                                levels: entry.blood_pressure.diastolic.levels
                            }
                        }
                    }));
                }
                
                renderBloodPressureChart(filteredData);
            }
            
        } catch (error) {
            handleError(error, 'cambiar rango de tiempo');
        }
    };
    
    /**
     * Renderiza el gráfico de presión arterial
     * Renders the blood pressure chart
     * @param {Array} historyData - Datos históricos de presión arterial / Blood pressure history data
     */
    const renderBloodPressureChart = (historyData) => {
        if (!historyData || historyData.length < 2) {
            document.querySelector('.chart-container').innerHTML = `
                <div class="chart-header">
                    <h3><i class="fas fa-heartbeat"></i> Blood Pressure History</h3>
                </div>
                <div class="no-chart-data">
                    <i class="fas fa-chart-line"></i>
                    <p>Insufficient data to display chart</p>
                </div>
            `;
            return;
        }
        
        try {
            const ctx = document.getElementById('bloodPressureChart').getContext('2d');
            
            // Procesar datos para el gráfico / Process data for the chart
            const labels = historyData.map(entry => {
                try {
                    const date = new Date(entry.date || `${entry.year}-${getMonthNumber(entry.month)}-01`);
                    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                } catch (e) {
                    return `${entry.month} ${entry.year}`;
                }
            });
            
            const systolicData = historyData.map(entry => entry.blood_pressure.systolic.value);
            const diastolicData = historyData.map(entry => entry.blood_pressure.diastolic.value);
            
            // Calcular promedios / Calculate averages
            const avgSystolic = (systolicData.reduce((a, b) => a + b, 0) / systolicData.length);
            const avgDiastolic = (diastolicData.reduce((a, b) => a + b, 0) / diastolicData.length);
            
            // Actualizar resumen / Update summary
            elements.avgSystolic.textContent = `${avgSystolic.toFixed(1)} mmHg`;
            elements.avgDiastolic.textContent = `${avgDiastolic.toFixed(1)} mmHg`;
            elements.lastReading.textContent = 
                `${systolicData[systolicData.length-1]}/${diastolicData[diastolicData.length-1]} mmHg`;
            
            // Configuración del gráfico / Chart configuration
            const chartConfig = {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Systolic (mmHg)',
                            data: systolicData,
                            borderColor: 'var(--chart-systolic)',
                            backgroundColor: 'rgba(231, 76, 60, 0.1)',
                            borderWidth: 2,
                            tension: 0.1,
                            fill: true,
                            pointBackgroundColor: 'var(--chart-systolic)',
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            pointHitRadius: 10,
                            borderJoinStyle: 'round',
                            borderCapStyle: 'round'
                        },
                        {
                            label: 'Diastolic (mmHg)',
                            data: diastolicData,
                            borderColor: 'var(--chart-diastolic)',
                            backgroundColor: 'rgba(52, 152, 219, 0.1)',
                            borderWidth: 2,
                            tension: 0.1,
                            fill: true,
                            pointBackgroundColor: 'var(--chart-diastolic)',
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            pointHitRadius: 10,
                            borderJoinStyle: 'round',
                            borderCapStyle: 'round'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 20,
                                font: {
                                    size: 13,
                                    family: 'Roboto, sans-serif'
                                },
                                color: 'var(--black)'
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0, 0, 0, 0.85)',
                            titleFont: {
                                size: 14,
                                weight: 'bold',
                                family: 'Roboto, sans-serif'
                            },
                            bodyFont: {
                                size: 12,
                                family: 'Roboto, sans-serif'
                            },
                            padding: 12,
                            cornerRadius: 6,
                            displayColors: true,
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.parsed.y} mmHg`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            min: Math.max(50, Math.floor(Math.min(...diastolicData) / 10) * 10 - 10),
                            max: Math.min(200, Math.ceil(Math.max(...systolicData) / 10) * 10 + 10),
                            title: {
                                display: true,
                                text: 'mmHg',
                                font: {
                                    weight: 'bold',
                                    family: 'Roboto, sans-serif'
                                },
                                color: 'var(--dark-gray)'
                            },
                            grid: {
                                color: 'var(--chart-grid)',
                                drawBorder: false
                            },
                            ticks: {
                                color: 'var(--dark-gray)'
                            }
                        },
                        x: {
                            grid: {
                                display: false,
                                drawBorder: false
                            },
                            ticks: {
                                color: 'var(--dark-gray)'
                            }
                        }
                    },
                    interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false
                    },
                    animation: {
                        duration: 1000,
                        easing: 'easeOutQuart'
                    },
                    elements: {
                        line: {
                            cubicInterpolationMode: 'monotone'
                        }
                    }
                }
            };
            
            // Crear o actualizar el gráfico / Create or update the chart
            if (state.bpChart) {
                state.bpChart.data.labels = labels;
                state.bpChart.data.datasets[0].data = systolicData;
                state.bpChart.data.datasets[1].data = diastolicData;
                state.bpChart.update();
            } else {
                state.bpChart = new Chart(ctx, chartConfig);
            }
            
        } catch (error) {
            handleError(error, 'renderizar gráfico de presión arterial');
        }
    };
    
    /**
     * Carga los datos del paciente desde la API
     * Loads patient data from the API
     */
    const loadPatientData = async () => {
        try {
            // Mostrar estado de carga / Show loading state
            document.querySelector('.main-content').insertAdjacentHTML('afterbegin', `
                <div class="loading-overlay">
                    <div class="loading-spinner">
                        <i class="fas fa-circle-notch fa-spin"></i>
                        <span>Loading patient data...</span>
                    </div>
                </div>
            `);
            
            const response = await fetch(API_URL, {
                headers: {
                    'Authorization': `Basic ${encodeCredentials()}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Filtrar solo Jessica Taylor / Filter only Jessica Taylor
            const jessica = Array.isArray(data) ? 
                data.find(patient => patient.name === 'Jessica Taylor') : 
                data;
            
            if (!jessica) {
                throw new Error('Jessica Taylor data not found in response');
            }
            
            // Actualizar el estado de la aplicación / Update application state
            state.patient = jessica;
            
            // Actualizar la UI / Update UI
            updatePatientInfo(jessica);
            updateDiagnosisHistory(jessica.diagnosis_history);
            updateDiagnoses(jessica.diagnostic_list);
            updateLabResults(jessica.lab_results);
            renderBloodPressureChart(jessica.diagnosis_history);
            
        } catch (error) {
            handleError(error, 'cargar datos del paciente');
        } finally {
            // Ocultar estado de carga / Hide loading state
            const loadingOverlay = document.querySelector('.loading-overlay');
            if (loadingOverlay) loadingOverlay.remove();
        }
    };
    
    /**
     * Inicializa la aplicación / Initializes the application
     */
    const init = () => {
        // Configurar event listeners / Set up event listeners
        if (elements.timeRangeSelect) {
            elements.timeRangeSelect.addEventListener('change', handleTimeRangeChange);
        }
        
        if (elements.exportChartBtn) {
            elements.exportChartBtn.addEventListener('click', exportChartAsPNG);
        }
        
        // Cargar datos iniciales / Load initial data
        loadPatientData();
        
        // Configurar recarga automática cada 5 minutos (opcional)
        // Set up auto-reload every 5 minutes (optional)
        setInterval(loadPatientData, 5 * 60 * 1000);
    };
    
    // Exponer métodos públicos / Expose public methods
    return {
        init,
        reloadData: loadPatientData
    };
})();

// Iniciar la aplicación cuando el DOM esté listo
// Start the application when the DOM is ready
document.addEventListener('DOMContentLoaded', App.init);
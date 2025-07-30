/**
 * Enhanced Simulation Data Export for CircuitJS1
 * 
 * This file provides comprehensive simulation data export functionality
 * that captures all simulation results, errors, and nodal values for
 * external analysis and automatic circuit correction.
 */

// Global simulation data export interface
window.CircuitJS1SimulationExport = {
    
    // Export complete simulation data as JSON
    exportCompleteSimulationData: function() {
        if (!window.CircuitJS1) {
            console.error('CircuitJS1 not available');
            return null;
        }
        
        try {
            const data = window.CircuitJS1.exportSimulationData();
            return JSON.parse(data);
        } catch (error) {
            console.error('Error exporting simulation data:', error);
            return null;
        }
    },
    
    // Get simulation state only
    getSimulationState: function() {
        if (!window.CircuitJS1) return null;
        try {
            const state = window.CircuitJS1.getSimulationState();
            return JSON.parse(state);
        } catch (error) {
            console.error('Error getting simulation state:', error);
            return null;
        }
    },
    
    // Get error state only
    getErrorState: function() {
        if (!window.CircuitJS1) return null;
        try {
            const errors = window.CircuitJS1.getErrorState();
            return JSON.parse(errors);
        } catch (error) {
            console.error('Error getting error state:', error);
            return null;
        }
    },
    
    // Get node voltages only
    getNodeVoltages: function() {
        if (!window.CircuitJS1) return null;
        try {
            const nodes = window.CircuitJS1.getNodeVoltages();
            return JSON.parse(nodes);
        } catch (error) {
            console.error('Error getting node voltages:', error);
            return null;
        }
    },
    
    // Get element data only
    getElementData: function() {
        if (!window.CircuitJS1) return null;
        try {
            const elements = window.CircuitJS1.getElementData();
            return JSON.parse(elements);
        } catch (error) {
            console.error('Error getting element data:', error);
            return null;
        }
    },
    
    // Get validation results only
    getValidationResults: function() {
        if (!window.CircuitJS1) return null;
        try {
            const validation = window.CircuitJS1.getValidationResults();
            return JSON.parse(validation);
        } catch (error) {
            console.error('Error getting validation results:', error);
            return null;
        }
    },
    
    // Analyze simulation data for common issues
    analyzeSimulationIssues: function() {
        const data = this.exportCompleteSimulationData();
        if (!data) return null;
        
        const issues = {
            errors: [],
            warnings: [],
            suggestions: []
        };
        
        // Check for simulation errors
        if (data.errorState && data.errorState.hasErrors) {
            issues.errors.push({
                type: 'simulation_error',
                message: data.errorState.stopMessage || 'Unknown simulation error',
                severity: 'critical'
            });
        }
        
        // Check for matrix issues
        if (data.errorState && data.errorState.matrixSingular) {
            issues.errors.push({
                type: 'matrix_singular',
                message: 'Circuit matrix is singular - check for floating nodes or short circuits',
                severity: 'critical'
            });
        }
        
        // Check for convergence issues
        if (data.errorState && data.errorState.convergenceFailed) {
            issues.warnings.push({
                type: 'convergence_failed',
                message: 'Simulation failed to converge - check for nonlinear components or time step',
                severity: 'high'
            });
        }
        
        // Check for validation issues
        if (data.validationResults) {
            if (!data.validationResults.hasGround) {
                issues.errors.push({
                    type: 'no_ground',
                    message: 'Circuit has no ground reference - add a ground node',
                    severity: 'critical'
                });
            }
            
            if (data.validationResults.unconnectedNodes > 0) {
                issues.warnings.push({
                    type: 'unconnected_nodes',
                    message: `Found ${data.validationResults.unconnectedNodes} unconnected nodes`,
                    severity: 'medium'
                });
            }
        }
        
        // Check for element-specific issues
        if (data.elementData && data.elementData.data) {
            data.elementData.data.forEach((element, index) => {
                // Check for zero resistance
                if (element.elementData && element.elementData.resistance === 0) {
                    issues.errors.push({
                        type: 'zero_resistance',
                        message: `Element ${index} (${element.type}) has zero resistance`,
                        severity: 'critical'
                    });
                }
                
                // Check for infinite current
                if (Math.abs(element.current) > 1e6) {
                    issues.warnings.push({
                        type: 'high_current',
                        message: `Element ${index} (${element.type}) has very high current: ${element.current}A`,
                        severity: 'medium'
                    });
                }
                
                // Check for voltage issues
                if (Math.abs(element.voltageDiff) > 1000) {
                    issues.warnings.push({
                        type: 'high_voltage',
                        message: `Element ${index} (${element.type}) has very high voltage: ${element.voltageDiff}V`,
                        severity: 'medium'
                    });
                }
            });
        }
        
        return issues;
    },
    
    // Generate circuit correction suggestions
    generateCorrectionSuggestions: function() {
        const issues = this.analyzeSimulationIssues();
        if (!issues) return null;
        
        const suggestions = [];
        
        issues.errors.forEach(error => {
            switch (error.type) {
                case 'no_ground':
                    suggestions.push({
                        action: 'add_ground',
                        description: 'Add a ground node to the circuit',
                        circuitModification: 'g 100 100 100 120 0'
                    });
                    break;
                    
                case 'matrix_singular':
                    suggestions.push({
                        action: 'check_connections',
                        description: 'Check for floating nodes or short circuits',
                        circuitModification: null
                    });
                    break;
                    
                case 'zero_resistance':
                    suggestions.push({
                        action: 'add_resistance',
                        description: 'Add resistance to prevent short circuit',
                        circuitModification: 'r 100 100 200 100 0 1000'
                    });
                    break;
            }
        });
        
        return suggestions;
    },
    
    // Monitor simulation in real-time
    startSimulationMonitoring: function(callback, interval = 1000) {
        if (!window.CircuitJS1) {
            console.error('CircuitJS1 not available');
            return null;
        }
        
        const monitor = setInterval(() => {
            const data = this.exportCompleteSimulationData();
            if (data && callback) {
                callback(data);
            }
        }, interval);
        
        return monitor;
    },
    
    // Stop simulation monitoring
    stopSimulationMonitoring: function(monitorId) {
        if (monitorId) {
            clearInterval(monitorId);
        }
    },
    
    // Export simulation data to external system
    exportToExternalSystem: function(url, data) {
        return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
    }
};

// Auto-initialize when CircuitJS1 is loaded
window.addEventListener('load', function() {
    console.log('CircuitJS1 Simulation Export: Initializing...');
    
    // Wait for CircuitJS1 to be available
    const checkCircuitJS = setInterval(() => {
        if (window.CircuitJS1) {
            clearInterval(checkCircuitJS);
            console.log('CircuitJS1 Simulation Export interface ready');
            
            // Test the interface
            try {
                const testData = window.CircuitJS1SimulationExport.exportCompleteSimulationData();
                console.log('Simulation export test successful:', testData ? 'Data available' : 'No data');
            } catch (error) {
                console.error('Simulation export test failed:', error);
            }
            
            // Set up automatic error detection
            if (window.CircuitJS1.onupdate) {
                const originalUpdate = window.CircuitJS1.onupdate;
                window.CircuitJS1.onupdate = function(sim) {
                    // Call original update function
                    if (originalUpdate) originalUpdate(sim);
                    
                    // Check for errors automatically
                    try {
                        const issues = window.CircuitJS1SimulationExport.analyzeSimulationIssues();
                        if (issues && (issues.errors.length > 0 || issues.warnings.length > 0)) {
                            console.warn('Simulation issues detected:', issues);
                            
                            // Trigger custom event for external listeners
                            window.dispatchEvent(new CustomEvent('circuitjs-simulation-issues', {
                                detail: issues
                            }));
                        }
                    } catch (error) {
                        console.error('Error in automatic issue detection:', error);
                    }
                };
            }
        }
    }, 100);
    
    // Timeout after 10 seconds
    setTimeout(() => {
        if (!window.CircuitJS1) {
            console.error('CircuitJS1 not available after 10 seconds');
        }
    }, 10000);
});

// Add postMessage handler for simulation data export
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'exportSimulationData') {
        if (window.CircuitJS1SimulationExport) {
            const simulationData = window.CircuitJS1SimulationExport.exportCompleteSimulationData();
            const issues = window.CircuitJS1SimulationExport.analyzeSimulationIssues();
            const suggestions = window.CircuitJS1SimulationExport.generateCorrectionSuggestions
                ? window.CircuitJS1SimulationExport.generateCorrectionSuggestions()
                : [];
            event.source.postMessage(
                { type: 'simulationDataExport', data: { simulationData, issues, suggestions } },
                '*'
            );
        } else {
            event.source.postMessage({ type: 'simulationDataExport', error: 'Simulation export not available' }, '*');
        }
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.CircuitJS1SimulationExport;
} 
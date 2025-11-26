// Generalized Routh-Hurwitz Algorithm Implementation in JavaScript
// Based on Algorithm 1 from Hastir & Muolo (2023)

// Use math.js for symbolic computation
const math = window.math;

// Initialize input fields based on degree
function generateInputFields() {
    const degree = parseInt(document.getElementById('degree').value);
    const container = document.getElementById('coefficientInputs');
    container.innerHTML = '';
    
    for (let k = degree; k >= 1; k--) {
        const coeffGroup = document.createElement('div');
        coeffGroup.className = 'coeff-group';
        
        const title = document.createElement('div');
        title.className = 'coeff-title';
        title.innerHTML = `Coefficient of s<sup>${k}</sup>`;
        
        const realLabel = document.createElement('label');
        realLabel.textContent = `Real part (a${k}):`;
        const realInput = document.createElement('input');
        realInput.type = 'text';
        realInput.id = `a${k}`;
        realInput.placeholder = 'e.g., 2, k*w, 0';
        realInput.value = '0';
        
        const imagLabel = document.createElement('label');
        imagLabel.textContent = `Imaginary part (b${k}):`;
        const imagInput = document.createElement('input');
        imagInput.type = 'text';
        imagInput.id = `b${k}`;
        imagInput.placeholder = 'e.g., 0, 2*G, -1';
        imagInput.value = '0';
        
        coeffGroup.appendChild(title);
        coeffGroup.appendChild(realLabel);
        coeffGroup.appendChild(realInput);
        coeffGroup.appendChild(imagLabel);
        coeffGroup.appendChild(imagInput);
        
        container.appendChild(coeffGroup);
    }
}

// Load example 1: Simple n=2 case
function loadExample1() {
    document.getElementById('degree').value = 2;
    generateInputFields();
    document.getElementById('a2').value = '1';
    document.getElementById('b2').value = '0';
    document.getElementById('a1').value = '2';
    document.getElementById('b1').value = '1';
}

// Load example 2: n=3 symbolic case from paper
function loadExample2() {
    document.getElementById('degree').value = 3;
    generateInputFields();
    document.getElementById('a3').value = '2*k*w';
    document.getElementById('b3').value = '2*G';
    document.getElementById('a2').value = 'w^2 - G^2 - P';
    document.getElementById('b2').value = '0';
    document.getElementById('a1').value = '0';
    document.getElementById('b1').value = '-ki';
}

// Clear all inputs
function clearAll() {
    generateInputFields();
}

// Parse input to math.js expression
function parseInput(value) {
    if (value.trim() === '') return math.parse('0');
    try {
        // Replace ^ with ** for power (but math.js handles ^ too)
        return math.parse(value);
    } catch (e) {
        throw new Error(`Invalid expression: ${value}`);
    }
}

// Initialize the A and B tables
function initialize(n, A, B, a, b) {
    // ROW ZERO: polynomial coefficients
    for (let k = 1; k <= n; k++) {
        A[[0, k]] = a[k];
        B[[0, k]] = b[k];
    }
    
    // FIRST ROW: a_1, b_2, a_3, b_4, ..., a_{n-1}, b_n
    for (let k = 1; k <= n; k++) {
        if (k % 2 === 1) {  // Odd k: a
            A[[1, k]] = a[k];
        } else {  // Even k: b
            B[[1, k]] = b[k];
        }
    }
    
    // n EVEN
    if (n % 2 === 0) {
        for (let k = 1; k <= n; k++) {
            if (k % 2 === 1) {  // Odd k
                const term1 = math.multiply(A[[1, 1]], B[[0, k]]);
                const term2 = k < n ? B[[0, k + 1]] : math.parse('0');
                B[[1, k]] = math.subtract(term1, term2);
            } else {  // Even k
                const term1 = math.multiply(A[[1, 1]], A[[0, k]]);
                if (k < n) {
                    A[[1, k]] = math.subtract(term1, A[[1, k + 1]]);
                } else {
                    A[[1, n]] = term1;
                }
            }
        }
    } else {  // n ODD
        for (let k = 1; k <= n; k++) {
            if (k % 2 === 1) {  // Odd k
                const term1 = math.multiply(A[[1, 1]], B[[0, k]]);
                if (k < n) {
                    B[[1, k]] = math.subtract(term1, B[[0, k + 1]]);
                } else {
                    B[[1, n]] = term1;
                }
            } else {  // Even k
                const term1 = math.multiply(A[[1, 1]], A[[0, k]]);
                A[[1, k]] = math.subtract(term1, A[[1, k + 1]]);
            }
        }
    }
    
    return [A, B];
}

// Algorithm for even n
function n_even(n, a, b) {
    let A = {};
    let B = {};
    
    [A, B] = initialize(n, A, B, a, b);
    
    for (let p = 2; p < n; p++) {
        if (p % 2 === 0) {
            for (let k = p; k <= n; k += 2) {
                const term1 = math.multiply(A[[p-1, p-1]], A[[p-1, k]]);
                const term2 = math.multiply(B[[p-1, p-1]], B[[p-1, k]]);
                A[[p, k]] = math.add(term1, term2);
            }
            
            for (let l = p + 1; l < n; l += 2) {
                const term1 = math.multiply(A[[p-1, p-1]], B[[p-1, l]]);
                const term2 = math.multiply(B[[p-1, p-1]], A[[p-1, l]]);
                B[[p, l]] = math.subtract(term1, term2);
            }
            
            for (let k = p + 1; k < n; k += 2) {
                const term1 = math.multiply(A[[p-1, p-1]], A[[p, k+1]]);
                const term2 = math.multiply(A[[p, p]], A[[p-1, k]]);
                A[[p, k]] = math.subtract(term2, term1);
            }
            
            for (let l = p; l < n - 1; l += 2) {
                const term1 = math.multiply(A[[p-1, p-1]], B[[p, l+1]]);
                const term2 = math.multiply(A[[p, p]], B[[p-1, l]]);
                B[[p, l]] = math.subtract(term2, term1);
            }
            
            B[[p, n]] = math.multiply(A[[p, p]], B[[p-1, n]]);
        } else {
            for (let k = p; k < n; k += 2) {
                const term1 = math.multiply(A[[p-1, p-1]], A[[p-1, k]]);
                const term2 = math.multiply(B[[p-1, p-1]], B[[p-1, k]]);
                A[[p, k]] = math.add(term1, term2);
            }
            
            for (let l = p + 1; l <= n; l += 2) {
                const term1 = math.multiply(A[[p-1, p-1]], B[[p-1, l]]);
                const term2 = math.multiply(B[[p-1, p-1]], A[[p-1, l]]);
                B[[p, l]] = math.subtract(term1, term2);
            }
            
            for (let k = p + 1; k < n - 1; k += 2) {
                const term1 = math.multiply(A[[p-1, p-1]], A[[p, k+1]]);
                const term2 = math.multiply(A[[p, p]], A[[p-1, k]]);
                A[[p, k]] = math.subtract(term2, term1);
            }
            
            for (let l = p; l < n; l += 2) {
                const term1 = math.multiply(A[[p-1, p-1]], B[[p, l+1]]);
                const term2 = math.multiply(A[[p, p]], B[[p-1, l]]);
                B[[p, l]] = math.subtract(term2, term1);
            }
            
            A[[p, n]] = math.multiply(A[[p, p]], A[[p-1, n]]);
        }
    }
    
    const term1 = math.multiply(A[[n-1, n-1]], A[[n-1, n]]);
    const term2 = math.multiply(B[[n-1, n-1]], B[[n-1, n]]);
    A[[n, n]] = math.add(term1, term2);
    
    return [A, B];
}

// Algorithm for odd n
function n_odd(n, a, b) {
    let A = {};
    let B = {};
    
    [A, B] = initialize(n, A, B, a, b);
    
    for (let p = 2; p < n; p++) {
        if (p % 2 === 1) {
            for (let k = p; k <= n; k += 2) {
                const term1 = math.multiply(A[[p-1, p-1]], A[[p-1, k]]);
                const term2 = math.multiply(B[[p-1, p-1]], B[[p-1, k]]);
                A[[p, k]] = math.add(term1, term2);
            }
            
            for (let l = p + 1; l < n; l += 2) {
                const term1 = math.multiply(A[[p-1, p-1]], B[[p-1, l]]);
                const term2 = math.multiply(B[[p-1, p-1]], A[[p-1, l]]);
                B[[p, l]] = math.subtract(term1, term2);
            }
            
            for (let k = p + 1; k < n; k += 2) {
                const term1 = math.multiply(A[[p-1, p-1]], A[[p, k+1]]);
                const term2 = math.multiply(A[[p, p]], A[[p-1, k]]);
                A[[p, k]] = math.subtract(term2, term1);
            }
            
            for (let l = p; l < n - 1; l += 2) {
                const term1 = math.multiply(A[[p-1, p-1]], B[[p, l+1]]);
                const term2 = math.multiply(A[[p, p]], B[[p-1, l]]);
                B[[p, l]] = math.subtract(term2, term1);
            }
            
            B[[p, n]] = math.multiply(A[[p, p]], B[[p-1, n]]);
        } else {
            for (let k = p; k < n; k += 2) {
                const term1 = math.multiply(A[[p-1, p-1]], A[[p-1, k]]);
                const term2 = math.multiply(B[[p-1, p-1]], B[[p-1, k]]);
                A[[p, k]] = math.add(term1, term2);
            }
            
            for (let l = p + 1; l <= n; l += 2) {
                const term1 = math.multiply(A[[p-1, p-1]], B[[p-1, l]]);
                const term2 = math.multiply(B[[p-1, p-1]], A[[p-1, l]]);
                B[[p, l]] = math.subtract(term1, term2);
            }
            
            for (let k = p + 1; k < n - 1; k += 2) {
                const term1 = math.multiply(A[[p-1, p-1]], A[[p, k+1]]);
                const term2 = math.multiply(A[[p, p]], A[[p-1, k]]);
                A[[p, k]] = math.subtract(term2, term1);
            }
            
            for (let l = p; l < n; l += 2) {
                const term1 = math.multiply(A[[p-1, p-1]], B[[p, l+1]]);
                const term2 = math.multiply(A[[p, p]], B[[p-1, l]]);
                B[[p, l]] = math.subtract(term2, term1);
            }
            
            A[[p, n]] = math.multiply(A[[p, p]], A[[p-1, n]]);
        }
    }
    
    const term1 = math.multiply(A[[n-1, n-1]], A[[n-1, n]]);
    const term2 = math.multiply(B[[n-1, n-1]], B[[n-1, n]]);
    A[[n, n]] = math.add(term1, term2);
    
    return [A, B];
}

// Convert math.js expression to LaTeX
function toLatex(expr) {
    try {
        return expr.toTex();
    } catch (e) {
        return expr.toString();
    }
}

// Simplify expression
function simplifyExpr(expr) {
    try {
        return math.simplify(expr);
    } catch (e) {
        return expr;
    }
}

// Main computation function
function computeStability() {
    try {
        // Clear previous results
        document.getElementById('errorDisplay').innerHTML = '';
        document.getElementById('results').classList.remove('show');
        
        // Get degree
        const n = parseInt(document.getElementById('degree').value);
        
        if (n < 1 || n > 10) {
            throw new Error('Degree must be between 1 and 10');
        }
        
        // Parse coefficients
        const a = {};
        const b = {};
        
        for (let k = 1; k <= n; k++) {
            a[k] = parseInput(document.getElementById(`a${k}`).value);
            b[k] = parseInput(document.getElementById(`b${k}`).value);
        }
        
        // Display polynomial
        displayPolynomial(n, a, b);
        
        // Compute stability conditions
        let A, B;
        
        if (n === 1) {
            A = {};
            B = {};
            A[[1, 1]] = a[1];
        } else if (n % 2 === 0) {
            [A, B] = n_even(n, a, b);
        } else {
            [A, B] = n_odd(n, a, b);
        }
        
        // Extract and display conditions
        displayConditions(n, A);
        
        // Show results
        document.getElementById('results').classList.add('show');
        
        // Trigger MathJax to render
        if (window.MathJax) {
            MathJax.typesetPromise();
        }
        
    } catch (error) {
        displayError(error.message);
    }
}

// Display the polynomial
function displayPolynomial(n, a, b) {
    const container = document.getElementById('polynomialDisplay');
    
    let latex = 'P(s) = s^{' + n + '}';
    
    for (let k = n; k >= 1; k--) {
        const power = n - k;
        const realPart = toLatex(a[k]);
        const imagPart = toLatex(b[k]);
        
        // Build coefficient
        let coeff = '';
        if (realPart !== '0' && imagPart !== '0') {
            coeff = `(${realPart} + i(${imagPart}))`;
        } else if (realPart !== '0') {
            coeff = `(${realPart})`;
        } else if (imagPart !== '0') {
            coeff = `(i(${imagPart}))`;
        }
        
        if (coeff !== '') {
            if (power === 0) {
                latex += ` + ${coeff}`;
            } else if (power === 1) {
                latex += ` + ${coeff}s`;
            } else {
                latex += ` + ${coeff}s^{${power}}`;
            }
        }
    }
    
    container.innerHTML = `<strong>Input Polynomial:</strong><br>\\[${latex}\\]`;
}

// Display stability conditions
function displayConditions(n, A) {
    const container = document.getElementById('conditionsDisplay');
    container.innerHTML = '';
    
    for (let k = 1; k <= n; k++) {
        const condDiv = document.createElement('div');
        condDiv.className = 'condition';
        
        const expr = A[[k, k]];
        const simplified = simplifyExpr(expr);
        const latex = toLatex(simplified);
        
        condDiv.innerHTML = `
            <strong>Condition ${k}:</strong> \\(a_{${k}}^{(${k})} > 0\\)<br>
            <div style="margin-top: 10px;">
                \\[a_{${k}}^{(${k})} = ${latex}\\]
            </div>
        `;
        
        container.appendChild(condDiv);
    }
}

// Display error message
function displayError(message) {
    const errorDiv = document.getElementById('errorDisplay');
    errorDiv.innerHTML = `<div class="error"><strong>Error:</strong> ${message}</div>`;
}

// Initialize on page load
window.onload = function() {
    generateInputFields();
};

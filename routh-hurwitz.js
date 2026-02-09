// Generalized Routh-Hurwitz Algorithm Implementation in JavaScript
// Based on Algorithm 1 from Hastir & Muolo (2023)

// Use math.js for symbolic computation
const math = window.math;

// Helper function to safely multiply two expressions
function safeMultiply(a, b) {
    const strA = a.toString();
    const strB = b.toString();
    return math.parse(`(${strA}) * (${strB})`);
}

// Helper function to safely add two expressions
function safeAdd(a, b) {
    const strA = a.toString();
    const strB = b.toString();
    return math.parse(`(${strA}) + (${strB})`);
}

// Helper function to safely subtract two expressions
function safeSubtract(a, b) {
    const strA = a.toString();
    const strB = b.toString();
    return math.parse(`(${strA}) - (${strB})`);
}

// Convert expression to enhanced LaTeX with proper subscripts and superscripts
function toEnhancedLatex(expr) {
    // Fallback string form
    let str = expr.toString();

    // If math.js escaped underscores in toString (e.g. "\_"), unescape them first
    str = str.replace(/\\_/g, '_');

    // Regex that handles subscripts even after spaces or signs before the name
    const subRegex = /(^|[^\\a-zA-Z0-9])([A-Za-z]+)_([A-Za-z0-9]+)/g;

    // Convert occurrences like "k_a" or " alpha_1" -> "k_{a}" in the string fallback
    str = str.replace(subRegex, (m, pre, base, sub) => `${pre}${base}_{${sub}}`);

    try {
        // Get math.js TeX output
        let latex = expr.toTex();

        // Unescape any escaped underscores added by math.js so regex can match
        latex = latex.replace(/\\_/g, '_');

        // Apply the same subscript fix to the TeX output
        latex = latex.replace(subRegex, '$1$2_{$3}');

        // Cosmetic fixes: remove \cdot (use thin space) and simplify "1 * x"
        latex = latex.replace(/\\cdot\s*/g, '\\,');
        latex = latex.replace(/1\s*\\,\s*/g, '');
        latex = latex.replace(/\\,\s*1(?!\d)/g, '');

        return latex;
    } catch (e) {
        // Fall back to the preprocessed string version if toTex fails
        return str.replace(/\*/g, '\\,');
    }
}


// Format coefficient for polynomial display
function formatCoefficient(realPart, imagPart, isConstantTerm) {
    const realIsZero = isZero(realPart);
    const imagIsZero = isZero(imagPart);
    
    // Both zero - skip
    if (realIsZero && imagIsZero) {
        return null;
    }
    
    let realLatex = toEnhancedLatex(realPart);
    let imagLatex = toEnhancedLatex(imagPart);
    
    // Check if imaginary part is just "1" or "-1"
    const imagStr = imagPart.toString();
    const isImagOne = imagStr === '1';
    const isImagNegOne = imagStr === '-1';
    
    // Build coefficient
    if (!realIsZero && !imagIsZero) {
        // Both non-zero
        if (isImagOne) {
            return isConstantTerm ? `${realLatex} + i` : `\\left(${realLatex} + i\\right)`;
        } else if (isImagNegOne) {
            return isConstantTerm ? `${realLatex} - i` : `\\left(${realLatex} - i\\right)`;
        } else {
            // Check if imaginary part is negative
            if (imagLatex.startsWith('-')) {
                const posImagLatex = imagLatex.substring(1).trim();
                return isConstantTerm ? `${realLatex} - i ${posImagLatex}` : `\\left(${realLatex} - i ${posImagLatex}\\right)`;
            } else {
                return isConstantTerm ? `${realLatex} + i ${imagLatex}` : `\\left(${realLatex} + i ${imagLatex}\\right)`;
            }
        }
    } else if (!realIsZero) {
        // Only real part
        const needsParens = !isConstantTerm && (realLatex.includes('+') || realLatex.includes('-'));
        return needsParens ? `\\left(${realLatex}\\right)` : realLatex;
    } else {
        // Only imaginary part
        if (isImagOne) {
            return 'i';
        } else if (isImagNegOne) {
            return '-i';
        } else {
            // Check if imaginary coefficient is negative
            if (imagLatex.startsWith('-')) {
                const posImagLatex = imagLatex.substring(1).trim();
                const needsParens = !isConstantTerm && (posImagLatex.includes('+') || posImagLatex.includes('-'));
                const formatted = needsParens ? `\\left(${posImagLatex}\\right)` : posImagLatex;
                return `-i ${formatted}`;
            } else {
                const needsParens = !isConstantTerm && (imagLatex.includes('+') || imagLatex.includes('-'));
                const formatted = needsParens ? `\\left(${imagLatex}\\right)` : imagLatex;
                return `i ${formatted}`;
            }
        }
    }
}

// Check if coefficient starts with minus sign
function startsWithMinus(coeffLatex) {
    if (!coeffLatex) return false;
    const trimmed = coeffLatex.trim();
    return trimmed.startsWith('-') || trimmed.startsWith('\\left(-');
}

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
        title.innerHTML = `Coefficient of s<sup>${degree - k}</sup>`;
        
        const realLabel = document.createElement('label');
        realLabel.textContent = `Real part (a${k}):`;
        const realInput = document.createElement('input');
        realInput.type = 'text';
        realInput.id = `a${k}`;
        realInput.placeholder = 'e.g., 2, k*w, k_i';
        realInput.value = '0';
        
        const imagLabel = document.createElement('label');
        imagLabel.textContent = `Imaginary part (b${k}):`;
        const imagInput = document.createElement('input');
        imagInput.type = 'text';
        imagInput.id = `b${k}`;
        imagInput.placeholder = 'e.g., 0, 2*G, -k_i';
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
    document.getElementById('a3').value = '-k_I';
    document.getElementById('b3').value = '0';
    document.getElementById('a2').value = 'w^2 - G^2 - P';
    document.getElementById('b2').value = '0';
    document.getElementById('a1').value = '2*k*w';
    document.getElementById('b1').value = '2*G';
}

// Clear all inputs
function clearAll() {
    generateInputFields();
}

// Parse input to math.js expression
function parseInput(value) {
    if (value.trim() === '') return math.parse('0');
    try {
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
                const term1 = safeMultiply(A[[1, 1]], B[[0, k]]);
                const term2 = k < n ? B[[0, k + 1]] : math.parse('0');
                B[[1, k]] = safeSubtract(term1, term2);
            } else {  // Even k
                const term1 = safeMultiply(A[[1, 1]], A[[0, k]]);
                if (k < n) {
                    A[[1, k]] = safeSubtract(term1, A[[1, k + 1]]);
                } else {
                    A[[1, n]] = term1;
                }
            }
        }
    } else {  // n ODD
        for (let k = 1; k <= n; k++) {
            if (k % 2 === 1) {  // Odd k
                const term1 = safeMultiply(A[[1, 1]], B[[0, k]]);
                if (k < n) {
                    B[[1, k]] = safeSubtract(term1, B[[0, k + 1]]);
                } else {
                    B[[1, n]] = term1;
                }
            } else {  // Even k
                const term1 = safeMultiply(A[[1, 1]], A[[0, k]]);
                A[[1, k]] = safeSubtract(term1, A[[1, k + 1]]);
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
                const term1 = safeMultiply(A[[p-1, p-1]], A[[p-1, k]]);
                const term2 = safeMultiply(B[[p-1, p-1]], B[[p-1, k]]);
                A[[p, k]] = safeAdd(term1, term2);
            }
            
            for (let l = p + 1; l < n; l += 2) {
                const term1 = safeMultiply(A[[p-1, p-1]], B[[p-1, l]]);
                const term2 = safeMultiply(B[[p-1, p-1]], A[[p-1, l]]);
                B[[p, l]] = safeSubtract(term1, term2);
            }
            
            for (let k = p + 1; k < n; k += 2) {
                const term1 = safeMultiply(A[[p-1, p-1]], A[[p, k+1]]);
                const term2 = safeMultiply(A[[p, p]], A[[p-1, k]]);
                A[[p, k]] = safeSubtract(term2, term1);
            }
            
            for (let l = p; l < n - 1; l += 2) {
                const term1 = safeMultiply(A[[p-1, p-1]], B[[p, l+1]]);
                const term2 = safeMultiply(A[[p, p]], B[[p-1, l]]);
                B[[p, l]] = safeSubtract(term2, term1);
            }
            
            B[[p, n]] = safeMultiply(A[[p, p]], B[[p-1, n]]);
        } else {
            for (let k = p; k < n; k += 2) {
                const term1 = safeMultiply(A[[p-1, p-1]], A[[p-1, k]]);
                const term2 = safeMultiply(B[[p-1, p-1]], B[[p-1, k]]);
                A[[p, k]] = safeAdd(term1, term2);
            }
            
            for (let l = p + 1; l <= n; l += 2) {
                const term1 = safeMultiply(A[[p-1, p-1]], B[[p-1, l]]);
                const term2 = safeMultiply(B[[p-1, p-1]], A[[p-1, l]]);
                B[[p, l]] = safeSubtract(term1, term2);
            }
            
            for (let k = p + 1; k < n - 1; k += 2) {
                const term1 = safeMultiply(A[[p-1, p-1]], A[[p, k+1]]);
                const term2 = safeMultiply(A[[p, p]], A[[p-1, k]]);
                A[[p, k]] = safeSubtract(term2, term1);
            }
            
            for (let l = p; l < n; l += 2) {
                const term1 = safeMultiply(A[[p-1, p-1]], B[[p, l+1]]);
                const term2 = safeMultiply(A[[p, p]], B[[p-1, l]]);
                B[[p, l]] = safeSubtract(term2, term1);
            }
            
            A[[p, n]] = safeMultiply(A[[p, p]], A[[p-1, n]]);
        }
    }
    
    const term1 = safeMultiply(A[[n-1, n-1]], A[[n-1, n]]);
    const term2 = safeMultiply(B[[n-1, n-1]], B[[n-1, n]]);
    A[[n, n]] = safeAdd(term1, term2);
    
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
                const term1 = safeMultiply(A[[p-1, p-1]], A[[p-1, k]]);
                const term2 = safeMultiply(B[[p-1, p-1]], B[[p-1, k]]);
                A[[p, k]] = safeAdd(term1, term2);
            }
            
            for (let l = p + 1; l < n; l += 2) {
                const term1 = safeMultiply(A[[p-1, p-1]], B[[p-1, l]]);
                const term2 = safeMultiply(B[[p-1, p-1]], A[[p-1, l]]);
                B[[p, l]] = safeSubtract(term1, term2);
            }
            
            for (let k = p + 1; k < n; k += 2) {
                const term1 = safeMultiply(A[[p-1, p-1]], A[[p, k+1]]);
                const term2 = safeMultiply(A[[p, p]], A[[p-1, k]]);
                A[[p, k]] = safeSubtract(term2, term1);
            }
            
            for (let l = p; l < n - 1; l += 2) {
                const term1 = safeMultiply(A[[p-1, p-1]], B[[p, l+1]]);
                const term2 = safeMultiply(A[[p, p]], B[[p-1, l]]);
                B[[p, l]] = safeSubtract(term2, term1);
            }
            
            B[[p, n]] = safeMultiply(A[[p, p]], B[[p-1, n]]);
        } else {
            for (let k = p; k < n; k += 2) {
                const term1 = safeMultiply(A[[p-1, p-1]], A[[p-1, k]]);
                const term2 = safeMultiply(B[[p-1, p-1]], B[[p-1, k]]);
                A[[p, k]] = safeAdd(term1, term2);
            }
            
            for (let l = p + 1; l <= n; l += 2) {
                const term1 = safeMultiply(A[[p-1, p-1]], B[[p-1, l]]);
                const term2 = safeMultiply(B[[p-1, p-1]], A[[p-1, l]]);
                B[[p, l]] = safeSubtract(term1, term2);
            }
            
            for (let k = p + 1; k < n - 1; k += 2) {
                const term1 = safeMultiply(A[[p-1, p-1]], A[[p, k+1]]);
                const term2 = safeMultiply(A[[p, p]], A[[p-1, k]]);
                A[[p, k]] = safeSubtract(term2, term1);
            }
            
            for (let l = p; l < n; l += 2) {
                const term1 = safeMultiply(A[[p-1, p-1]], B[[p, l+1]]);
                const term2 = safeMultiply(A[[p, p]], B[[p-1, l]]);
                B[[p, l]] = safeSubtract(term2, term1);
            }
            
            A[[p, n]] = safeMultiply(A[[p, p]], A[[p-1, n]]);
        }
    }
    
    const term1 = safeMultiply(A[[n-1, n-1]], A[[n-1, n]]);
    const term2 = safeMultiply(B[[n-1, n-1]], B[[n-1, n]]);
    A[[n, n]] = safeAdd(term1, term2);
    
    return [A, B];
}

// Simplify expression with aggressive simplification
function simplifyExpr(expr) {
    try {
        // Try multiple simplification passes
        let simplified = math.simplify(expr);
        
        // Additional simplification rules
        const rules = [
            'n * 0 -> 0',
            '0 * n -> 0',
            'n * 1 -> n',
            '1 * n -> n',
            'n + 0 -> n',
            '0 + n -> n',
            'n - 0 -> n'
        ];
        
        simplified = math.simplify(simplified, rules);
        return simplified;
    } catch (e) {
        return expr;
    }
}

// Check if expression is effectively zero
function isZero(expr) {
    const str = expr.toString();
    return str === '0' || str === '0.0';
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
            const aVal = document.getElementById(`a${k}`).value;
            const bVal = document.getElementById(`b${k}`).value;
            a[k] = parseInput(aVal);
            b[k] = parseInput(bVal);
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
        console.error('Full error:', error);
    }
}

// Display the polynomial
function displayPolynomial(n, a, b) {
    const container = document.getElementById('polynomialDisplay');
    
    let parts = [];
    
    // Add s^n term (monic polynomial)
    parts.push({latex: 's^{' + n + '}', isNegative: false});
      // Add remaining terms in order from highest to lowest degree
    for (let idx = 1; idx <= n; idx++) {
        const k = idx;  // Coefficient index
        const power = n - idx;  // Power of s
        
        const realPart = a[k];
        const imagPart = b[k];
        
        const isConstantTerm = (power === 0);
        const coeffLatex = formatCoefficient(realPart, imagPart, isConstantTerm);
        
        if (coeffLatex === null) {
            continue; // Skip zero coefficients
        }
        
        // Build the full term with appropriate power of s
        let termLatex = '';
        if (power === 0) {
            termLatex = coeffLatex;
        } else if (power === 1) {
            termLatex = coeffLatex + ' s';
        } else {
            termLatex = coeffLatex + ' s^{' + power + '}';
        }
        
        // Check if this term starts with a minus sign
        const isNegative = startsWithMinus(coeffLatex);
        
        parts.push({latex: termLatex, isNegative: isNegative});
    }
    
    // Build the final polynomial string with proper signs
    let polyLatex = 'P(s) = ' + parts[0].latex;
    for (let i = 1; i < parts.length; i++) {
        if (parts[i].isNegative) {
            // Remove leading minus and use minus sign
            let term = parts[i].latex.trim();
            if (term.startsWith('-')) {
                term = term.substring(1).trim();
            } else if (term.startsWith('\\left(-')) {
                // Handle \left(-...\right) case
                term = '\\left(' + term.substring(7);
            }
            polyLatex += ' - ' + term;
        } else {
            polyLatex += ' + ' + parts[i].latex;
        }
    }
    
    container.innerHTML = `<strong>Input Polynomial:</strong><br>\\[${polyLatex}\\]`;
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
        const latex = toEnhancedLatex(simplified);
        
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
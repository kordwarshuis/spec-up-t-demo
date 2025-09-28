#!/usr/bin/env node

/**
 * Spec-Up-T specs.json validation test suite
 * 
 * This module validates specs.json files to ensure they meet the required standards
 * for Spec-Up-T installations. It provides comprehensive validation with detailed
 * error reporting in both terminal and HTML formats.
 * 
 * Usage:
 *   node specsjson.js <path-to-specs.json>
 *   node specsjson.js # (validates specs.json in current directory)
 */

const fs = require('fs');
const path = require('path');

/**
 * Color codes for terminal output
 */
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bright: '\x1b[1m'
};

/**
 * Test result types
 */
const TEST_TYPES = {
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
    SUCCESS: 'success'
};

/**
 * Field validation configuration
 * Defines which fields are required, optional, or warrant warnings
 */
const FIELD_CONFIG = {
    // Required fields - must exist and have non-empty values
    required: [
        'title',
        'description', 
        'author',
        'spec_directory',
        'spec_terms_directory',
        'output_path',
        'markdown_paths',
        'logo',
        'logo_link',
        'source'
    ],
    
    // Warning fields - should exist but missing values only trigger warnings
    warning: [
        'favicon'
    ],
    
    // Optional fields - provide info if missing
    optional: [
        'anchor_symbol',
        'katex'
    ],
    
    // Fields that can exist but are not required
    other: [
        'external_specs',
        'version'
    ]
};

/**
 * Test result storage
 */
class TestResults {
    constructor() {
        this.results = [];
        this.summary = {
            error: 0,
            warning: 0,
            info: 0,
            success: 0
        };
    }

    /**
     * Add a test result
     * @param {string} type - Type of result (error, warning, info, success)
     * @param {string} message - Human-readable message
     * @param {string} field - Field name being tested (optional)
     */
    add(type, message, field = null) {
        this.results.push({
            type,
            message,
            field,
            timestamp: new Date().toISOString()
        });
        this.summary[type]++;
    }

    /**
     * Check if validation passed (no errors)
     * @returns {boolean}
     */
    hasPassed() {
        return this.summary.error === 0;
    }

    /**
     * Get all results of a specific type
     * @param {string} type - Result type to filter by
     * @returns {Array}
     */
    getByType(type) {
        return this.results.filter(result => result.type === type);
    }
}

/**
 * Validates the basic structure of specs.json
 * @param {any} data - Parsed JSON data
 * @param {TestResults} results - Results collector
 */
function validateBasicStructure(data, results) {
    // Check if data is an object
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        results.add(TEST_TYPES.ERROR, 'specs.json must contain a JSON object at root level');
        return false;
    }

    // Check if it contains exactly one field called 'specs'
    const keys = Object.keys(data);
    if (keys.length !== 1) {
        results.add(TEST_TYPES.ERROR, `Root object should contain exactly one field, found ${keys.length}: [${keys.join(', ')}]`);
        return false;
    }

    if (keys[0] !== 'specs') {
        results.add(TEST_TYPES.ERROR, `Root object should contain field 'specs', found '${keys[0]}'`);
        return false;
    }

    // Check if specs is an array
    if (!Array.isArray(data.specs)) {
        results.add(TEST_TYPES.ERROR, 'Field "specs" should be an array');
        return false;
    }

    // Check if array contains exactly one object
    if (data.specs.length !== 1) {
        results.add(TEST_TYPES.ERROR, `Field "specs" should contain exactly one object, found ${data.specs.length}`);
        return false;
    }

    // Check if the single item is an object
    if (typeof data.specs[0] !== 'object' || data.specs[0] === null || Array.isArray(data.specs[0])) {
        results.add(TEST_TYPES.ERROR, 'The item in "specs" array should be an object');
        return false;
    }

    results.add(TEST_TYPES.SUCCESS, 'Basic structure validation passed');
    return true;
}

/**
 * Validates required fields
 * @param {Object} spec - The spec object to validate
 * @param {TestResults} results - Results collector
 */
function validateRequiredFields(spec, results) {
    let allRequiredPresent = true;

    FIELD_CONFIG.required.forEach(field => {
        if (!(field in spec)) {
            results.add(TEST_TYPES.ERROR, `Required field "${field}" is missing`, field);
            allRequiredPresent = false;
        } else if (spec[field] === null || spec[field] === undefined || spec[field] === '') {
            results.add(TEST_TYPES.ERROR, `Required field "${field}" is empty or null`, field);
            allRequiredPresent = false;
        } else if (Array.isArray(spec[field]) && spec[field].length === 0) {
            results.add(TEST_TYPES.ERROR, `Required field "${field}" is an empty array`, field);
            allRequiredPresent = false;
        } else {
            results.add(TEST_TYPES.SUCCESS, `Required field "${field}" is present and valid`, field);
        }
    });

    return allRequiredPresent;
}

/**
 * Validates warning fields (should exist but missing values only trigger warnings)
 * @param {Object} spec - The spec object to validate
 * @param {TestResults} results - Results collector
 */
function validateWarningFields(spec, results) {
    FIELD_CONFIG.warning.forEach(field => {
        if (!(field in spec)) {
            results.add(TEST_TYPES.WARNING, `Recommended field "${field}" is missing`, field);
        } else if (spec[field] === null || spec[field] === undefined || spec[field] === '') {
            results.add(TEST_TYPES.WARNING, `Recommended field "${field}" is empty or null`, field);
        } else {
            results.add(TEST_TYPES.SUCCESS, `Recommended field "${field}" is present and valid`, field);
        }
    });
}

/**
 * Validates optional fields (provides info if missing)
 * @param {Object} spec - The spec object to validate
 * @param {TestResults} results - Results collector
 */
function validateOptionalFields(spec, results) {
    FIELD_CONFIG.optional.forEach(field => {
        if (!(field in spec)) {
            results.add(TEST_TYPES.INFO, `Optional field "${field}" is not set (this is acceptable)`, field);
        } else {
            results.add(TEST_TYPES.SUCCESS, `Optional field "${field}" is present`, field);
        }
    });
}

/**
 * Validates specific field types and formats
 * @param {Object} spec - The spec object to validate
 * @param {TestResults} results - Results collector
 */
function validateFieldTypes(spec, results) {
    // Validate markdown_paths is array of strings
    if (spec.markdown_paths && Array.isArray(spec.markdown_paths)) {
        if (spec.markdown_paths.every(item => typeof item === 'string')) {
            results.add(TEST_TYPES.SUCCESS, 'Field "markdown_paths" contains valid string array', 'markdown_paths');
        } else {
            results.add(TEST_TYPES.ERROR, 'Field "markdown_paths" should contain only strings', 'markdown_paths');
        }
    }

    // Validate source object structure
    if (spec.source && typeof spec.source === 'object') {
        const requiredSourceFields = ['host', 'account', 'repo', 'branch'];
        let sourceValid = true;
        
        requiredSourceFields.forEach(field => {
            if (!(field in spec.source) || !spec.source[field]) {
                results.add(TEST_TYPES.ERROR, `Source field "${field}" is missing or empty`, `source.${field}`);
                sourceValid = false;
            }
        });
        
        if (sourceValid) {
            results.add(TEST_TYPES.SUCCESS, 'Source object structure is valid', 'source');
        }
    }

    // Validate external_specs if present
    if (spec.external_specs) {
        if (Array.isArray(spec.external_specs)) {
            spec.external_specs.forEach((extSpec, index) => {
                const requiredExtFields = ['external_spec', 'gh_page', 'url', 'terms_dir'];
                requiredExtFields.forEach(field => {
                    if (!(field in extSpec) || !extSpec[field]) {
                        results.add(TEST_TYPES.ERROR, `External spec ${index} missing "${field}"`, `external_specs[${index}].${field}`);
                    }
                });
            });
            results.add(TEST_TYPES.SUCCESS, `External specs array contains ${spec.external_specs.length} entries`, 'external_specs');
        } else {
            results.add(TEST_TYPES.ERROR, 'Field "external_specs" should be an array', 'external_specs');
        }
    }

    // Validate katex is boolean if present
    if ('katex' in spec && typeof spec.katex !== 'boolean') {
        results.add(TEST_TYPES.ERROR, 'Field "katex" should be a boolean value', 'katex');
    }
}

/**
 * Prints colored output to terminal
 * @param {string} type - Type of message
 * @param {string} message - Message to print
 */
function printColoredMessage(type, message) {
    const typeColors = {
        [TEST_TYPES.ERROR]: `${colors.bright}${colors.red}ERROR${colors.reset}`,
        [TEST_TYPES.WARNING]: `${colors.bright}${colors.yellow}WARNING${colors.reset}`,
        [TEST_TYPES.INFO]: `${colors.bright}${colors.blue}INFO${colors.reset}`,
        [TEST_TYPES.SUCCESS]: `${colors.bright}${colors.green}SUCCESS${colors.reset}`
    };

    console.log(`${typeColors[type]}: ${message}`);
}

/**
 * Prints test results to terminal
 * @param {TestResults} results - Test results to print
 */
function printTerminalResults(results) {
    console.log(`\n${colors.bright}${colors.cyan}=== SPECS.JSON VALIDATION RESULTS ===${colors.reset}\n`);
    
    // Print all results grouped by type
    [TEST_TYPES.ERROR, TEST_TYPES.WARNING, TEST_TYPES.INFO, TEST_TYPES.SUCCESS].forEach(type => {
        const typeResults = results.getByType(type);
        if (typeResults.length > 0) {
            typeResults.forEach(result => {
                const fieldInfo = result.field ? ` [${result.field}]` : '';
                printColoredMessage(type, `${result.message}${fieldInfo}`);
            });
            console.log('');
        }
    });

    // Print summary
    console.log(`${colors.bright}${colors.cyan}=== SUMMARY ===${colors.reset}`);
    console.log(`${colors.green}✓ Success: ${results.summary.success}${colors.reset}`);
    console.log(`${colors.blue}ⓘ Info: ${results.summary.info}${colors.reset}`);
    console.log(`${colors.yellow}⚠ Warnings: ${results.summary.warning}${colors.reset}`);
    console.log(`${colors.red}✗ Errors: ${results.summary.error}${colors.reset}`);

    if (results.hasPassed()) {
        console.log(`\n${colors.bright}${colors.green}🎉 VALIDATION PASSED! specs.json meets all requirements.${colors.reset}`);
    } else {
        console.log(`\n${colors.bright}${colors.red}❌ VALIDATION FAILED! Please fix the errors above.${colors.reset}`);
    }
}

/**
 * Generates HTML report of test results
 * @param {TestResults} results - Test results to include
 * @param {string} specsPath - Path to the specs.json file being tested
 * @returns {string} HTML content
 */
function generateHtmlReport(results, specsPath) {
    const now = new Date().toLocaleString();
    const status = results.hasPassed() ? 'PASSED' : 'FAILED';
    const statusClass = results.hasPassed() ? 'success' : 'error';

    const groupedResults = {
        [TEST_TYPES.ERROR]: results.getByType(TEST_TYPES.ERROR),
        [TEST_TYPES.WARNING]: results.getByType(TEST_TYPES.WARNING),
        [TEST_TYPES.INFO]: results.getByType(TEST_TYPES.INFO),
        [TEST_TYPES.SUCCESS]: results.getByType(TEST_TYPES.SUCCESS)
    };

    const resultSections = Object.entries(groupedResults)
        .filter(([_, items]) => items.length > 0)
        .map(([type, items]) => {
            const icon = {
                [TEST_TYPES.ERROR]: '❌',
                [TEST_TYPES.WARNING]: '⚠️',
                [TEST_TYPES.INFO]: 'ℹ️',
                [TEST_TYPES.SUCCESS]: '✅'
            }[type];

            const itemsList = items.map(item => {
                const fieldInfo = item.field ? ` <code>[${item.field}]</code>` : '';
                return `<li>${item.message}${fieldInfo}</li>`;
            }).join('');

            return `
                <div class="result-section ${type}">
                    <h3>${icon} ${type.toUpperCase()} (${items.length})</h3>
                    <ul>${itemsList}</ul>
                </div>
            `;
        }).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Specs.json Validation Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #eee;
        }
        .status {
            font-size: 1.5em;
            font-weight: bold;
            padding: 10px 20px;
            border-radius: 5px;
            display: inline-block;
        }
        .status.success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .status.error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .summary-item {
            text-align: center;
            padding: 15px;
            border-radius: 5px;
            background-color: #f8f9fa;
        }
        .summary-item.error { border-left: 4px solid #dc3545; }
        .summary-item.warning { border-left: 4px solid #ffc107; }
        .summary-item.info { border-left: 4px solid #17a2b8; }
        .summary-item.success { border-left: 4px solid #28a745; }
        .result-section {
            margin: 20px 0;
            padding: 15px;
            border-radius: 5px;
        }
        .result-section.error {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
        }
        .result-section.warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
        }
        .result-section.info {
            background-color: #d1ecf1;
            border: 1px solid #bee5eb;
        }
        .result-section.success {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
        }
        .result-section h3 {
            margin-top: 0;
        }
        .result-section ul {
            margin: 10px 0;
        }
        .result-section li {
            margin: 5px 0;
        }
        code {
            background-color: #f1f3f4;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        .metadata {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .metadata table {
            width: 100%;
            border-collapse: collapse;
        }
        .metadata td {
            padding: 5px 10px;
            border-bottom: 1px solid #dee2e6;
        }
        .metadata td:first-child {
            font-weight: bold;
            width: 150px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Specs.json Validation Report</h1>
            <div class="status ${statusClass}">VALIDATION ${status}</div>
        </div>

        <div class="metadata">
            <table>
                <tr>
                    <td>File Tested:</td>
                    <td><code>${specsPath}</code></td>
                </tr>
                <tr>
                    <td>Test Date:</td>
                    <td>${now}</td>
                </tr>
                <tr>
                    <td>Test Suite:</td>
                    <td>Spec-Up-T specs.json validator</td>
                </tr>
            </table>
        </div>

        <div class="summary">
            <div class="summary-item success">
                <h3>✅ ${results.summary.success}</h3>
                <p>Successful</p>
            </div>
            <div class="summary-item info">
                <h3>ℹ️ ${results.summary.info}</h3>
                <p>Information</p>
            </div>
            <div class="summary-item warning">
                <h3>⚠️ ${results.summary.warning}</h3>
                <p>Warnings</p>
            </div>
            <div class="summary-item error">
                <h3>❌ ${results.summary.error}</h3>
                <p>Errors</p>
            </div>
        </div>

        <div class="results">
            <h2>📝 Detailed Results</h2>
            ${resultSections}
        </div>

        <div class="footer" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #6c757d;">
            <p>Generated by Spec-Up-T specs.json validation test suite</p>
        </div>
    </div>
</body>
</html>
    `.trim();
}

/**
 * Main validation function
 * @param {string} filePath - Path to specs.json file
 * @returns {TestResults} Validation results
 */
function validateSpecsJson(filePath) {
    const results = new TestResults();
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        results.add(TEST_TYPES.ERROR, `File not found: ${filePath}`);
        return results;
    }

    // Try to read and parse JSON
    let data;
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        data = JSON.parse(content);
    } catch (error) {
        results.add(TEST_TYPES.ERROR, `Failed to parse JSON: ${error.message}`);
        return results;
    }

    // Validate basic structure
    if (!validateBasicStructure(data, results)) {
        return results; // Stop if basic structure is invalid
    }

    const spec = data.specs[0];

    // Run all validation checks
    validateRequiredFields(spec, results);
    validateWarningFields(spec, results);
    validateOptionalFields(spec, results);
    validateFieldTypes(spec, results);

    return results;
}

/**
 * Main execution function
 */
function main() {
    const args = process.argv.slice(2);
    let specsPath = 'specs.json';

    if (args.length > 0) {
        specsPath = args[0];
    }

    // Convert to absolute path for consistency
    specsPath = path.resolve(specsPath);

    console.log(`${colors.bright}${colors.cyan}Validating specs.json file: ${specsPath}${colors.reset}\n`);

    // Run validation
    const results = validateSpecsJson(specsPath);

    // Print results to terminal
    printTerminalResults(results);

    // Generate HTML report
    const htmlReport = generateHtmlReport(results, specsPath);
    const reportPath = path.join(path.dirname(specsPath), 'specs-validation-report.html');
    
    try {
        fs.writeFileSync(reportPath, htmlReport);
        console.log(`\n${colors.bright}${colors.cyan}📄 HTML report generated: ${reportPath}${colors.reset}`);
    } catch (error) {
        console.error(`${colors.red}Failed to write HTML report: ${error.message}${colors.reset}`);
    }

    // Exit with appropriate code
    process.exit(results.hasPassed() ? 0 : 1);
}

// Export functions for testing
module.exports = {
    validateSpecsJson,
    TestResults,
    FIELD_CONFIG,
    TEST_TYPES
};

// Run if called directly
if (require.main === module) {
    main();
}
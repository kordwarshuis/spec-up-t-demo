# Specs.json Validation Test Suite

This test suite validates `specs.json` files to ensure they meet the required standards for Spec-Up-T installations.

## Features

✅ **Comprehensive Validation**: Tests all required fields, optional fields, and recommended fields  
✅ **Detailed Reporting**: Provides colored terminal output and HTML reports  
✅ **Modular Architecture**: Easy to extend with new validation rules  
✅ **Error Classification**: Distinguishes between errors, warnings, and informational messages  
✅ **Exit Codes**: Proper exit codes for CI/CD integration  

## Usage

### Command Line

```bash
# Test specs.json in current directory
node specsjson.js

# Test a specific specs.json file
node specsjson.js /path/to/specs.json

# Test and generate HTML report
node specsjson.js specs.json
# Creates: specs-validation-report.html
```

### Programmatic Usage

```javascript
const { validateSpecsJson } = require('./specsjson.js');

const results = validateSpecsJson('specs.json');

if (results.hasPassed()) {
    console.log('✅ Validation passed!');
} else {
    console.log('❌ Validation failed!');
    console.log(`Errors: ${results.summary.error}`);
}
```

## Validation Rules

### Required Fields (Errors if missing/empty)
- `title` - Specification title
- `description` - Specification description  
- `author` - Author name
- `spec_directory` - Directory containing spec files
- `spec_terms_directory` - Directory containing terminology definitions
- `output_path` - Output directory for generated documentation
- `markdown_paths` - Array of markdown files to process
- `logo` - Logo URL
- `logo_link` - Logo link URL
- `source` - Source repository information

### Recommended Fields (Warnings if missing)
- `favicon` - Favicon URL

### Optional Fields (Info if missing)
- `anchor_symbol` - Symbol used for anchors
- `katex` - Boolean for KaTeX math support

### Additional Validations
- **Basic Structure**: Must be JSON object with single `specs` array containing one object
- **Type Checking**: Validates field types (arrays, booleans, etc.)
- **Source Object**: Validates required subfields (host, account, repo, branch)
- **External Specs**: Validates external specification references

## Output

### Terminal Output
- 🎨 **Colored output** for easy reading
- 📊 **Summary statistics** showing counts by category
- 🔍 **Detailed messages** with field references

### HTML Report
- 📄 **Professional HTML report** with styling
- 📋 **Comprehensive results** grouped by category
- 📈 **Visual summary** with color-coded statistics
- 🕒 **Timestamp and metadata** for tracking

## Exit Codes

- `0` - Validation passed (no errors)
- `1` - Validation failed (has errors)

## Why This File Should Stay

This validation test suite is essential for:

1. **Quality Assurance**: Ensures specs.json files meet standards before deployment
2. **CI/CD Integration**: Can be integrated into build pipelines for automated validation
3. **Developer Experience**: Provides immediate feedback on configuration issues
4. **Documentation**: Serves as living documentation of specs.json requirements
5. **Consistency**: Helps maintain consistent structure across projects

## How to Use This File

1. **Manual Validation**: Run before committing changes to specs.json
2. **CI Pipeline**: Add to GitHub Actions or other CI systems
3. **Development**: Use during spec development to catch issues early
4. **Troubleshooting**: Generate HTML reports for detailed analysis
5. **Documentation**: Reference validation rules when creating new specs

## SonarQube Compliance

This code follows the project's SonarQube standards:
- ✅ Cognitive complexity kept below 15 per function
- ✅ Modular architecture with single-responsibility functions
- ✅ Comprehensive documentation and comments
- ✅ Error handling and input validation
- ✅ No code duplication

**Remember to test this on a separate test machine before deploying to production!**
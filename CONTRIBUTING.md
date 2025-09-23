# Contributing to Forest Nexus DSS-OCR

Thank you for your interest in contributing to the Forest Nexus DSS-OCR project! We welcome contributions from the community.

## How to Contribute

### Reporting Bugs

1. Check if the issue has already been reported in our [Issues](../../issues) section
2. If not, create a new issue with:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Your environment details (OS, Node.js version, Python version)

### Suggesting Features

1. Open a new issue with the label "enhancement"
2. Describe the feature you'd like to see
3. Explain why it would be useful
4. Provide examples if possible

### Code Contributions

1. **Fork the repository**
   ```bash
   git fork https://github.com/your-username/forest-nexus-dss-ocr.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add comments for complex logic
   - Update documentation if needed

4. **Test your changes**
   ```bash
   # Test frontend
   npm test
   
   # Test backend (if you have tests)
   cd backend
   python -m pytest
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Provide a clear description of changes
   - Reference any related issues
   - Include screenshots for UI changes

## Development Setup

1. **Prerequisites**
   - Node.js (v14+)
   - Python (v3.8+)
   - Google Cloud account

2. **Installation**
   ```bash
   git clone your-fork-url
   cd forest-nexus-dss-ocr
   npm install
   cd backend
   pip install -r requirements.txt
   ```

3. **Environment Setup**
   ```bash
   cp backend/.env.example backend/.env
   # Edit .env with your configuration
   ```

## Code Style Guidelines

### JavaScript/React
- Use ES6+ features
- Follow React hooks patterns
- Use meaningful variable names
- Add JSDoc comments for functions

### Python
- Follow PEP 8 style guide
- Use type hints where possible
- Add docstrings for functions and classes
- Keep functions focused and small

### Git Commit Messages
Use conventional commits format:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/tooling changes

Examples:
```
feat: add OCR batch processing support
fix: resolve CORS issue with file uploads
docs: update API documentation
```

## Review Process

1. All contributions are reviewed by maintainers
2. We may request changes or improvements
3. Once approved, your PR will be merged
4. Your contribution will be acknowledged in the changelog

## Questions?

Feel free to open an issue for questions about contributing or reach out to the maintainers.

Thank you for contributing to Forest Nexus DSS-OCR! 🌲
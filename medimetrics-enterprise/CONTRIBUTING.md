# Contributing to MediMetrics Enterprise

Thank you for your interest in contributing to MediMetrics! This document provides guidelines for contributing to the project.

## Code of Conduct

Please read and follow our Code of Conduct to ensure a welcoming environment for all contributors.

## How to Contribute

### Reporting Bugs
- Use the GitHub Issues template
- Include detailed reproduction steps
- Provide system information
- Include relevant logs (with PHI redacted)

### Suggesting Features
- Check existing issues first
- Provide use cases
- Consider HIPAA implications
- Include mockups if applicable

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the coding standards
   - Add tests for new features
   - Update documentation
   - Ensure HIPAA compliance

4. **Test your changes**
   ```bash
   make test
   make test-e2e
   ```

5. **Commit with conventional commits**
   ```bash
   git commit -m "feat: add new feature"
   ```
   Types: feat, fix, docs, style, refactor, test, chore

6. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Development Setup

```bash
# Clone the repo
git clone https://github.com/yourorg/medimetrics-enterprise.git
cd medimetrics-enterprise

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Start development
make dev
```

## Coding Standards

### TypeScript/JavaScript
- Use TypeScript for type safety
- Follow ESLint configuration
- Use Prettier for formatting

### Python
- Follow PEP 8
- Use Black for formatting
- Type hints required

### Testing
- Unit tests required for new features
- Integration tests for API endpoints
- E2E tests for critical workflows
- Minimum 80% code coverage

### Documentation
- JSDoc/TSDoc for functions
- README for new modules
- API documentation in OpenAPI
- Update user documentation

## Security Considerations

- Never commit PHI or PII
- Use encryption for sensitive data
- Follow OWASP guidelines
- Security review required for auth changes

## Review Process

1. Automated checks must pass
2. Code review by maintainer
3. Security review if applicable
4. Documentation review
5. Testing on staging environment

## License

By contributing, you agree that your contributions will be licensed under the Apache 2.0 License.
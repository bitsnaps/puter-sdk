# Contributing to Puter SDK

Thank you for your interest in contributing to the Puter SDK! We welcome contributions from anyone who wants to help improve the project.
This guide will help you get started with the contribution process.

## Getting Started

1. **Fork the Repository**: Fork the [puter-sdk](https://github.com/bitsnaps/puter-sdk) to your GitHub account.
2. **Clone the Forked Repository**: Clone your forked repository to your local machine.
   ```bash
   git clone https://github.com/bitsnaps/puter-sdk.git
   cd puter-sdk
   ```
3. **Install Dependencies**: Install the required dependencies for the project.
   ```bash
   npm install
   ```
4. **Create a Branch**: Create a new branch for your feature or bug fix.
   ```bash
   git checkout -b feature/your-feature-name
   ```
   Replace `feature/your-feature-name` with a descriptive name for your changes.

5. **Test your commit**: Run the test.
   ```bash
   npm run test
   ```
   Replace `feature/your-feature-name` with a descriptive name for your changes.

## Contribution Process

1. **Commit Your Changes**:
   - Make sure your changes are well-documented and follow the project's coding standards.
   - Use clear and descriptive commit messages. For example:
     ```
     git commit -m "feat: New API endpoint for..."
     ```
2. **Push to the Branch**:
   ```bash
   git push origin feature/your-feature-name
   ```
3. **Open a Pull Request**:
   - Navigate to your forked repository on GitHub.
   - Open a Pull Request (PR) from your feature branch to the `master` branch of the original repository.
   - Provide a detailed description of your changes in the PR.

## Coding Standards and Best Practices

- **Follow JavaScript Best Practices**: Ensure your code is clean, readable, and well-documented.
- **Test Your Changes**: Write unit tests for your changes and ensure all existing tests pass.
- **Keep Commits Small and Focused**: Break large changes into smaller, manageable commits.

## Style of Commits

The type is responsible for telling us what change or iteration is being made, from the convention rules, we have the following types:

* **test**: indicates any type of creation or alteration of test codes.
  + Example: Creation of unit tests.
* **feat**: indicates the development of a new feature for the project.
  + Example: Adding a service, functionality, endpoint, etc.
* **refactor**: used when there is a code refactoring that does not have any impact on the system logic/rules.
  + Example: Code changes after a code review.
* **style**: used when there are code formatting and style changes that do not change the system in any way.
  + Example: Change the style-guide, change the lint convention, fix indentations, remove white spaces, remove comments, etc.
* **fix**: used when correcting errors that are generating bugs in the system.
  + Example: Apply a handling for a function that is not behaving as expected and returning an error.
* **chore**: indicates changes to the project that do not affect the system or test files. These are developmental changes.
  + Example: Change rules for eslint, add prettier, add more file extensions to .gitignore.
* **docs**: used when there are changes in the project documentation.
  + Example: add information in the API documentation, change the README, etc.
* **build**: used to indicate changes that affect the project build process or external dependencies.
  + Example: Gulp, add/remove npm dependencies, etc.
* **perf**: indicates a change that improved system performance.
  + Example: change ForEach to While, etc.
* **ci**: used for changes in CI configuration files.
  + Example: Circle, Travis, BrowserStack, etc.
* **revert**: indicates the reversal of a previous commit.

## Code of Conduct

This project adheres to the Contributor [Code of Conduct](CODE_OF_CONDUCT.md).
By participating, you are expected to uphold this code.
Please report any unacceptable behavior to the owner of this repo.

## How Decisions Are Made

- Decisions are made collaboratively by the maintainers and contributors.
- Major decisions will be discussed openly in GitHub issues or pull requests.

## Becoming a Maintainer

If you are interested in becoming a maintainer, demonstrate your commitment by contributing high-quality code, helping with issues, and engaging with the community.

## License

This project is licensed under the [MIT License](LICENSE).

By contributing, you agree that your contributions will be licensed under the same terms.

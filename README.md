# Package Automator

A tool to automatically update npm and go package versions and generate reports.

## Features

- Scans multiple repositories for package.json and package-lock.json files
- Compares installed package versions with latest versions from npm registry
- Automatically updates packages with patch version changes
- Identifies packages that need manual updates (minor or major versions)
- Generates detailed JSON reports of all package versions
- Creates formatted documents (Markdown or HTML) with tables of packages

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/package-automator.git
cd package-automator

# Install dependencies
npm install

# Make the script executable
chmod +x index.js
```

## Configuration

The tool uses environment variables for configuration. You can create a `.env` file based on the provided `.env.example`:

```
# Repository paths (comma-separated list of paths)
REPO_PATHS=/path/to/repo1,/path/to/repo2

# OR Base directory containing multiple repositories
# BASE_DIR=/path/to/base/directory

# Output paths
REPORT_PATH=./reports/report.json
DOCUMENT_PATH=./reports/packages.md
DOCUMENT_FORMAT=markdown # or html
```

## Usage

```bash
# Run with environment variables in .env file
npm start

# Or specify environment variables directly
REPO_PATHS=/path/to/repo1,/path/to/repo2 npm start

# Or use a base directory containing multiple repositories
BASE_DIR=/path/to/base/directory npm start
```

## How It Works

1. **Repository Scanning**: The tool scans the specified repositories or base directory for package.json files.

2. **Package Analysis**: For each repository, it reads the package.json and package-lock.json files to extract dependencies and their versions.

3. **Version Comparison**: It compares the installed versions with the latest versions from the npm registry.

4. **Automatic Updates**: Packages with patch version updates are automatically updated in package.json and package-lock.json.

5. **Report Generation**: A detailed JSON report is generated with information about all packages, including which were updated and which need manual updates.

6. **Document Generation**: A formatted document (Markdown or HTML) is created with tables showing all packages and their status.

## Output

The tool generates two output files:

1. **JSON Report**: A detailed report in JSON format with all package information.
2. **Formatted Document**: A human-readable document (Markdown or HTML) with tables of packages.

## Example Report

```json
{
  "timestamp": "2025-08-29T17:00:00.000Z",
  "summary": {
    "repositoryCount": 2,
    "totalPackages": 50,
    "totalAutoUpdated": 5,
    "totalManualUpdateNeeded": 10,
    "totalCurrent": 35
  },
  "repositories": [
    {
      "path": "/path/to/repo1",
      "name": "repo1",
      "packageCount": 25,
      "autoUpdateCount": 3,
      "manualUpdateCount": 5,
      "currentCount": 17,
      "autoUpdated": true,
      "autoUpdatePackages": {
        "axios": {
          "from": "0.21.1",
          "to": "0.21.4",
          "updateType": "patch"
        }
      },
      "manualUpdatePackages": {
        "react": {
          "from": "17.0.2",
          "to": "18.2.0",
          "updateType": "major"
        }
      }
    }
  ]
}
```

## License

ISC

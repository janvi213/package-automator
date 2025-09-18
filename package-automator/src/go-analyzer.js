const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const semver = require('semver');

/**
 * Go module analyzer
 */
const goAnalyzer = {
  /**
   * Read go.mod file
   * @param {string} goModPath - Path to go.mod file
   * @returns {Promise<Object>} Go module information
   */
  async readGoMod(goModPath) {
    try {
      const content = await fs.readFile(goModPath, 'utf8');
      return this.parseGoMod(content);
    } catch (error) {
      throw new Error(`Failed to read go.mod file: ${error.message}`);
    }
  },

  /**
   * Parse go.mod content
   * @param {string} content - go.mod file content
   * @returns {Object} Parsed go.mod information
   */
  parseGoMod(content) {
    const goMod = {
      module: '',
      go: '',
      requires: {}
    };

    // Extract module name
    const moduleMatch = content.match(/module\s+(.+)/);
    if (moduleMatch) {
      goMod.module = moduleMatch[1].trim();
    }

    // Extract Go version
    const goMatch = content.match(/go\s+(\d+\.\d+(?:\.\d+)?)/);
    if (goMatch) {
      goMod.go = goMatch[1].trim();
    }

    // Extract requires
    const requireRegex = /require\s+([^\s]+)\s+([^\s]+)/g;
    let match;
    while ((match = requireRegex.exec(content)) !== null) {
      const moduleName = match[1].trim();
      const version = match[2].trim().replace(/^v/, '');
      goMod.requires[moduleName] = version;
    }

    // Extract requires from require block
    const requireBlockRegex = /require\s+\(([^)]+)\)/g;
    const blockMatches = content.match(requireBlockRegex);
    if (blockMatches) {
      for (const blockMatch of blockMatches) {
        const blockContent = blockMatch.replace(/require\s+\(|\)/g, '');
        const lines = blockContent.split('\n');
        for (const line of lines) {
          const lineMatch = line.trim().match(/([^\s]+)\s+([^\s]+)/);
          if (lineMatch) {
            const moduleName = lineMatch[1].trim();
            const version = lineMatch[2].trim().replace(/^v/, '');
            goMod.requires[moduleName] = version;
          }
        }
      }
    }

    return goMod;
  },

  /**
   * Get latest Go version
   * @returns {Promise<string>} Latest Go version
   */
  async getLatestGoVersion() {
    try {
      // This is a simplified approach. In a real-world scenario,
      // you might want to fetch this from Go's website or GitHub API
      return '1.22.0'; // Example latest version
    } catch (error) {
      throw new Error(`Failed to get latest Go version: ${error.message}`);
    }
  },

  /**
   * Check if Go version can be automatically updated
   * @param {string} currentVersion - Current Go version
   * @param {string} latestVersion - Latest Go version
   * @returns {Object} Update information
   */
  checkGoVersionUpdate(currentVersion, latestVersion) {
    const current = semver.coerce(currentVersion);
    const latest = semver.coerce(latestVersion);

    if (!current || !latest) {
      return {
        updateType: 'unknown',
        canAutoUpdate: false
      };
    }

    if (semver.eq(current, latest)) {
      return {
        updateType: 'current',
        canAutoUpdate: false
      };
    }

    if (semver.major(current) < semver.major(latest)) {
      return {
        updateType: 'major',
        canAutoUpdate: false
      };
    }

    if (semver.minor(current) < semver.minor(latest)) {
      return {
        updateType: 'minor',
        canAutoUpdate: false
      };
    }

    if (semver.patch(current) < semver.patch(latest)) {
      return {
        updateType: 'patch',
        canAutoUpdate: true
      };
    }

    return {
      updateType: 'unknown',
      canAutoUpdate: false
    };
  },

  /**
   * Update Go version in go.mod file
   * @param {string} goModPath - Path to go.mod file
   * @param {string} newVersion - New Go version
   * @returns {Promise<boolean>} Success status
   */
  async updateGoVersion(goModPath, newVersion) {
    try {
      const content = await fs.readFile(goModPath, 'utf8');
      const updatedContent = content.replace(
        /go\s+(\d+\.\d+(?:\.\d+)?)/,
        `go ${newVersion}`
      );
      await fs.writeFile(goModPath, updatedContent);
      return true;
    } catch (error) {
      throw new Error(`Failed to update Go version: ${error.message}`);
    }
  },

  /**
   * Run go mod tidy
   * @param {string} repoPath - Repository path
   * @returns {Promise<boolean>} Success status
   */
  async runGoModTidy(repoPath) {
    try {
      execSync('go mod tidy', { cwd: repoPath });
      return true;
    } catch (error) {
      throw new Error(`Failed to run go mod tidy: ${error.message}`);
    }
  }
};

module.exports = goAnalyzer;

// Made with Bob

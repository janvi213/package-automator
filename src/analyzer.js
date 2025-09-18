const fs = require('fs-extra');
const axios = require('axios');
const semver = require('semver');

/**
 * Package analyzer module
 */
const analyzer = {
  /**
   * Read and parse package.json file
   * @param {string} packageJsonPath - Path to package.json file
   * @returns {Promise<Object>} Parsed package.json content
   */
  async readPackageJson(packageJsonPath) {
    try {
      const content = await fs.readFile(packageJsonPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to read package.json at ${packageJsonPath}: ${error.message}`);
    }
  },
  
  /**
   * Read and parse package-lock.json file
   * @param {string} packageLockPath - Path to package-lock.json file
   * @returns {Promise<Object>} Parsed package-lock.json content
   */
  async readPackageLock(packageLockPath) {
    if (!packageLockPath) {
      return null;
    }
    
    try {
      const content = await fs.readFile(packageLockPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(`Warning: Failed to read package-lock.json at ${packageLockPath}: ${error.message}`);
      return null;
    }
  },
  
  /**
   * Extract all dependencies from package.json
   * @param {Object} packageJson - Parsed package.json content
   * @returns {Object} Object with all dependencies
   */
  extractDependencies(packageJson) {
    const dependencies = {};
    
    // Regular dependencies
    if (packageJson.dependencies) {
      Object.assign(dependencies, packageJson.dependencies);
    }
    
    // Dev dependencies
    if (packageJson.devDependencies) {
      Object.assign(dependencies, packageJson.devDependencies);
    }
    
    // Optional dependencies
    if (packageJson.optionalDependencies) {
      Object.assign(dependencies, packageJson.optionalDependencies);
    }
    
    return dependencies;
  },
  
  /**
   * Get exact installed versions from package-lock.json
   * @param {Object} packageLock - Parsed package-lock.json content
   * @param {Object} dependencies - Dependencies from package.json
   * @returns {Object} Object with exact installed versions
   */
  getInstalledVersions(packageLock, dependencies) {
    const installedVersions = {};
    const packageNames = Object.keys(dependencies);
    
    // If no package-lock.json, use the versions from package.json
    if (!packageLock) {
      for (const name of packageNames) {
        // Remove version range indicators (^, ~, etc.)
        installedVersions[name] = dependencies[name].replace(/[\^~>=<]/g, '');
      }
      return installedVersions;
    }
    
    // Use package-lock.json for exact versions
    // Handle different package-lock.json formats (v1 vs v2+)
    if (packageLock.dependencies) {
      for (const name of packageNames) {
        if (packageLock.dependencies[name] && packageLock.dependencies[name].version) {
          installedVersions[name] = packageLock.dependencies[name].version;
        } else {
          // Fallback to package.json version if not found in package-lock
          installedVersions[name] = dependencies[name].replace(/[\^~>=<]/g, '');
        }
      }
    } else if (packageLock.packages) {
      // Handle npm v7+ package-lock format
      for (const name of packageNames) {
        const pkgInfo = packageLock.packages[`node_modules/${name}`];
        if (pkgInfo && pkgInfo.version) {
          installedVersions[name] = pkgInfo.version;
        } else {
          // Fallback to package.json version
          installedVersions[name] = dependencies[name].replace(/[\^~>=<]/g, '');
        }
      }
    }
    
    return installedVersions;
  },
  
  /**
   * Fetch latest versions from npm registry
   * @param {Array} packageNames - Array of package names
   * @returns {Promise<Object>} Object with latest versions
   */
  async fetchLatestVersions(packageNames) {
    const latestVersions = {};
    
    // Process in batches to avoid overwhelming the npm registry
    const batchSize = 10;
    for (let i = 0; i < packageNames.length; i += batchSize) {
      const batch = packageNames.slice(i, i + batchSize);
      const promises = batch.map(name => this.fetchPackageInfo(name));
      
      const results = await Promise.allSettled(promises);
      
      results.forEach((result, index) => {
        const packageName = batch[index];
        if (result.status === 'fulfilled' && result.value) {
          latestVersions[packageName] = result.value;
        } else {
          console.warn(`Warning: Failed to fetch info for ${packageName}: ${result.reason}`);
          latestVersions[packageName] = null;
        }
      });
      
      // Add a small delay between batches
      if (i + batchSize < packageNames.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return latestVersions;
  },
  
  /**
   * Fetch package information from npm registry
   * @param {string} packageName - Package name
   * @returns {Promise<string>} Latest version
   */
  async fetchPackageInfo(packageName) {
    try {
      const response = await axios.get(`https://registry.npmjs.org/${packageName}`);
      return response.data['dist-tags'].latest;
    } catch (error) {
      throw new Error(`Failed to fetch info for ${packageName}: ${error.message}`);
    }
  }
};

module.exports = analyzer;


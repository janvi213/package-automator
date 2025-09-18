const semver = require('semver');

/**
 * Version comparator module
 */
const comparator = {
  /**
   * Compare installed versions with latest versions
   * @param {Object} installedVersions - Object with installed versions
   * @param {Object} latestVersions - Object with latest versions
   * @returns {Object} Comparison results
   */
  compareVersions(installedVersions, latestVersions) {
    const results = {};
    
    for (const packageName in installedVersions) {
      const installed = installedVersions[packageName];
      const latest = latestVersions[packageName];
      
      // Skip if we couldn't fetch the latest version
      if (!latest) {
        results[packageName] = {
          installed,
          latest: null,
          updateType: 'unknown',
          canAutoUpdate: false
        };
        continue;
      }
      
      // Skip if already at latest version
      if (installed === latest) {
        results[packageName] = {
          installed,
          latest,
          updateType: 'current',
          canAutoUpdate: false
        };
        continue;
      }
      
      // Determine update type
      const updateType = this.getUpdateType(installed, latest);
      
      results[packageName] = {
        installed,
        latest,
        updateType,
        canAutoUpdate: updateType === 'patch'
      };
    }
    
    return results;
  },
  
  /**
   * Determine the type of update (patch, minor, major)
   * @param {string} installed - Installed version
   * @param {string} latest - Latest version
   * @returns {string} Update type
   */
  getUpdateType(installed, latest) {
    if (!semver.valid(installed) || !semver.valid(latest)) {
      return 'unknown';
    }
    
    if (semver.major(latest) > semver.major(installed)) {
      return 'major';
    }
    
    if (semver.minor(latest) > semver.minor(installed)) {
      return 'minor';
    }
    
    if (semver.patch(latest) > semver.patch(installed)) {
      return 'patch';
    }
    
    return 'current';
  },
  
  /**
   * Get packages that can be automatically updated (patch updates)
   * @param {Object} comparisonResults - Results from compareVersions
   * @returns {Object} Packages that can be auto-updated
   */
  getAutoUpdatePackages(comparisonResults) {
    const autoUpdatePackages = {};
    
    for (const packageName in comparisonResults) {
      const result = comparisonResults[packageName];
      if (result.canAutoUpdate) {
        autoUpdatePackages[packageName] = result.latest;
      }
    }
    
    return autoUpdatePackages;
  },
  
  /**
   * Get packages that need manual updates (minor or major updates)
   * @param {Object} comparisonResults - Results from compareVersions
   * @returns {Object} Packages that need manual updates
   */
  getManualUpdatePackages(comparisonResults) {
    const manualUpdatePackages = {};
    
    for (const packageName in comparisonResults) {
      const result = comparisonResults[packageName];
      if (result.updateType === 'minor' || result.updateType === 'major') {
        manualUpdatePackages[packageName] = {
          installed: result.installed,
          latest: result.latest,
          updateType: result.updateType
        };
      }
    }
    
    return manualUpdatePackages;
  }
};

module.exports = comparator;



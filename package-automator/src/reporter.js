const fs = require('fs-extra');
const path = require('path');
const config = require('./config');

/**
 * Report generator module
 */
const reporter = {
  /**
   * Generate a report for a repository
   * @param {Object} repository - Repository object
   * @param {Object} comparisonResults - Version comparison results
   * @param {Object} updateResults - Update results (if any)
   * @returns {Object} Repository report
   */
  generateRepositoryReport(repository, comparisonResults, updateResults = null) {
    const autoUpdatePackages = {};
    const manualUpdatePackages = {};
    const currentPackages = {};
    
    // Categorize packages
    for (const packageName in comparisonResults) {
      const result = comparisonResults[packageName];
      
      if (result.updateType === 'current') {
        currentPackages[packageName] = {
          version: result.installed
        };
      } else if (result.canAutoUpdate) {
        autoUpdatePackages[packageName] = {
          from: result.installed,
          to: result.latest,
          updateType: result.updateType
        };
      } else if (result.updateType === 'minor' || result.updateType === 'major') {
        manualUpdatePackages[packageName] = {
          from: result.installed,
          to: result.latest,
          updateType: result.updateType
        };
      }
    }
    
    // Create repository report
    const repoReport = {
      path: repository.path,
      name: path.basename(repository.path),
      type: repository.type || 'npm',
      packageCount: Object.keys(comparisonResults).length,
      autoUpdateCount: Object.keys(autoUpdatePackages).length,
      manualUpdateCount: Object.keys(manualUpdatePackages).length,
      currentCount: Object.keys(currentPackages).length,
      autoUpdated: updateResults ? updateResults.updated : false,
      autoUpdatePackages,
      manualUpdatePackages,
      currentPackages
    };
    
    // Add update results if available
    if (updateResults && updateResults.updated) {
      if (repository.type === 'npm') {
        repoReport.updateResults = {
          packageLockUpdated: updateResults.packageLockUpdated,
          updatedDependencies: updateResults.updatedDependencies
        };
      } else if (repository.type === 'go') {
        repoReport.updateResults = {
          goModUpdated: updateResults.goModUpdated,
          goModTidied: updateResults.goModTidied
        };
      }
    }
    
    return repoReport;
  },
  
  /**
   * Generate a consolidated report for all repositories
   * @param {Array} repositoryReports - Array of repository reports
   * @returns {Object} Consolidated report
   */
  generateConsolidatedReport(repositoryReports) {
    // Calculate summary statistics
    let totalPackages = 0;
    let totalAutoUpdated = 0;
    let totalManualUpdateNeeded = 0;
    let totalCurrent = 0;
    
    repositoryReports.forEach(report => {
      totalPackages += report.packageCount;
      totalAutoUpdated += report.autoUpdateCount;
      totalManualUpdateNeeded += report.manualUpdateCount;
      totalCurrent += report.currentCount;
    });
    
    // Create consolidated report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        repositoryCount: repositoryReports.length,
        totalPackages,
        totalAutoUpdated,
        totalManualUpdateNeeded,
        totalCurrent
      },
      repositories: repositoryReports
    };
    
    return report;
  },
  
  /**
   * Write report to file
   * @param {Object} report - Consolidated report
   * @returns {Promise<string>} Path to the report file
   */
  async writeReport(report) {
    try {
      const reportPath = config.reportPath;
      await fs.ensureDir(path.dirname(reportPath));
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      return reportPath;
    } catch (error) {
      throw new Error(`Failed to write report: ${error.message}`);
    }
  }
};

module.exports = reporter;

// Made with Bob

const fs = require('fs-extra');
const path = require('path');
const goAnalyzer = require('./go-analyzer');

/**
 * Go module updater
 */
const goUpdater = {
  /**
   * Update Go version in a repository
   * @param {Object} repository - Repository object
   * @param {string} newVersion - New Go version
   * @returns {Promise<Object>} Update results
   */
  async updateGoVersion(repository, newVersion) {
    try {
      const result = {
        updated: false,
        goModUpdated: false,
        goModTidied: false,
        error: null
      };

      // Update Go version in go.mod
      const goVersionUpdated = await goAnalyzer.updateGoVersion(repository.goModPath, newVersion);
      result.goModUpdated = goVersionUpdated;

      // Run go mod tidy
      if (goVersionUpdated) {
        try {
          const tidyResult = await goAnalyzer.runGoModTidy(repository.path);
          result.goModTidied = tidyResult;
        } catch (tidyError) {
          console.warn(`Warning: Failed to run go mod tidy: ${tidyError.message}`);
          // Continue even if tidy fails
        }
      }

      result.updated = result.goModUpdated;
      return result;
    } catch (error) {
      return {
        updated: false,
        goModUpdated: false,
        goModTidied: false,
        error: error.message
      };
    }
  }
};

module.exports = goUpdater;

// Made with Bob

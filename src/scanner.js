const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const config = require('./config');

/**
 * Repository scanner module
 */
const scanner = {
  /**
   * Find all repositories with package.json or go.mod files
   * @returns {Promise<Array>} Array of repository objects with paths
   */
  async findRepositories() {
    const repositories = [];
    
    // If specific repo paths are provided
    if (config.repoPaths && config.repoPaths.length > 0) {
      for (const repoPath of config.repoPaths) {
        const normalizedPath = path.normalize(repoPath);
        const packageJsonPath = path.normalize(path.join(normalizedPath, 'package.json'));
        const packageLockPath = path.normalize(path.join(normalizedPath, 'package-lock.json'));
        const goModPath = path.normalize(path.join(normalizedPath, 'go.mod'));
        
        // Check for package.json
        if (await fs.pathExists(packageJsonPath)) {
          repositories.push({
            path: normalizedPath,
            type: 'npm',
            packageJsonPath,
            packageLockPath: await fs.pathExists(packageLockPath) ? packageLockPath : null
          });
        }
        // Check for go.mod
        else if (await fs.pathExists(goModPath)) {
          repositories.push({
            path: normalizedPath,
            type: 'go',
            goModPath
          });
        }
      }
    }
    // If a base directory is provided, scan for package.json and go.mod files
    else if (config.baseDir) {
      const normalizedBaseDir = path.normalize(config.baseDir);
      
      // Find package.json files
      const packageJsonPaths = await this.findFiles(normalizedBaseDir, '**/package.json');
      for (const packageJsonPath of packageJsonPaths) {
        const normalizedPackageJsonPath = path.normalize(packageJsonPath);
        const repoPath = path.dirname(normalizedPackageJsonPath);
        const packageLockPath = path.normalize(path.join(repoPath, 'package-lock.json'));
        
        repositories.push({
          path: repoPath,
          type: 'npm',
          packageJsonPath: normalizedPackageJsonPath,
          packageLockPath: await fs.pathExists(packageLockPath) ? packageLockPath : null
        });
      }
      
      // Find go.mod files
      const goModPaths = await this.findFiles(normalizedBaseDir, '**/go.mod');
      for (const goModPath of goModPaths) {
        const normalizedGoModPath = path.normalize(goModPath);
        const repoPath = path.dirname(normalizedGoModPath);
        
        // Skip if already added as npm repository
        if (!repositories.some(repo => repo.path === repoPath)) {
          repositories.push({
            path: repoPath,
            type: 'go',
            goModPath: normalizedGoModPath
          });
        }
      }
    }
    
    return repositories;
  },
  
  /**
   * Find files matching a pattern in a directory (recursively)
   * @param {string} baseDir - Base directory to scan
   * @param {string} pattern - Glob pattern to match
   * @returns {Promise<Array>} Array of file paths
   */
  async findFiles(baseDir, pattern) {
    return new Promise((resolve, reject) => {
      glob(pattern, {
        cwd: baseDir,
        absolute: true,
        ignore: ['**/node_modules/**', '**/vendor/**']
      }, (err, files) => {
        if (err) {
          reject(err);
        } else {
          // Normalize all paths
          resolve(files.map(file => path.normalize(file)));
        }
      });
    });
  }
};

module.exports = scanner;

// Made with Bob

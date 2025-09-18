const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Package updater module
 */
const updater = {
  /**
   * Update packages in package.json
   * @param {string} packageJsonPath - Path to package.json
   * @param {Object} packagesToUpdate - Packages to update with their versions
   * @returns {Promise<Object>} Updated package.json content
   */
  async updatePackageJson(packageJsonPath, packagesToUpdate) {
    try {
      // Read and parse package.json
      const content = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(content);
      
      // Track which dependencies were updated
      const updatedDependencies = {};
      
      // Update dependencies
      if (packageJson.dependencies) {
        for (const packageName in packagesToUpdate) {
          if (packageJson.dependencies[packageName]) {
            const newVersion = packagesToUpdate[packageName];
            packageJson.dependencies[packageName] = `^${newVersion}`;
            updatedDependencies[packageName] = {
              type: 'dependencies',
              from: packageJson.dependencies[packageName],
              to: `^${newVersion}`
            };
          }
        }
      }
      
      // Update devDependencies
      if (packageJson.devDependencies) {
        for (const packageName in packagesToUpdate) {
          if (packageJson.devDependencies[packageName]) {
            const newVersion = packagesToUpdate[packageName];
            packageJson.devDependencies[packageName] = `^${newVersion}`;
            updatedDependencies[packageName] = {
              type: 'devDependencies',
              from: packageJson.devDependencies[packageName],
              to: `^${newVersion}`
            };
          }
        }
      }
      
      // Update optionalDependencies
      if (packageJson.optionalDependencies) {
        for (const packageName in packagesToUpdate) {
          if (packageJson.optionalDependencies[packageName]) {
            const newVersion = packagesToUpdate[packageName];
            packageJson.optionalDependencies[packageName] = `^${newVersion}`;
            updatedDependencies[packageName] = {
              type: 'optionalDependencies',
              from: packageJson.optionalDependencies[packageName],
              to: `^${newVersion}`
            };
          }
        }
      }
      
      // Write updated package.json
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
      
      return {
        packageJson,
        updatedDependencies
      };
    } catch (error) {
      throw new Error(`Failed to update package.json at ${packageJsonPath}: ${error.message}`);
    }
  },
  
  /**
   * Run npm install to update package-lock.json
   * @param {string} repoPath - Repository path
   * @returns {Promise<void>}
   */
  async updatePackageLock(repoPath) {
    try {
      console.log(`Running npm install in ${repoPath}...`);
      const { stdout, stderr } = await execPromise('npm install', { cwd: repoPath });
      
      if (stderr && !stderr.includes('npm notice')) {
        console.warn(`Warning during npm install: ${stderr}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error running npm install in ${repoPath}: ${error.message}`);
      return false;
    }
  },
  
  /**
   * Update packages in a repository
   * @param {Object} repository - Repository object
   * @param {Object} packagesToUpdate - Packages to update with their versions
   * @returns {Promise<Object>} Update results
   */
  async updatePackages(repository, packagesToUpdate) {
    const packageCount = Object.keys(packagesToUpdate).length;
    if (packageCount === 0) {
      return {
        repository: repository.path,
        updated: false,
        message: 'No packages to update',
        updatedDependencies: {}
      };
    }
    
    try {
      console.log(`Updating ${packageCount} packages in ${repository.path}...`);
      
      // Update package.json
      const { updatedDependencies } = await this.updatePackageJson(
        repository.packageJsonPath, 
        packagesToUpdate
      );
      
      // Update package-lock.json if it exists
      let packageLockUpdated = false;
      if (repository.packageLockPath) {
        packageLockUpdated = await this.updatePackageLock(repository.path);
      }
      
      return {
        repository: repository.path,
        updated: true,
        packageLockUpdated,
        updatedDependencies
      };
    } catch (error) {
      return {
        repository: repository.path,
        updated: false,
        error: error.message,
        updatedDependencies: {}
      };
    }
  }
};

module.exports = updater;

// Made with Bob

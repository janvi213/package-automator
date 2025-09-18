#!/usr/bin/env node

const scanner = require('./src/scanner');
const analyzer = require('./src/analyzer');
const comparator = require('./src/comparator');
const updater = require('./src/updater');
const goAnalyzer = require('./src/go-analyzer');
const goUpdater = require('./src/go-updater');
const reporter = require('./src/reporter');
const documentGenerator = require('./src/document');
const config = require('./src/config');

/**
 * Process an npm repository
 * @param {Object} repository - Repository object
 * @param {Array} repositoryReports - Array to store repository reports
 */
async function processNpmRepository(repository, repositoryReports) {
  console.log('Reading package.json...');
  const packageJson = await analyzer.readPackageJson(repository.packageJsonPath);
  
  // Read package-lock.json if available
  let packageLock = null;
  if (repository.packageLockPath) {
    console.log('Reading package-lock.json...');
    packageLock = await analyzer.readPackageLock(repository.packageLockPath);
  }
  
  // Extract dependencies
  console.log('Extracting dependencies...');
  const dependencies = analyzer.extractDependencies(packageJson);
  const packageNames = Object.keys(dependencies);
  
  if (packageNames.length === 0) {
    console.log('No dependencies found in this repository.');
    return;
  }
  
  console.log(`Found ${packageNames.length} dependencies`);
  
  // Get installed versions
  console.log('Getting installed versions...');
  const installedVersions = analyzer.getInstalledVersions(packageLock, dependencies);
  
  // Fetch latest versions from npm
  console.log('Fetching latest versions from npm...');
  const latestVersions = await analyzer.fetchLatestVersions(packageNames);
  
  // Compare versions
  console.log('Comparing versions...');
  const comparisonResults = comparator.compareVersions(installedVersions, latestVersions);
  
  // Get packages that can be automatically updated
  const autoUpdatePackages = comparator.getAutoUpdatePackages(comparisonResults);
  const autoUpdateCount = Object.keys(autoUpdatePackages).length;
  
  // Get packages that need manual updates
  const manualUpdatePackages = comparator.getManualUpdatePackages(comparisonResults);
  const manualUpdateCount = Object.keys(manualUpdatePackages).length;
  
  console.log(`Found ${autoUpdateCount} packages that can be automatically updated`);
  console.log(`Found ${manualUpdateCount} packages that need manual updates`);
  
  // Update packages if there are any to update
  let updateResults = null;
  if (autoUpdateCount > 0) {
    console.log('Updating packages...');
    updateResults = await updater.updatePackages(repository, autoUpdatePackages);
    
    if (updateResults.updated) {
      console.log('Packages updated successfully');
    } else {
      console.log(`Failed to update packages: ${updateResults.error || 'Unknown error'}`);
    }
  }
  
  // Generate repository report
  const repoReport = reporter.generateRepositoryReport(repository, comparisonResults, updateResults);
  repositoryReports.push(repoReport);
}

/**
 * Process a Go repository
 * @param {Object} repository - Repository object
 * @param {Array} repositoryReports - Array to store repository reports
 */
async function processGoRepository(repository, repositoryReports) {
  console.log('Reading go.mod...');
  const goMod = await goAnalyzer.readGoMod(repository.goModPath);
  
  console.log(`Module: ${goMod.module}`);
  console.log(`Go version: ${goMod.go}`);
  
  // Get latest Go version
  console.log('Fetching latest Go version...');
  const latestGoVersion = await goAnalyzer.getLatestGoVersion();
  
  // Compare versions
  console.log('Comparing Go versions...');
  const versionComparison = goAnalyzer.checkGoVersionUpdate(goMod.go, latestGoVersion);
  
  // Create comparison results object similar to npm packages
  const comparisonResults = {
    'go': {
      installed: goMod.go,
      latest: latestGoVersion,
      updateType: versionComparison.updateType,
      canAutoUpdate: versionComparison.canAutoUpdate
    }
  };
  
  // Update Go version if it's a patch update
  let updateResults = null;
  if (versionComparison.canAutoUpdate) {
    console.log(`Updating Go version from ${goMod.go} to ${latestGoVersion}...`);
    updateResults = await goUpdater.updateGoVersion(repository, latestGoVersion);
    
    if (updateResults.updated) {
      console.log('Go version updated successfully');
    } else {
      console.log(`Failed to update Go version: ${updateResults.error || 'Unknown error'}`);
    }
  } else if (versionComparison.updateType !== 'current') {
    console.log(`Go version ${latestGoVersion} available, but requires manual update (${versionComparison.updateType})`);
  } else {
    console.log('Go version is already at the latest version');
  }
  
  // Generate repository report
  const repoReport = reporter.generateRepositoryReport(repository, comparisonResults, updateResults);
  repositoryReports.push(repoReport);
}

/**
 * Main function to run the package automator
 */
async function main() {
  try {
    console.log('Package Automator starting...');
    console.log(`Using configuration: ${JSON.stringify(config, null, 2)}`);
    
    // Find repositories
    console.log('Scanning for repositories...');
    const repositories = await scanner.findRepositories();
    console.log(`Found ${repositories.length} repositories`);
    
    if (repositories.length === 0) {
      console.error('No repositories found. Please check your configuration.');
      process.exit(1);
    }
    
    // Process each repository
    const repositoryReports = [];
    
    for (const repository of repositories) {
      console.log(`\nProcessing repository: ${repository.path}`);
      
      try {
        if (repository.type === 'npm') {
          // Process npm repository
          await processNpmRepository(repository, repositoryReports);
        } else if (repository.type === 'go') {
          // Process Go repository
          await processGoRepository(repository, repositoryReports);
        }
        
      } catch (error) {
        console.error(`Error processing repository ${repository.path}: ${error.message}`);
        repositoryReports.push({
          path: repository.path,
          name: require('path').basename(repository.path),
          error: error.message
        });
      }
    }
    
    // Generate consolidated report
    console.log('\nGenerating consolidated report...');
    const consolidatedReport = reporter.generateConsolidatedReport(repositoryReports);
    
    // Write report to file
    const reportPath = await reporter.writeReport(consolidatedReport);
    console.log(`Report saved to: ${reportPath}`);
    
    // Generate formatted documents
    console.log('Generating formatted documents...');
    const documentPaths = await documentGenerator.generateDocument(consolidatedReport);
    console.log(`Main document saved to: ${documentPaths[0]}`);
    
    if (documentPaths.length > 1) {
      console.log(`Generated ${documentPaths.length - 1} individual repository reports`);
    }
    
    console.log('\nPackage Automator completed successfully');
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);

// Made with Bob

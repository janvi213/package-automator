require('dotenv').config();
const path = require('path');
const fs = require('fs-extra');

/**
 * Configuration module for the package automator
 */
const config = {
  // Repository paths to scan
  repoPaths: [],
  
  // Output paths
  reportPath: process.env.REPORT_PATH || './reports/report.json',
  documentPath: process.env.DOCUMENT_PATH || './reports/packages.md',
  documentFormat: process.env.DOCUMENT_FORMAT || 'markdown',
  generateSeparateReports: process.env.GENERATE_SEPARATE_REPORTS !== 'false', // Default to true
  
  /**
   * Initialize configuration
   */
  init() {
    // Get repository paths from environment variables
    if (process.env.REPO_PATHS) {
      this.repoPaths = process.env.REPO_PATHS.split(',')
        .map(p => path.normalize(p.trim()));
    } else if (process.env.BASE_DIR) {
      this.baseDir = path.normalize(process.env.BASE_DIR);
      // Repositories will be scanned in the scanner module
    } else {
      // Default to current directory if no paths provided
      this.repoPaths = [path.normalize(process.cwd())];
    }
    
    // Normalize output paths
    this.reportPath = path.normalize(this.reportPath);
    this.documentPath = path.normalize(this.documentPath);
    
    // Ensure output directories exist
    const reportDir = path.dirname(this.reportPath);
    const documentDir = path.dirname(this.documentPath);
    fs.ensureDirSync(reportDir);
    fs.ensureDirSync(documentDir);
    
    return this;
  }
};

module.exports = config.init();



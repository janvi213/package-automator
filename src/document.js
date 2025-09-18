const fs = require('fs-extra');
const path = require('path');
const config = require('./config');

/**
 * Document generator module
 */
const documentGenerator = {
  /**
   * Generate formatted documents with tables of packages
   * @param {Object} report - Consolidated report
   * @returns {Promise<Array<string>>} Paths to the document files
   */
  async generateDocument(report) {
    try {
      const documentPaths = [];
      
      // Generate consolidated report
      let consolidatedContent = '';
      if (config.documentFormat === 'html') {
        consolidatedContent = this.generateHtmlDocument(report);
      } else {
        // Default to markdown
        consolidatedContent = this.generateMarkdownDocument(report);
      }
      
      const consolidatedDocPath = config.documentPath;
      await fs.ensureDir(path.dirname(consolidatedDocPath));
      await fs.writeFile(consolidatedDocPath, consolidatedContent);
      documentPaths.push(consolidatedDocPath);
      
      // Generate individual repository reports if enabled
      if (config.generateSeparateReports) {
        for (const repoReport of report.repositories) {
          let repoContent = '';
          const fileExt = config.documentFormat === 'html' ? '.html' : '.md';
          const repoDocPath = path.join(
            path.dirname(config.documentPath),
            `${repoReport.name}${fileExt}`
          );
          
          if (config.documentFormat === 'html') {
            repoContent = this.generateHtmlDocumentForRepo(repoReport);
          } else {
            // Default to markdown
            repoContent = this.generateMarkdownDocumentForRepo(repoReport);
          }
          
          await fs.writeFile(repoDocPath, repoContent);
          documentPaths.push(repoDocPath);
        }
      }
      
      return documentPaths;
    } catch (error) {
      throw new Error(`Failed to write document: ${error.message}`);
    }
  },
  
  /**
   * Generate a markdown document for the consolidated report
   * @param {Object} report - Consolidated report
   * @returns {string} Markdown content
   */
  generateMarkdownDocument(report) {
    let markdown = '# Package Automator Report\n\n';
    
    // Add timestamp
    markdown += `Generated on: ${new Date(report.timestamp).toLocaleString()}\n\n`;
    
    // Add summary
    markdown += '## Summary\n\n';
    markdown += `- Repositories scanned: ${report.summary.repositoryCount}\n`;
    markdown += `- Total packages: ${report.summary.totalPackages}\n`;
    markdown += `- Packages automatically updated: ${report.summary.totalAutoUpdated}\n`;
    markdown += `- Packages requiring manual updates: ${report.summary.totalManualUpdateNeeded}\n`;
    markdown += `- Packages already at latest version: ${report.summary.totalCurrent}\n\n`;
    
    // Add repository details
    for (const repoReport of report.repositories) {
      markdown += `## Repository: ${repoReport.name}\n\n`;
      markdown += `Path: ${repoReport.path}\n\n`;
      
      // Add table of all packages
      markdown += '### Packages\n\n';
      markdown += '| Package Name | Current Version | Latest Version | Status |\n';
      markdown += '|-------------|----------------|---------------|--------|\n';
      
      // Add auto-updated packages
      for (const packageName in repoReport.autoUpdatePackages) {
        const pkg = repoReport.autoUpdatePackages[packageName];
        markdown += `| ${packageName} | ${pkg.from} | ${pkg.to} | ✅ Updated (${pkg.updateType}) |\n`;
      }
      
      // Add packages needing manual updates
      for (const packageName in repoReport.manualUpdatePackages) {
        const pkg = repoReport.manualUpdatePackages[packageName];
        markdown += `| ${packageName} | ${pkg.from} | ${pkg.to} | ⚠️ ${pkg.updateType.charAt(0).toUpperCase() + pkg.updateType.slice(1)} update required |\n`;
      }
      
      // Add current packages
      for (const packageName in repoReport.currentPackages) {
        const pkg = repoReport.currentPackages[packageName];
        markdown += `| ${packageName} | ${pkg.version} | ${pkg.version} | ✓ Current |\n`;
      }
      
      markdown += '\n';
    }
    
    return markdown;
  },
  
  /**
   * Generate a markdown document for a single repository
   * @param {Object} repoReport - Repository report
   * @returns {string} Markdown content
   */
  generateMarkdownDocumentForRepo(repoReport) {
    let markdown = `# Package Automator Report - ${repoReport.name}\n\n`;
    
    // Add timestamp
    markdown += `Generated on: ${new Date().toLocaleString()}\n\n`;
    
    // Add repository details
    markdown += `## Repository: ${repoReport.name}\n\n`;
    markdown += `Path: ${repoReport.path}\n\n`;
    markdown += `Type: ${repoReport.type}\n\n`;
    
    // Add summary
    markdown += '## Summary\n\n';
    markdown += `- Total packages: ${repoReport.packageCount}\n`;
    markdown += `- Packages automatically updated: ${repoReport.autoUpdateCount}\n`;
    markdown += `- Packages requiring manual updates: ${repoReport.manualUpdateCount}\n`;
    markdown += `- Packages already at latest version: ${repoReport.currentCount}\n\n`;
    
    // Add repository type
    markdown += `Type: ${repoReport.type}\n\n`;
    
    // Add table of all packages
    markdown += '### Packages\n\n';
    markdown += '| Package Name | Current Version | Latest Version | Status |\n';
    markdown += '|-------------|----------------|---------------|--------|\n';
    
    // Add auto-updated packages
    for (const packageName in repoReport.autoUpdatePackages) {
      const pkg = repoReport.autoUpdatePackages[packageName];
      markdown += `| ${packageName} | ${pkg.from} | ${pkg.to} | ✅ Updated (${pkg.updateType}) |\n`;
    }
    
    // Add packages needing manual updates
    for (const packageName in repoReport.manualUpdatePackages) {
      const pkg = repoReport.manualUpdatePackages[packageName];
      markdown += `| ${packageName} | ${pkg.from} | ${pkg.to} | ⚠️ ${pkg.updateType.charAt(0).toUpperCase() + pkg.updateType.slice(1)} update required |\n`;
    }
    
    // Add current packages
    for (const packageName in repoReport.currentPackages) {
      const pkg = repoReport.currentPackages[packageName];
      markdown += `| ${packageName} | ${pkg.version} | ${pkg.version} | ✓ Current |\n`;
    }
    
    return markdown;
  },
  
  /**
   * Generate an HTML document for the consolidated report
   * @param {Object} report - Consolidated report
   * @returns {string} HTML content
   */
  generateHtmlDocument(report) {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Package Automator Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #0366d6;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 20px;
    }
    th, td {
      text-align: left;
      padding: 8px;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f6f8fa;
    }
    tr:hover {
      background-color: #f6f8fa;
    }
    .updated {
      color: #22863a;
    }
    .manual {
      color: #cb2431;
    }
    .current {
      color: #6f42c1;
    }
    .summary {
      background-color: #f6f8fa;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <h1>Package Automator Report</h1>
  
  <p>Generated on: ${new Date(report.timestamp).toLocaleString()}</p>
  
  <div class="summary">
    <h2>Summary</h2>
    <ul>
      <li>Repositories scanned: ${report.summary.repositoryCount}</li>
      <li>Total packages: ${report.summary.totalPackages}</li>
      <li>Packages automatically updated: ${report.summary.totalAutoUpdated}</li>
      <li>Packages requiring manual updates: ${report.summary.totalManualUpdateNeeded}</li>
      <li>Packages already at latest version: ${report.summary.totalCurrent}</li>
    </ul>
  </div>
`;
    
    // Add repository details
    for (const repoReport of report.repositories) {
      html += `
  <h2>Repository: ${repoReport.name}</h2>
  <p>Path: ${repoReport.path}</p>
  <p>Type: ${repoReport.type}</p>
  
  <h3>Packages</h3>
  <table>
    <thead>
      <tr>
        <th>Package Name</th>
        <th>Current Version</th>
        <th>Latest Version</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
`;
      
      // Add auto-updated packages
      for (const packageName in repoReport.autoUpdatePackages) {
        const pkg = repoReport.autoUpdatePackages[packageName];
        html += `
      <tr>
        <td>${packageName}</td>
        <td>${pkg.from}</td>
        <td>${pkg.to}</td>
        <td class="updated">✅ Updated (${pkg.updateType})</td>
      </tr>
`;
      }
      
      // Add packages needing manual updates
      for (const packageName in repoReport.manualUpdatePackages) {
        const pkg = repoReport.manualUpdatePackages[packageName];
        html += `
      <tr>
        <td>${packageName}</td>
        <td>${pkg.from}</td>
        <td>${pkg.to}</td>
        <td class="manual">⚠️ ${pkg.updateType.charAt(0).toUpperCase() + pkg.updateType.slice(1)} update required</td>
      </tr>
`;
      }
      
      // Add current packages
      for (const packageName in repoReport.currentPackages) {
        const pkg = repoReport.currentPackages[packageName];
        html += `
      <tr>
        <td>${packageName}</td>
        <td>${pkg.version}</td>
        <td>${pkg.version}</td>
        <td class="current">✓ Current</td>
      </tr>
`;
      }
      
      html += `
    </tbody>
  </table>
`;
    }
    
    html += `
</body>
</html>
`;
    
    return html;
  },
  
  /**
   * Generate an HTML document for a single repository
   * @param {Object} repoReport - Repository report
   * @returns {string} HTML content
   */
  generateHtmlDocumentForRepo(repoReport) {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Package Automator Report - ${repoReport.name}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #0366d6;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 20px;
    }
    th, td {
      text-align: left;
      padding: 8px;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f6f8fa;
    }
    tr:hover {
      background-color: #f6f8fa;
    }
    .updated {
      color: #22863a;
    }
    .manual {
      color: #cb2431;
    }
    .current {
      color: #6f42c1;
    }
    .summary {
      background-color: #f6f8fa;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <h1>Package Automator Report - ${repoReport.name}</h1>
  
  <p>Generated on: ${new Date().toLocaleString()}</p>
  
  <div class="summary">
    <h2>Repository: ${repoReport.name}</h2>
    <p>Path: ${repoReport.path}</p>
    <p>Type: ${repoReport.type}</p>
    
    <h3>Summary</h3>
    <ul>
      <li>Total packages: ${repoReport.packageCount}</li>
      <li>Packages automatically updated: ${repoReport.autoUpdateCount}</li>
      <li>Packages requiring manual updates: ${repoReport.manualUpdateCount}</li>
      <li>Packages already at latest version: ${repoReport.currentCount}</li>
    </ul>
  </div>
  
  <h3>Packages</h3>
  <table>
    <thead>
      <tr>
        <th>Package Name</th>
        <th>Current Version</th>
        <th>Latest Version</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
`;
    
    // Add auto-updated packages
    for (const packageName in repoReport.autoUpdatePackages) {
      const pkg = repoReport.autoUpdatePackages[packageName];
      html += `
      <tr>
        <td>${packageName}</td>
        <td>${pkg.from}</td>
        <td>${pkg.to}</td>
        <td class="updated">✅ Updated (${pkg.updateType})</td>
      </tr>
`;
    }
    
    // Add packages needing manual updates
    for (const packageName in repoReport.manualUpdatePackages) {
      const pkg = repoReport.manualUpdatePackages[packageName];
      html += `
      <tr>
        <td>${packageName}</td>
        <td>${pkg.from}</td>
        <td>${pkg.to}</td>
        <td class="manual">⚠️ ${pkg.updateType.charAt(0).toUpperCase() + pkg.updateType.slice(1)} update required</td>
      </tr>
`;
    }
    
    // Add current packages
    for (const packageName in repoReport.currentPackages) {
      const pkg = repoReport.currentPackages[packageName];
      html += `
      <tr>
        <td>${packageName}</td>
        <td>${pkg.version}</td>
        <td>${pkg.version}</td>
        <td class="current">✓ Current</td>
      </tr>
`;
    }
    
    html += `
    </tbody>
  </table>
</body>
</html>
`;
    
    return html;
  }
};

module.exports = documentGenerator;



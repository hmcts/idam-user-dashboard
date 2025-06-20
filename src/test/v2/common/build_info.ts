export class BuildInfoHelper {
  static getBuildInfo(defaultBranch = 'local'): string {
    let branch = process.env.BRANCH_NAME || defaultBranch;
    const build = process.env.BUILD_NUMBER;

    branch = branch.toLowerCase().replace(/[^a-z0-9]/g, '');

    return build ? `${branch}no${build}` : `${branch}`;
  }
}
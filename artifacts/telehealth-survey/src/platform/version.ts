import packageJson from '../../package.json';

/** Workspace platform release version (from telehealth-survey package.json). */
export const platformVersion = packageJson.version;

export const platformVersionLabel = `v${platformVersion}`;

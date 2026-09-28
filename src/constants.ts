import LANG from './data/languages.json';

// The app icon belongs to the Discord application, so each icon choice is its own app.
// Images only live in the flower app; the others borrow them (see loadAssets).
export const CLIENT_ID_FLOWER = '1486667060447805561' as const;
export const CLIENT_ID_UNIVERSAL = '1539164834556551178' as const;

export const KNOWN_EXTENSIONS: { [key: string]: { image: string } } = LANG.KNOWN_EXTENSIONS;
export const KNOWN_LANGUAGES: { image: string; language: string }[] = LANG.KNOWN_LANGUAGES;

export const EMPTY = '' as const;
export const FAKE_EMPTY = '\u200B\u200B' as const;
export const FILE_SIZES = [' bytes', 'KB', 'MB', 'GB', 'TB'] as const;

export const IDLE_IMAGE_KEY = 'idle-vscode' as const;
export const DEBUG_IMAGE_KEY = 'debugging' as const;
export const VSCODE_IMAGE_KEY = 'vscode' as const;
export const VSCODE_INSIDERS_IMAGE_KEY = 'vscode-insiders' as const;
export const CURSOR_IMAGE_KEY = 'cursor' as const;

// Number of "<key>-1", "<key>-2", ... variants uploaded. Keys not listed never rotate.
export const ROTATING_IMAGE_VARIANT_COUNTS: Readonly<Record<string, number>> = {
	[IDLE_IMAGE_KEY]: 3,
	[DEBUG_IMAGE_KEY]: 3,
	[VSCODE_IMAGE_KEY]: 3,
};

export const ROTATION_INTERVAL_SECONDS = 30 as const;

// Discord drops presence updates past ~5 per 20s.
export const MIN_ACTIVITY_INTERVAL_MS = 4_000 as const;

// Streaming (1) needs a stream URL and Custom (4) is client-only.
export const ACTIVITY_TYPES: Readonly<Record<string, number>> = {
	playing: 0,
	listening: 2,
	watching: 3,
	competing: 5,
};

export const UNKNOWN_GIT_BRANCH = 'Unknown' as const;
export const UNKNOWN_GIT_REPO_NAME = 'Unknown' as const;

export const enum REPLACE_KEYS {
	AppName = '{app_name}',
	CurrentColumn = '{current_column}',
	CurrentErrors = '{current_errors}',
	CurrentLine = '{current_line}',
	DirName = '{dir_name}',
	Empty = '{empty}',
	FileName = '{file_name}',
	FileSize = '{file_size}',
	FullDirName = '{full_dir_name}',
	GitBranch = '{git_branch}',
	GitRepoName = '{git_repo_name}',
	LanguageLowerCase = '{lang}',
	LanguageTitleCase = '{Lang}',
	LanguageUpperCase = '{LANG}',
	TotalLines = '{total_lines}',
	VSCodeWorkspace = '(Workspace)',
	Workspace = '{workspace}',
	WorkspaceAndFolder = '{workspace_and_folder}',
	WorkspaceFolder = '{workspace_folder}',
}

export const enum CONFIG_KEYS {
	ActivityType = 'activityType',
	AppIcon = 'appIcon',
	ClientId = 'clientId',
	DetailsDebugging = 'detailsDebugging',
	DetailsEditing = 'detailsEditing',
	DetailsIdling = 'detailsIdling',
	Enabled = 'enabled',
	IdleTimeout = 'idleTimeout',
	LargeImage = 'largeImage',
	LargeImageIdling = 'largeImageIdling',
	LowerDetailsDebugging = 'lowerDetailsDebugging',
	LowerDetailsEditing = 'lowerDetailsEditing',
	LowerDetailsIdling = 'lowerDetailsIdling',
	LowerDetailsNoWorkspaceFound = 'lowerDetailsNoWorkspaceFound',
	RemoveDetails = 'removeDetails',
	RemoveLowerDetails = 'removeLowerDetails',
	RemoveRemoteRepository = 'removeRemoteRepository',
	RemoveTimestamp = 'removeTimestamp',
	SmallImage = 'smallImage',
	SuppressNotifications = 'suppressNotifications',
	SwapBigAndSmallImage = 'swapBigAndSmallImage',
	UseRotatingIcon = 'useRotatingIcon',
	WorkspaceExcludePatterns = 'workspaceExcludePatterns',
}

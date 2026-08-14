import LANG from './data/languages.json';

// The little icon shown next to the app name in the Rich Presence card is tied
// to the Discord application (Client ID) itself - it can't be swapped per
// status update like the large/small images can. To offer a toggle, we log
// into one of two separate Discord applications depending on the user's
// choice: the default one (flower icon) or a second one with a generic icon.
// TODO: replace this with the Client ID of a second Discord application
// (Developer Portal -> New Application -> upload a generic/universal icon).
export const CLIENT_ID_FLOWER = '1486667060447805561' as const;
export const CLIENT_ID_UNIVERSAL = 'REPLACE_WITH_YOUR_SECOND_APP_CLIENT_ID' as const;

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

/**
 * How many rotating image variants exist per situation (idle, active, debugging, etc).
 * Each base key (e.g. "vscode") is expected to have this many uploaded Discord assets
 * named "vscode-1", "vscode-2", "vscode-3", ...
 */
export const ROTATING_IMAGE_VARIANT_COUNT = 3 as const;

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
	AppIcon = 'appIcon',
	CustomLargeImage = 'customLargeImage',
	CustomSmallImage = 'customSmallImage',
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

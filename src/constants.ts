import LANG from './data/languages.json';

// The little icon shown next to the app name in the Rich Presence card is tied
// to the Discord application (Client ID) itself - it can't be swapped per
// status update like the large/small images can. To offer a toggle, we log
// into one of two separate Discord applications depending on the user's
// choice: the default one (flower icon) or a second one with a generic icon.
// NOTE: Rich Presence assets are per-application, so every image key used below -
// including each rotating variant - has to be uploaded to BOTH applications. An asset
// present in one but not the other renders as no image at all under that app icon.
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

/**
 * How many rotating variants actually exist for each base image key, i.e. how many
 * "<base>-1", "<base>-2", ... assets are uploaded to the Discord application.
 *
 * A base key that is missing here, or listed with fewer than 2 variants, never rotates -
 * the plain base key is used instead. That fallback matters: asking Discord for an asset
 * that was never uploaded makes it render *no image at all* rather than degrading to the
 * base icon, which is how "cursor-1" and "vscode-insiders-1" silently blanked the badge.
 *
 * Keep this in sync with assets/icons/ when adding or removing variants.
 */
export const ROTATING_IMAGE_VARIANT_COUNTS: Readonly<Record<string, number>> = {
	[IDLE_IMAGE_KEY]: 3,
	[DEBUG_IMAGE_KEY]: 3,
	[VSCODE_IMAGE_KEY]: 3,
	// No "-1"/"-2"/"-3" assets exist for these two yet, so they stay static.
	[VSCODE_INSIDERS_IMAGE_KEY]: 0,
	[CURSOR_IMAGE_KEY]: 0,
};

/**
 * How long a rotating icon stays on screen before the next variant is shown. Discord
 * rate-limits presence updates to roughly 5 per 20 seconds, so this has to stay well
 * above that floor.
 */
export const ROTATION_INTERVAL_SECONDS = 30 as const;

/**
 * Minimum gap between two setActivity calls. Updates requested inside this window are
 * coalesced into one trailing update instead of being silently dropped by Discord.
 */
export const MIN_ACTIVITY_INTERVAL_MS = 4_000 as const;

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

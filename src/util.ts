import { basename } from 'node:path';
import { URL } from 'node:url';
import type { TextDocument, WorkspaceConfiguration } from 'vscode';
import { workspace, extensions } from 'vscode';
import type { API, GitExtension } from './@types/git';
import { KNOWN_EXTENSIONS, KNOWN_LANGUAGES, ROTATING_IMAGE_VARIANT_COUNTS } from './constants';
import { log, LogLevel } from './logger';

let git: API | null | undefined;

type WorkspaceExtensionConfiguration = WorkspaceConfiguration & {
	appIcon: 'flower' | 'universal';
	customLargeImage: string;
	customSmallImage: string;
	detailsDebugging: string;
	detailsEditing: string;
	detailsIdling: string;
	enabled: boolean;
	idleTimeout: number;
	largeImage: string;
	largeImageIdling: string;
	lowerDetailsDebugging: string;
	lowerDetailsEditing: string;
	lowerDetailsIdling: string;
	lowerDetailsNoWorkspaceFound: string;
	removeDetails: boolean;
	removeLowerDetails: boolean;
	removeRemoteRepository: boolean;
	removeTimestamp: boolean;
	smallImage: string;
	suppressNotifications: boolean;
	swapBigAndSmallImage: boolean;
	useRotatingIcon: boolean;
	workspaceExcludePatterns: string[];
};

export function getConfig() {
	return workspace.getConfiguration('discord') as WorkspaceExtensionConfiguration;
}

export const toLower = (str: string) => str.toLocaleLowerCase();

export const toUpper = (str: string) => str.toLocaleUpperCase();

export const toTitle = (str: string) => toLower(str).replace(/^\w/, (char) => toUpper(char));

/**
 * Discord's RPC accepts a direct https URL in place of a pre-uploaded asset
 * key for largeImageKey/smallImageKey - see the "external URL" support of
 * setActivity. This lets a user drop any image link into the
 * discord.customLargeImage / discord.customSmallImage settings without ever
 * touching the Discord Developer Portal. Blank or clearly-invalid values
 * fall back to undefined so the extension's own icon is used instead.
 */
export function resolveCustomImage(value: string | undefined): string | undefined {
	if (!value) return undefined;
	const trimmed = value.trim();
	if (!trimmed) return undefined;

	try {
		const url = new URL(trimmed);
		if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;
		return /\.(?:png|jpe?g|gif|webp|avif)$/i.test(url.pathname) ? trimmed : undefined;
	} catch {
		return undefined;
	}
}

let rotationTick = 0;

/**
 * Moves every rotating icon on to its next variant. Driven by a timer in extension.ts.
 */
export function advanceRotation() {
	rotationTick++;
}

/**
 * Picks the current rotating variant of a base image key, turning "vscode" into "vscode-2".
 *
 * Cycles deterministically off a shared tick rather than rolling a die, so every icon in
 * a presence update moves together and each variant gets equal screen time. Rolling per
 * update meant the icon strobed while typing, repeated itself one time in three, and
 * froze the instant you stopped - rotation only ever happened as a side effect of edits.
 *
 * Base keys with no uploaded variants come back untouched; see
 * ROTATING_IMAGE_VARIANT_COUNTS for why that fallback is not optional.
 */
export function pickRotatingImageKey(baseKey: string, useRotating: boolean) {
	if (!useRotating) return baseKey;

	const variantCount = ROTATING_IMAGE_VARIANT_COUNTS[baseKey] ?? 0;
	if (variantCount < 2) return baseKey;

	return `${baseKey}-${(rotationTick % variantCount) + 1}`;
}

function stripGitSuffix(path: string) {
	return path.replace(/\.git$/, '').replace(/\/+$/, '');
}

/**
 * Turns any git remote into a browsable https URL, or undefined if it cannot be one.
 * Handles scp-style remotes, ssh:// remotes with an explicit port, and https remotes
 * carrying credentials. The old chain of blind .replace() calls mistook the port in an
 * ssh remote for a path segment and emitted "https://host/22/u/r".
 */
export function normalizeRemoteUrl(remote: string): string | undefined {
	const trimmed = remote.trim();
	if (!trimmed) return undefined;

	// scp-style has no scheme, and a colon separating host from path rather than a port.
	const scpStyle = /^(?:[^/@]+@)?(?<host>[^/:]+):(?!\/)(?<path>.+)$/.exec(trimmed);
	if (scpStyle?.groups) {
		return `https://${scpStyle.groups.host as string}/${stripGitSuffix(scpStyle.groups.path as string)}`;
	}

	try {
		const url = new URL(trimmed);
		// Rebuilding from hostname drops embedded credentials and any ssh port.
		const path = stripGitSuffix(url.pathname);
		return url.hostname ? `https://${url.hostname}${path}` : undefined;
	} catch {
		return undefined;
	}
}

/**
 * Last path segment of a remote: ".../bishop076/discord-vscode.git" yields "discord-vscode".
 * The previous `fetchUrl.split('/')[1]` only lined up for scp-style remotes; on any https
 * remote it landed on the empty string between the two leading slashes.
 */
export function repoNameFromRemote(remote: string): string | undefined {
	const normalized = normalizeRemoteUrl(remote);
	if (!normalized) return undefined;

	const name = normalized.split('/').pop();
	if (!name) return undefined;

	return name;
}

export function resolveFileIcon(document: TextDocument) {
	const filename = basename(document.fileName);
	const findKnownExtension = Object.keys(KNOWN_EXTENSIONS).find((key) => {
		if (filename.endsWith(key)) {
			return true;
		}

		const match = /^\/(.*)\/([gimy]+)$/.exec(key);
		if (!match) {
			return false;
		}

		const regex = new RegExp(match[1] as string, match[2] as string);
		return regex.test(filename);
	});
	const findKnownLanguage = KNOWN_LANGUAGES.find((key) => key.language === document.languageId);
	const fileIcon = findKnownExtension
		? KNOWN_EXTENSIONS[findKnownExtension]
		: findKnownLanguage
			? findKnownLanguage.image
			: null;

	return typeof fileIcon === 'string' ? fileIcon : (fileIcon?.image ?? 'text');
}

export async function getGit() {
	if (git || git === null) {
		return git;
	}

	try {
		log(LogLevel.Debug, 'Loading git extension');
		const gitExtension = extensions.getExtension<GitExtension>('vscode.git');
		if (!gitExtension?.isActive) {
			log(LogLevel.Trace, 'Git extension not activated, activating...');
			await gitExtension?.activate();
		}

		// eslint-disable-next-line require-atomic-updates
		git = gitExtension?.exports.getAPI(1);
	} catch (error) {
		// eslint-disable-next-line require-atomic-updates
		git = null;
		log(LogLevel.Error, `Failed to load git extension, is git installed?; ${error as string}`);
	}

	return git;
}

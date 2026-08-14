import { basename } from 'node:path';
import { URL } from 'node:url';
import type { TextDocument, WorkspaceConfiguration } from 'vscode';
import { workspace, extensions } from 'vscode';
import type { API, GitExtension } from './@types/git';
import { KNOWN_EXTENSIONS, KNOWN_LANGUAGES, ROTATING_IMAGE_VARIANT_COUNT } from './constants';
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

/**
 * Picks a random rotating variant of a base image key, e.g. "vscode" -> "vscode-2".
 * Expects matching Discord Rich Presence assets to be uploaded for every variant
 * (vscode-1, vscode-2, vscode-3, ...) up to ROTATING_IMAGE_VARIANT_COUNT.
 */
export function pickRotatingImageKey(baseKey: string, useRotating: boolean) {
	if (!useRotating) return baseKey;
	const variant = Math.floor(Math.random() * ROTATING_IMAGE_VARIANT_COUNT) + 1;
	return `${baseKey}-${variant}`;
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

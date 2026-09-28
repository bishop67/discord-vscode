import { basename } from 'node:path';
import { URL } from 'node:url';
import type { TextDocument, WorkspaceConfiguration } from 'vscode';
import { workspace, extensions } from 'vscode';
import type { API, GitExtension } from './@types/git';
import { CLIENT_ID_FLOWER, KNOWN_EXTENSIONS, KNOWN_LANGUAGES, ROTATING_IMAGE_VARIANT_COUNTS } from './constants';
import { log, LogLevel } from './logger';

let git: API | null | undefined;

type WorkspaceExtensionConfiguration = WorkspaceConfiguration & {
	activityType: 'competing' | 'listening' | 'playing' | 'watching';
	appIcon: 'custom' | 'flower' | 'universal';
	clientId: string;
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

let rotationTick = 0;

export function advanceRotation() {
	rotationTick++;
}

// Turns "vscode" into "vscode-2", cycling on a shared tick so every icon moves together.
export function pickRotatingImageKey(baseKey: string, useRotating: boolean) {
	if (!useRotating) return baseKey;

	const variantCount = ROTATING_IMAGE_VARIANT_COUNTS[baseKey] ?? 0;
	if (variantCount < 2) return baseKey;

	return `${baseKey}-${(rotationTick % variantCount) + 1}`;
}

async function fetchAssetIds(clientId: string) {
	try {
		const res = await fetch(`https://discord.com/api/v10/oauth2/applications/${clientId}/assets`, {
			signal: AbortSignal.timeout(5_000),
		});
		if (!res.ok) return new Map<string, string>();
		const assets = (await res.json()) as { id: string; name: string }[];
		return new Map(assets.map((asset) => [asset.name, asset.id]));
	} catch {
		return new Map<string, string>();
	}
}

let customAssets: Map<string, string> | undefined;
let defaultAssets = new Map<string, string>();

// Any other app (including our universal one) falls back to the flower app's images on Discord's CDN.
export async function loadAssets(clientId: string) {
	if (clientId === CLIENT_ID_FLOWER) {
		customAssets = undefined;
		return;
	}

	[customAssets, defaultAssets] = await Promise.all([fetchAssetIds(clientId), fetchAssetIds(CLIENT_ID_FLOWER)]);
}

export function resolveImage(key: string) {
	if (!customAssets || customAssets.has(key)) return key;

	const id = defaultAssets.get(key);
	return id ? `https://cdn.discordapp.com/app-assets/${CLIENT_ID_FLOWER}/${id}.png` : key;
}

function stripGitSuffix(path: string) {
	return path.replace(/\.git$/, '').replace(/\/+$/, '');
}

// Any git remote (scp-style, ssh:// with a port, https with credentials) as a browsable https URL.
export function normalizeRemoteUrl(remote: string): string | undefined {
	const trimmed = remote.trim();
	if (!trimmed) return undefined;

	const scpStyle = /^(?:[^/@]+@)?(?<host>[^/:]+):(?!\/)(?<path>.+)$/.exec(trimmed);
	if (scpStyle?.groups) {
		return `https://${scpStyle.groups.host as string}/${stripGitSuffix(scpStyle.groups.path as string)}`;
	}

	try {
		const url = new URL(trimmed);
		const path = stripGitSuffix(url.pathname);
		return url.hostname ? `https://${url.hostname}${path}` : undefined;
	} catch {
		return undefined;
	}
}

export function repoNameFromRemote(remote: string) {
	return normalizeRemoteUrl(remote)?.split('/').pop();
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

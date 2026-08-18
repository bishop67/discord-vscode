import { Client } from '@xhayper/discord-rpc';
import throttle from 'lodash-es/throttle';
import type { ExtensionContext, StatusBarItem } from 'vscode';
import { commands, StatusBarAlignment, window, workspace, debug } from 'vscode';
import { activity } from './activity';
import {
	CLIENT_ID_FLOWER,
	CLIENT_ID_UNIVERSAL,
	CONFIG_KEYS,
	MIN_ACTIVITY_INTERVAL_MS,
	ROTATION_INTERVAL_SECONDS,
} from './constants';
import { log, LogLevel } from './logger';
import { advanceRotation, getConfig, getGit, rotatesCustomImages } from './util';

function resolveClientId() {
	return getConfig()[CONFIG_KEYS.AppIcon] === 'universal' ? CLIENT_ID_UNIVERSAL : CLIENT_ID_FLOWER;
}

const statusBarIcon: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
statusBarIcon.text = '$(pulse) Connecting to Discord...';

let rpc = new Client({ transport: { type: 'ipc' }, clientId: resolveClientId() });

let state = {};
let idle: NodeJS.Timeout | undefined;
let rotation: NodeJS.Timeout | undefined;
let pendingActivity: NodeJS.Timeout | undefined;
let lastActivityAt = 0;
let listeners: { dispose(): any }[] = [];

function stopRotation() {
	if (rotation) {
		// eslint-disable-next-line no-restricted-globals
		clearInterval(rotation);
		rotation = undefined;
	}
}

export function cleanUp() {
	for (const listener of listeners) listener.dispose();
	listeners = [];

	stopRotation();

	if (pendingActivity) {
		// eslint-disable-next-line no-restricted-globals
		clearTimeout(pendingActivity);
		pendingActivity = undefined;
	}
}

/**
 * Discord drops presence updates past roughly 5 per 20 seconds. Editor switches plus the
 * 2s edit throttle exceed that easily, and the dropped updates used to leave the presence
 * stuck on a stale icon. Anything requested inside the cooldown is collapsed into a single
 * trailing update instead, so the latest state always lands.
 */
async function sendActivity() {
	const waitFor = MIN_ACTIVITY_INTERVAL_MS - (Date.now() - lastActivityAt);

	if (waitFor > 0) {
		// eslint-disable-next-line no-restricted-globals
		pendingActivity ??= setTimeout(() => {
			pendingActivity = undefined;
			void sendActivity();
		}, waitFor);

		return;
	}

	lastActivityAt = Date.now();
	// eslint-disable-next-line require-atomic-updates
	state = {
		...(await activity(state)),
	};
	void rpc.user?.setActivity(state);
}

/**
 * Rotation runs on its own timer so the icon advances at a steady cadence whether or not
 * you happen to be typing. Picking a new variant inside each presence update instead made
 * it flicker mid-keystroke and stop dead as soon as you paused.
 */
function startRotation() {
	stopRotation();

	const config = getConfig();
	if (!config[CONFIG_KEYS.Enabled]) return;

	// A user's URL list is its own opt-in: supplying two or more images is the request to
	// cycle them, so it does not also require the built-in badge toggle.
	const hasCustomRotation =
		rotatesCustomImages(config[CONFIG_KEYS.CustomLargeImageRotation]) ||
		rotatesCustomImages(config[CONFIG_KEYS.CustomSmallImageRotation]);

	if (!config[CONFIG_KEYS.UseRotatingIcon] && !hasCustomRotation) return;

	// eslint-disable-next-line no-restricted-globals
	rotation = setInterval(() => {
		advanceRotation();
		void sendActivity();
	}, ROTATION_INTERVAL_SECONDS * 1_000);
}

async function login() {
	log(LogLevel.Info, 'Creating discord-rpc client');
	rpc = new Client({ transport: { type: 'ipc' }, clientId: resolveClientId() });

	rpc.on('ready', () => {
		log(LogLevel.Info, 'Successfully connected to Discord');
		cleanUp();

		statusBarIcon.text = '$(globe) Connected to Discord';
		statusBarIcon.tooltip = 'Connected to Discord';

		void sendActivity();
		startRotation();

		const throttledSendActivity = throttle(() => void sendActivity(), 2_000);
		const onChangeActiveTextEditor = window.onDidChangeActiveTextEditor(() => void sendActivity());
		const onChangeTextDocument = workspace.onDidChangeTextDocument((event) => {
			// Output panels, logs and other background documents fire this too - only edits to
			// the file actually on screen should refresh the presence.
			if (event.document === window.activeTextEditor?.document) throttledSendActivity();
		});
		const onStartDebugSession = debug.onDidStartDebugSession(() => void sendActivity());
		const onTerminateDebugSession = debug.onDidTerminateDebugSession(() => void sendActivity());

		listeners.push(onChangeActiveTextEditor, onChangeTextDocument, onStartDebugSession, onTerminateDebugSession, {
			dispose: () => throttledSendActivity.cancel(),
		});
	});

	rpc.on('disconnected', () => {
		cleanUp();
		void rpc.destroy();
		statusBarIcon.text = '$(pulse) Reconnect to Discord';
		statusBarIcon.command = 'discord.reconnect';
	});

	try {
		await rpc.login();
	} catch (error) {
		log(LogLevel.Error, `Encountered following error while trying to login:\n${error as string}`);
		cleanUp();
		void rpc.destroy();
		if (!getConfig()[CONFIG_KEYS.SuppressNotifications]) {
			// @ts-expect-error: error is not typed
			if (error?.message?.includes('ENOENT')) void window.showErrorMessage('No Discord client detected');
			else void window.showErrorMessage(`Couldn't connect to Discord via RPC: ${error as string}`);
		}

		statusBarIcon.text = '$(pulse) Reconnect to Discord';
		statusBarIcon.command = 'discord.reconnect';
	}
}

export async function activate(context: ExtensionContext) {
	log(LogLevel.Info, 'Discord Presence activated');

	let isWorkspaceExcluded = false;
	for (const pattern of getConfig()[CONFIG_KEYS.WorkspaceExcludePatterns]) {
		const regex = new RegExp(pattern);
		const folders = workspace.workspaceFolders;
		if (!folders) break;
		if (folders.some((folder) => regex.test(folder.uri.fsPath))) {
			isWorkspaceExcluded = true;
			break;
		}
	}

	const enable = async (update = true) => {
		if (update) {
			try {
				await getConfig().update('enabled', true);
			} catch {}
		}

		log(LogLevel.Info, 'Enable: Cleaning up old listeners');
		cleanUp();
		statusBarIcon.text = '$(pulse) Connecting to Discord...';
		statusBarIcon.show();
		log(LogLevel.Info, 'Enable: Attempting to recreate login');
		void login();
	};

	const disable = async (update = true) => {
		if (update) {
			try {
				await getConfig().update('enabled', false);
			} catch {}
		}

		log(LogLevel.Info, 'Disable: Cleaning up old listeners');
		cleanUp();
		void rpc?.destroy();
		log(LogLevel.Info, 'Disable: Destroyed the rpc instance');
		statusBarIcon.hide();
	};

	const enabler = commands.registerCommand('discord.enable', async () => {
		await disable();
		await enable();
		await window.showInformationMessage('Enabled Discord Presence for this workspace');
	});

	const disabler = commands.registerCommand('discord.disable', async () => {
		await disable();
		await window.showInformationMessage('Disabled Discord Presence for this workspace');
	});

	const reconnecter = commands.registerCommand('discord.reconnect', async () => {
		await disable(false);
		await enable(false);
	});

	const disconnect = commands.registerCommand('discord.disconnect', async () => {
		await disable(false);
		statusBarIcon.text = '$(pulse) Reconnect to Discord';
		statusBarIcon.command = 'discord.reconnect';
		statusBarIcon.show();
	});

	// Settings used to be read once at module load, so changing any of them needed a full
	// window reload to take effect. They are read live now, and this keeps the two things
	// that are not re-read per update - the connection and the rotation timer - in sync.
	const configWatcher = workspace.onDidChangeConfiguration(async (event) => {
		if (!event.affectsConfiguration('discord')) return;

		if (event.affectsConfiguration('discord.enabled')) {
			if (getConfig()[CONFIG_KEYS.Enabled]) await enable(false);
			else await disable(false);
			return;
		}

		if (!getConfig()[CONFIG_KEYS.Enabled]) return;

		// The Rich Presence app icon belongs to the Discord application itself rather than to
		// the activity payload, so switching it means logging into the other application.
		if (event.affectsConfiguration('discord.appIcon')) {
			await disable(false);
			await enable(false);
			return;
		}

		if (
			event.affectsConfiguration('discord.useRotatingIcon') ||
			event.affectsConfiguration('discord.customLargeImageRotation') ||
			event.affectsConfiguration('discord.customSmallImageRotation')
		) {
			startRotation();
		}

		await sendActivity();
	});

	const windowStateWatcher = window.onDidChangeWindowState(async (windowState) => {
		const idleTimeout = getConfig()[CONFIG_KEYS.IdleTimeout];
		if (idleTimeout === 0) return;

		if (windowState.focused) {
			if (idle) {
				// eslint-disable-next-line no-restricted-globals
				clearTimeout(idle);
				idle = undefined;
			}

			startRotation();
			await sendActivity();
		} else {
			// eslint-disable-next-line no-restricted-globals
			idle = setTimeout(async () => {
				idle = undefined;
				// Nothing to rotate once the presence has been cleared.
				stopRotation();
				state = {};
				await rpc.user?.clearActivity();
			}, idleTimeout * 1_000);
		}
	});

	context.subscriptions.push(enabler, disabler, reconnecter, disconnect, configWatcher, windowStateWatcher);

	if (!isWorkspaceExcluded && getConfig()[CONFIG_KEYS.Enabled]) {
		statusBarIcon.show();
		await login();
	}

	await getGit();
}

export function deactivate() {
	cleanUp();

	if (idle) {
		// eslint-disable-next-line no-restricted-globals
		clearTimeout(idle);
		idle = undefined;
	}

	void rpc.destroy();
}

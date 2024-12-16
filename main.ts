import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

const path = require('path');
const rootFolder = "TripPlanner"

interface TripPlannerSettings {
	rootFolder: string;
}

const DEFAULT_SETTINGS: TripPlannerSettings = {
	rootFolder: 'Trips'
}

class TripModal extends Modal {
	constructor(app: App, onSubmit: (month: string, destination: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl('h2', { text: 'Plan Your Trip' });

		// Create input fields
		const monthInput = new Setting(contentEl)
			.setName('Month of Trip')
			.addText(text => text.setPlaceholder('Enter month'));

		const destinationInput = new Setting(contentEl)
			.setName('Destination')
			.addText(text => text.setPlaceholder('Enter destination'));

		// Submit button
		contentEl.createEl('button', { text: 'Submit' }).addEventListener('click', () => {
			const month = monthInput.controlEl.querySelector('input').value;
			const destination = destinationInput.controlEl.querySelector('input').value;

			if (month && destination) {
				this.onSubmit(month, destination);
				this.close();
			} else {
				new Notice('Please fill out all fields.');
			}
		});
	}

	onClose() {
		this.contentEl.empty();
	}
}

export default class TripPlanner extends Plugin {
	settings: TripPlanner;

	// Method to create a new folder
	async createNewFolder(folderPath: string) {

		try {
			const fileExists = this.app.vault.getAbstractFileByPath(folderPath);
			if (!fileExists) {
				await this.app.vault.createFolder(folderPath);
				new Notice(`Folder "${folderPath}" created successfully!`);
			} else {
				new Notice(`Folder "${folderPath}" already exists.`);
			}
		} catch (error) {
			console.error("Error creating folder:", error);
			new Notice("Failed to create folder.");
		}
	}

    // Method to create a new note
    async createNewNote(filePath: string, content: string) {
        try {
            const fileExists = this.app.vault.getAbstractFileByPath(filePath);
            if (!fileExists) {
                await this.app.vault.create(filePath, content);
                new Notice(`Note "${filePath}" created successfully!`);
            } else {
                new Notice(`Note "${filePath}" already exists.`);
            }
        } catch (error) {
            console.error("Error creating note:", error);
            new Notice(`Failed to create note "${filePath}".`);
        }
    }

	async onload() {
		console.log('loading plugin')
		await this.loadSettings();

		// Add a ribbon icon to trigger the modal
		this.addRibbonIcon('dice', 'Plan a Trip', () => {
			new TripModal(this.app, (month, destination) => {
				new Notice(`Planning trip to ${destination} in ${month}.`);
				let subFolder = `${destination}-${month}`;
				let fullPath = path.join(rootFolder, subFolder);

				// Create a folder with month and destination
				this.createNewFolder(`${fullPath}`);

                // Step 2: Create two new notes inside the folder

                // Note 1: Trip Itinerary
                const itineraryPath = path.join(fullPath, 'Trip Itinerary.md');
                const itineraryContent = '# Trip Itinerary\n\nAdd your itinerary details here.';
                this.createNewNote(itineraryPath, itineraryContent);

                // Note 2: Packing List
                const packingListPath = path.join(fullPath, 'Packing List.md');
                const packingListContent = '# Packing List\n\nAdd your packing list here.';
                this.createNewNote(packingListPath, packingListContent);

			}).open();
		});


		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
		console.log('unloading plugin')
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: TripPlanner;

	constructor(app: App, plugin: TripPlanner) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}

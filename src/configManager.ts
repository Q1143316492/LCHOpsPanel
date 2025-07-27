export interface OpsItem {
    id: string;
    name: string;
    type: 'file' | 'script' | 'command' | 'category';
    path?: string;
    command?: string;
    description?: string;
    category?: string;
    children?: OpsItem[];
}

export interface OpsConfig {
    categories: string[];
    items: OpsItem[];
}

export class ConfigManager {
    private static readonly CONFIG_FILE = '.lch-ops-panel.json';
    
    static async loadConfig(workspaceRoot: string): Promise<OpsConfig> {
        const vscode = require('vscode');
        const path = require('path');
        const fs = require('fs').promises;
        
        const configPath = path.join(workspaceRoot, this.CONFIG_FILE);
        
        try {
            const configContent = await fs.readFile(configPath, 'utf8');
            return JSON.parse(configContent);
        } catch (error) {
            // Return default config if file doesn't exist
            return {
                categories: ['Files', 'Scripts', 'Commands'],
                items: []
            };
        }
    }
    
    static async saveConfig(workspaceRoot: string, config: OpsConfig): Promise<void> {
        const path = require('path');
        const fs = require('fs').promises;
        
        const configPath = path.join(workspaceRoot, this.CONFIG_FILE);
        await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
    }
    
    static generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

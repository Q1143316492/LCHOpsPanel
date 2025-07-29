export interface OpsItem {
    id: string;
    name: string;
    type: 'file' | 'script' | 'command' | 'category' | 'notice-collection' | 'notice-folder' | 'notice-file';
    path?: string;
    command?: string;
    description?: string;
    category?: string;
    children?: OpsItem[];
}

export interface NoticeFile {
    name: string;
    path: string;
    description?: string;
}

export interface WorkspaceNotice {
    name: string;
    description?: string;
    files: NoticeFile[];
}

export interface OpsConfig {
    categories: string[];
    items: OpsItem[];
    workspaceNotices?: WorkspaceNotice[];
    currentNoticeName?: string;
}

export class ConfigManager {
    private static readonly CONFIG_FILE = '.lch-ops-panel.json';
    
    static async loadConfig(workspaceRoot: string): Promise<OpsConfig> {
        const vscode = require('vscode');
        const path = require('path');
        const fs = require('fs').promises;
        
        const configPath = path.join(workspaceRoot, this.CONFIG_FILE);
        
        try {
            // 检查文件是否存在
            await fs.access(configPath);
            
            const configContent = await fs.readFile(configPath, 'utf8');
            
            // 检查文件内容是否为空
            if (!configContent.trim()) {
                console.log('Config file is empty, returning default config');
                return {
                    categories: ['Files', 'Scripts', 'Commands'],
                    items: [],
                    workspaceNotices: [],
                    currentNoticeName: ''
                };
            }
            
            const parsedConfig = JSON.parse(configContent);
            
            // 验证配置结构
            if (!parsedConfig.categories || !Array.isArray(parsedConfig.categories)) {
                parsedConfig.categories = ['Files', 'Scripts', 'Commands'];
            }
            if (!parsedConfig.items || !Array.isArray(parsedConfig.items)) {
                parsedConfig.items = [];
            }
            if (!parsedConfig.workspaceNotices || !Array.isArray(parsedConfig.workspaceNotices)) {
                parsedConfig.workspaceNotices = [];
            }
            if (!parsedConfig.currentNoticeName) {
                parsedConfig.currentNoticeName = '';
            }
            
            console.log('Config loaded from file:', configPath);
            return parsedConfig;
        } catch (error) {
            console.log('Error loading config file, returning default config:', error);
            // Return default config if file doesn't exist or has errors
            return {
                categories: ['Files', 'Scripts', 'Commands'],
                items: [],
                workspaceNotices: [],
                currentNoticeName: ''
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

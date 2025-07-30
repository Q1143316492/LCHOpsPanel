// 存储空间分析工具
// 用于检查扩展的存储使用情况
import * as vscode from 'vscode';

export class StorageAnalyzer {
    private _context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this._context = context;
    }

    public analyzeStorage(): StorageInfo {
        const keys = this._context.globalState.keys();
        const storageData: { [key: string]: any } = {};
        let totalSize = 0;

        keys.forEach((key: string) => {
            const value = this._context.globalState.get(key);
            storageData[key] = value;
            
            // 计算JSON序列化后的大小
            const jsonString = JSON.stringify({ [key]: value });
            totalSize += Buffer.byteLength(jsonString, 'utf8');
        });

        return {
            keys: keys.length,
            data: storageData,
            totalSizeBytes: totalSize,
            totalSizeKB: Math.round(totalSize / 1024 * 100) / 100,
            estimatedDiskUsage: this.estimateDiskUsage(totalSize)
        };
    }

    private estimateDiskUsage(bytes: number): string {
        if (bytes < 1024) {
            return `${bytes} bytes`;
        }
        if (bytes < 1024 * 1024) {
            return `${Math.round(bytes / 1024 * 100) / 100} KB`;
        }
        return `${Math.round(bytes / (1024 * 1024) * 100) / 100} MB`;
    }

    public getGameStorageInfo(): GameStorageInfo {
        const bestScore = this._context.globalState.get('lchOpsPanel.game2048.bestScore', 0);
        const jsonString = JSON.stringify({ 'lchOpsPanel.game2048.bestScore': bestScore });
        const sizeBytes = Buffer.byteLength(jsonString, 'utf8');

        return {
            bestScore,
            storageKey: 'lchOpsPanel.game2048.bestScore',
            sizeBytes,
            sizeDescription: this.estimateDiskUsage(sizeBytes),
            wouldBeLargeAt: 'Never - it\'s just a number!'
        };
    }
}

interface StorageInfo {
    keys: number;
    data: { [key: string]: any };
    totalSizeBytes: number;
    totalSizeKB: number;
    estimatedDiskUsage: string;
}

interface GameStorageInfo {
    bestScore: number;
    storageKey: string;
    sizeBytes: number;
    sizeDescription: string;
    wouldBeLargeAt: string;
}

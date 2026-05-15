/**
 * Shared data types for the LCH Ops Panel.
 *
 * Two distinct item domains live in separate tree views:
 *   - OpsItem    -> Operations Panel (files / scripts / commands grouped by category)
 *   - NoticeItem -> Notice Collections (file lists organized into virtual folders)
 *
 * They used to share one overloaded `OpsItem` shape; now split for clarity.
 */

export type OpsItemType = 'file' | 'script' | 'command' | 'category';

export interface OpsItem {
    id: string;
    name: string;
    type: OpsItemType;
    path?: string;
    command?: string;
    description?: string;
    category?: string;
}

export type NoticeItemType = 'notice-collection' | 'notice-folder' | 'notice-file';

export interface NoticeItem {
    id: string;
    name: string;
    type: NoticeItemType;
    path?: string;
    description?: string;
    children?: NoticeItem[];
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
    workspaceNotices: WorkspaceNotice[];
    currentNoticeName: string;
}

export function createEmptyConfig(): OpsConfig {
    return {
        categories: ['Files', 'Scripts', 'Commands'],
        items: [],
        workspaceNotices: [],
        currentNoticeName: '',
    };
}

/**
 * Anything with an optional `path` field can be opened/located in the terminal.
 * Both OpsItem (file/script) and NoticeItem (notice-file) satisfy this.
 */
export interface PathBearing {
    name: string;
    path?: string;
}

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
    /** For `notice-collection` nodes: the underlying collection name (without the display prefix). */
    collectionName?: string;
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
    /** Number of trailing path segments shown in the Workspace Info panel (0 = full path). Default: 3 */
    workspaceInfoPathSegments: number;
}

export function createEmptyConfig(): OpsConfig {
    return {
        categories: ['Files', 'Scripts', 'Commands'],
        items: [],
        workspaceNotices: [],
        currentNoticeName: '',
        workspaceInfoPathSegments: 3,
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

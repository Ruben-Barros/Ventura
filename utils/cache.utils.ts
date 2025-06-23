import * as FileSystem from 'expo-file-system';
import { VisualAsset, NarrationSegment, VisualMode } from '../types/narration.types'; // Assuming types are correctly pathed

type UUID = string;
const ASSET_CACHE_DIR = FileSystem.cacheDirectory + 'narration_assets/'; // Separate dir for assets
const SEGMENT_CACHE_DIR = FileSystem.cacheDirectory + 'segment_metadata/'; // Dir for segment JSON data
const MAX_CACHED_ITEMS = 10; // Limit the number of metadata files to avoid excessive storage use

interface CachedSegmentData {
    segment: NarrationSegment;
    visualAsset?: VisualAsset; // Store the cached visual asset info if available (points to local URI)
    audioFilePath?: string; // Store path to locally cached audio
    fetchedAt: number;
}

// Ensure cache directory exists
async function ensureCacheDirExists() {
    try {
        // Ensure both directories exist
        const dirs = [ASSET_CACHE_DIR, SEGMENT_CACHE_DIR];
        for (const dir of dirs) {
            const dirInfo = await FileSystem.getInfoAsync(dir);
            if (!dirInfo.exists) {
                console.log(`Creating cache directory: ${dir}`);
                await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
            }
        }
    } catch (error) {
        console.error("Failed to ensure cache directories exist:", error);
    }
}

ensureCacheDirExists(); // Call on module load

function getSegmentCachePath(segmentId: UUID): string {
    return `${SEGMENT_CACHE_DIR}${segmentId}.json`;
}

// Basic cache eviction (Least Recently Used based on modification time)
async function evictOldCacheEntries(cacheDir: string, maxItems: number) {
    try {
        const items = await FileSystem.readDirectoryAsync(cacheDir);
        if (items.length <= maxItems) {
            return; // No need to evict
        }

        const itemsWithStats = await Promise.all(
            items.map(async (item) => {
                const uri = cacheDir + item;
                // Use 'modificationTime' option for getInfoAsync if available, otherwise fallback might be needed
                // For now, assuming 'mtime' exists directly on the result based on FileInfo type
                const info = await FileSystem.getInfoAsync(uri, { size: false });
                // Check if mtime exists, otherwise use 0
                const modificationTime = (info as FileSystem.FileInfo & { mtime?: number }).mtime ?? 0;
                return { uri, modificationTime };
            })
        );

        // Sort by modification time (oldest first)
        itemsWithStats.sort((a, b) => a.modificationTime - b.modificationTime);

        // Delete the oldest entries exceeding the limit
        const itemsToDelete = itemsWithStats.slice(0, items.length - maxItems);
        console.log(`[Cache Eviction] Found ${items.length} items, limit ${maxItems}. Deleting ${itemsToDelete.length} oldest items from ${cacheDir}`);

        for (const item of itemsToDelete) {
            await FileSystem.deleteAsync(item.uri, { idempotent: true });
        }
    } catch (error) {
        console.error(`[Cache Eviction] Error during cache cleanup for ${cacheDir}:`, error);
    }
}
// Removed extra closing brace from here

/**
 * Caches segment data (metadata, potentially visual/audio paths).
 * @param segmentId - The ID of the segment to cache.
 * @param data - The data to cache.
 */
export const cacheSegmentData = async (segmentId: UUID, data: Partial<CachedSegmentData>): Promise<void> => {
    const filePath = getSegmentCachePath(segmentId);
    try {
        // Merge with existing data if necessary, or just overwrite
        const dataToCache: CachedSegmentData = {
            segment: data.segment!, // Assume segment is always provided when caching
            visualAsset: data.visualAsset,
            audioFilePath: data.audioFilePath,
            fetchedAt: Date.now(),
        };
        await FileSystem.writeAsStringAsync(filePath, JSON.stringify(dataToCache));
        console.log(`[Cache] Cached data for segment ${segmentId}`);

        // Trigger cache eviction for metadata directory after writing
        await evictOldCacheEntries(SEGMENT_CACHE_DIR, MAX_CACHED_ITEMS);
        // Note: Asset cache eviction might need separate logic if ASSET_CACHE_DIR grows too large

    } catch (error) {
        console.error(`[Cache] Failed to cache data for segment ${segmentId}:`, error);
    }
};

/**
 * Retrieves cached segment data.
 * @param segmentId - The ID of the segment to retrieve.
 * @returns The cached data or null if not found or expired.
 */
export const getCachedSegment = async (segmentId: UUID): Promise<CachedSegmentData | null> => {
    const filePath = getSegmentCachePath(segmentId);
    try {
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (!fileInfo.exists) {
            // console.log(`[Cache] No cache found for segment ${segmentId}`);
            return null;
        }

        const content = await FileSystem.readAsStringAsync(filePath);
        const cachedData = JSON.parse(content) as CachedSegmentData;

        // TODO: Add cache expiration logic if needed
        // const maxAge = 24 * 60 * 60 * 1000; // Example: 24 hours
        // if (Date.now() - cachedData.fetchedAt > maxAge) {
        //     console.log(`[Cache] Cache expired for segment ${segmentId}`);
        //     await FileSystem.deleteAsync(filePath, { idempotent: true });
        //     return null;
        // }

        console.log(`[Cache] Cache hit for segment ${segmentId}`);
        return cachedData;
    } catch (error) {
        console.error(`[Cache] Failed to retrieve cache for segment ${segmentId}:`, error);
        return null;
    }
};

/**
 * Generates a predictable local filename for a cached asset.
 * Export this function so it can be used by the context.
 * @param assetUrl - The original URL of the asset.
 * @param segmentId - The ID of the segment this asset belongs to.
 * @param assetType - 'audio' or 'visual'.
 * @returns The local filename.
 */
export function getAssetFilename(assetUrl: string, segmentId: UUID, assetType: 'audio' | 'visual'): string {
    const extension = assetUrl.split('.').pop()?.split('?')[0] || (assetType === 'audio' ? 'mp3' : 'jpg'); // Basic extension extraction
    return `${assetType}_${segmentId}.${extension}`;
}

/**
 * Checks if an asset is cached locally.
 * @param localFilename - The filename to check in the asset cache directory.
 * @returns The local file URI (file://...) if it exists, otherwise null.
 */
export const getCachedAssetUri = async (localFilename: string): Promise<string | null> => {
    const localUri = ASSET_CACHE_DIR + localFilename;
    try {
        const fileInfo = await FileSystem.getInfoAsync(localUri);
        if (fileInfo.exists) {
            // console.log(`[Cache] Asset cache hit: ${localFilename}`);
            return fileInfo.uri; // Return the file URI
        }
    } catch (error) {
        console.error(`[Cache] Error checking cache for ${localFilename}:`, error);
    }
    return null;
};


/**
 * Downloads and caches an asset locally if it doesn't already exist.
 * @param assetUrl - The remote URL of the asset.
 * @param localFilename - The desired local filename in the cache.
 * @returns The local file URI if successful or already cached, otherwise null.
 */
export const downloadAndCacheAsset = async (assetUrl: string, localFilename: string): Promise<string | null> => {
    const localUri = ASSET_CACHE_DIR + localFilename;
    try {
        // Check if already cached
        const existingUri = await getCachedAssetUri(localFilename);
        if (existingUri) {
            return existingUri;
        }

        // Download if not cached
        console.log(`[Cache] Downloading asset from ${assetUrl} to ${localUri}`);
        const downloadResult = await FileSystem.downloadAsync(assetUrl, localUri);

        if (downloadResult.status === 200) {
            console.log(`[Cache] Asset downloaded and cached successfully: ${localUri}`);
            return downloadResult.uri; // Return the local file URI
        } else {
            console.error(`[Cache] Failed to download asset ${assetUrl}. Status: ${downloadResult.status}`);
            await FileSystem.deleteAsync(localUri, { idempotent: true }); // Clean up failed download
            return null;
        }
    } catch (error) {
        console.error(`[Cache] Error downloading/caching asset ${assetUrl}:`, error);
        await FileSystem.deleteAsync(localUri, { idempotent: true }); // Clean up potentially corrupted file
        return null;
    }
};

// Example function combining data and asset caching (might be part of loadSegment logic)
export const cacheSegmentAssets = async (segment: NarrationSegment, visualAsset?: VisualAsset): Promise<void> => {
    let cachedAudioPath: string | undefined = undefined;
    let cachedVisualAsset: VisualAsset | undefined = visualAsset;

    // Cache audio asset
    if (segment.audioUri && segment.audioUri.startsWith('http')) { // Only cache remote URIs
        const audioFilename = getAssetFilename(segment.audioUri, segment.id, 'audio');
        cachedAudioPath = await downloadAndCacheAsset(segment.audioUri, audioFilename) ?? undefined;
    }

    // Cache visual asset (if it's remote and successfully downloaded/generated)
    if (visualAsset && visualAsset.uri.startsWith('http')) {
        const visualFilename = getAssetFilename(visualAsset.uri, segment.id, 'visual');
        const localVisualUri = await downloadAndCacheAsset(visualAsset.uri, visualFilename);
        // Update the visualAsset object to point to the local URI if caching was successful
        cachedVisualAsset = localVisualUri ? { ...visualAsset, uri: localVisualUri } : visualAsset;
    }

    // Cache segment metadata along with local asset paths
    await cacheSegmentData(segment.id, {
        segment: segment,
        visualAsset: cachedVisualAsset, // Store potentially updated asset with local URI
        audioFilePath: cachedAudioPath,
    });
};

/**
 * Checks if the essential assets for a segment seem to be cached locally.
 * @param segmentId - The ID of the segment to check.
 * @param segmentData - The segment metadata (needed for asset URLs).
 * @param requiredVisualMode - The visual mode required (to check if visual asset is needed).
 * @returns True if assets appear to be cached, false otherwise.
 */
export const isSegmentOfflineReady = async (
    segmentId: UUID,
    segmentData: NarrationSegment,
    requiredVisualMode: VisualMode
): Promise<boolean> => {
    try {
        // 1. Check audio
        const audioFilename = getAssetFilename(segmentData.audioUri, segmentId, 'audio');
        const audioUri = await getCachedAssetUri(audioFilename);
        if (!audioUri) {
            // console.log(`[Offline Check] Audio not cached for segment ${segmentId}`);
            return false;
        }

        // 2. Check visual (if required by mode and prompt exists)
        if (requiredVisualMode !== 'static' && segmentData.prompt) {
            const visualType = requiredVisualMode === 'illustrated' ? 'image' : 'loop';
            // Use a placeholder URL structure consistent with how filenames are generated
            const placeholderRemoteUrl = `http://placeholder.com/${segmentId}_${visualType}.asset`;
            const visualFilename = getAssetFilename(placeholderRemoteUrl, segmentId, 'visual');
            const visualUri = await getCachedAssetUri(visualFilename);
            if (!visualUri) {
                 // console.log(`[Offline Check] Required visual (${requiredVisualMode}) not cached for segment ${segmentId}`);
                return false;
            }
        }

        // console.log(`[Offline Check] Segment ${segmentId} appears ready.`);
        return true; // Both required assets seem to be cached
    } catch (error) {
        console.error(`[Offline Check] Error checking offline readiness for segment ${segmentId}:`, error);
        return false;
    }
};
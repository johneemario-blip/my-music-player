import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';

import { err, ok } from '@/lib/result';
import { isSupportedAudioFile } from '@/lib/track';

import type {
  DirectoryRef,
  DocumentsLibrarySource,
  FolderOption,
  ImportSummary,
} from './LibrarySource';
import { scanAudioFiles } from './scanAudioFiles';

const maxFolderDepth = 10;
const rootRef: DirectoryRef = { kind: 'documents', uri: '' };

function resolve(directory: DirectoryRef): Directory {
  return directory.uri === '' ? Paths.document : new Directory(Paths.document, directory.uri);
}

function collectFolders(directory: Directory, prefix: string, depth: number, out: FolderOption[]) {
  for (const entry of directory.list()) {
    if (!(entry instanceof Directory) || entry.name.startsWith('.')) continue;
    const path = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
    out.push({ label: path, directory: { kind: 'documents', uri: path } });
    if (depth < maxFolderDepth) collectFolders(entry, path, depth + 1, out);
  }
}

function freeDestination(target: Directory, fileName: string): File {
  const dotIndex = fileName.lastIndexOf('.');
  const stem = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  const extension = dotIndex > 0 ? fileName.slice(dotIndex) : '';
  let candidate = new File(target, fileName);
  for (let copyNumber = 2; candidate.exists; copyNumber += 1) {
    candidate = new File(target, `${stem} (${copyNumber})${extension}`);
  }
  return candidate;
}

async function copyAssets(
  assets: DocumentPicker.DocumentPickerAsset[],
  target: Directory,
): Promise<ImportSummary> {
  const summary: ImportSummary = { imported: 0, skipped: 0 };
  for (const asset of assets) {
    if (!isSupportedAudioFile(asset.name, 'ios')) {
      summary.skipped += 1;
      continue;
    }
    await new File(asset.uri).copy(freeDestination(target, asset.name));
    summary.imported += 1;
  }
  return summary;
}

export const iosLibrarySource: DocumentsLibrarySource = {
  async pickDirectory() {
    return ok(rootRef);
  },

  async listFolders() {
    const nested: FolderOption[] = [];
    try {
      collectFolders(Paths.document, '', 0, nested);
    } catch {
      return err('access-denied');
    }
    nested.sort((left, right) => left.label.localeCompare(right.label));
    return ok([{ label: '', directory: rootRef }, ...nested]);
  },

  async listAudioFiles(directoryRef) {
    const directory = resolve(directoryRef);
    if (!directory.exists) return err('not-found');
    try {
      return ok(scanAudioFiles(directory, 'ios'));
    } catch {
      return err('access-denied');
    }
  },

  async hasAccess(directoryRef) {
    return resolve(directoryRef).exists;
  },

  async importFiles(targetRef) {
    const target = resolve(targetRef);
    if (!target.exists) return err('not-found');
    let picked: DocumentPicker.DocumentPickerResult;
    try {
      picked = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        multiple: true,
        copyToCacheDirectory: true,
      });
    } catch {
      return err('picker-failed');
    }
    if (picked.canceled) return ok({ imported: 0, skipped: 0 });
    try {
      return ok(await copyAssets(picked.assets, target));
    } catch {
      return err('import-failed');
    }
  },
};

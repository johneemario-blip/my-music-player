// In-memory stand-in for the `expo-file-system` File/Directory classes used in unit tests.
export type FakeNode = { [name: string]: FakeNode | 'file' };

interface FakeState {
  tree: FakeNode;
  root: string;
  unreadable: Set<string>;
  pickResult: { uri: string } | { error: Error };
}

export const fakeFs: FakeState = {
  tree: {},
  root: 'content://tree/Music',
  unreadable: new Set(),
  pickResult: { uri: 'content://tree/Music' },
};

export function resetFakeFs(tree: FakeNode = {}, root = 'content://tree/Music') {
  fakeFs.tree = tree;
  fakeFs.root = root;
  fakeFs.unreadable = new Set();
  fakeFs.pickResult = { uri: root };
}

function lookup(uri: string): FakeNode | 'file' | undefined {
  if (!uri.startsWith(fakeFs.root)) return undefined;
  const relative = uri.slice(fakeFs.root.length).split('/').filter(Boolean);
  let node: FakeNode | 'file' | undefined = fakeFs.tree;
  for (const part of relative) {
    if (node === undefined || node === 'file') return undefined;
    node = node[decodeURIComponent(part)];
  }
  return node;
}

function joinUri(base: string, name: string): string {
  return `${base.replace(/\/$/, '')}/${encodeURIComponent(name)}`;
}

function lastSegment(uri: string): string {
  return decodeURIComponent(uri.replace(/\/$/, '').split('/').pop() ?? '');
}

export class File {
  readonly uri: string;
  constructor(uri: string) {
    this.uri = uri;
  }
  get name() {
    return lastSegment(this.uri);
  }
  get exists() {
    return lookup(this.uri) === 'file';
  }
}

export class Directory {
  readonly uri: string;
  constructor(uri: string) {
    this.uri = uri;
  }
  get name() {
    return lastSegment(this.uri);
  }
  get exists() {
    const node = lookup(this.uri);
    return node !== undefined && node !== 'file';
  }
  list(): (Directory | File)[] {
    if (fakeFs.unreadable.has(this.uri)) {
      throw new Error('java.lang.SecurityException: Permission Denial');
    }
    const node = lookup(this.uri);
    if (node === undefined || node === 'file') throw new Error('Directory does not exist');
    return Object.entries(node).map(([name, child]) =>
      child === 'file' ? new File(joinUri(this.uri, name)) : new Directory(joinUri(this.uri, name)),
    );
  }
  static async pickDirectoryAsync(): Promise<Directory> {
    const result = fakeFs.pickResult;
    if ('error' in result) throw result.error;
    return new Directory(result.uri);
  }
}

// In-memory stand-in for the `expo-file-system` File/Directory/Paths classes used in unit tests.
export type FakeNode = { [name: string]: FakeNode | 'file' };

interface FakeState {
  tree: FakeNode;
  root: string;
  unreadable: Set<string>;
  pickResult: { uri: string } | { error: Error };
  /** Files outside the tree (e.g. picker cache) that can be copied into it. */
  external: Set<string>;
  failCopy: boolean;
}

export const fakeFs: FakeState = {
  tree: {},
  root: 'content://tree/Music',
  unreadable: new Set(),
  pickResult: { uri: 'content://tree/Music' },
  external: new Set(),
  failCopy: false,
};

export function resetFakeFs(tree: FakeNode = {}, root = 'content://tree/Music') {
  fakeFs.tree = tree;
  fakeFs.root = root;
  fakeFs.unreadable = new Set();
  fakeFs.pickResult = { uri: root };
  fakeFs.external = new Set();
  fakeFs.failCopy = false;
}

function segments(uri: string): string[] | undefined {
  const base = fakeFs.root.replace(/\/$/, '');
  const trimmed = uri.replace(/\/$/, '');
  if (trimmed !== base && !trimmed.startsWith(`${base}/`)) return undefined;
  return trimmed.slice(base.length).split('/').filter(Boolean).map(decodeURIComponent);
}

function lookup(uri: string): FakeNode | 'file' | undefined {
  const parts = segments(uri);
  if (parts === undefined) return undefined;
  let node: FakeNode | 'file' | undefined = fakeFs.tree;
  for (const part of parts) {
    if (node === undefined || node === 'file') return undefined;
    node = node[part];
  }
  return node;
}

function writeFile(uri: string) {
  const parts = segments(uri);
  const name = parts?.pop();
  if (parts === undefined || name === undefined) throw new Error(`Outside fake tree: ${uri}`);
  let node: FakeNode | 'file' | undefined = fakeFs.tree;
  for (const part of parts) {
    if (node === undefined || node === 'file') throw new Error(`Missing parent for ${uri}`);
    node = node[part];
  }
  if (node === undefined || node === 'file') throw new Error(`Missing parent for ${uri}`);
  node[name] = 'file';
}

type UriPart = string | { uri: string };

function joinUri(parts: UriPart[]): string {
  return parts
    .map((part) => (typeof part === 'string' ? part : part.uri))
    .filter((part) => part.length > 0)
    .reduce((base, part) => {
      if (base === '') return part;
      const encoded = part
        .split('/')
        .filter(Boolean)
        .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
        .join('/');
      return encoded === '' ? base : `${base.replace(/\/$/, '')}/${encoded}`;
    }, '');
}

function lastSegment(uri: string): string {
  return decodeURIComponent(uri.replace(/\/$/, '').split('/').pop() ?? '');
}

export class File {
  readonly uri: string;
  constructor(...parts: UriPart[]) {
    this.uri = joinUri(parts);
  }
  get name() {
    return lastSegment(this.uri);
  }
  get exists() {
    return lookup(this.uri) === 'file' || fakeFs.external.has(this.uri);
  }
  async copy(destination: File | Directory): Promise<void> {
    if (fakeFs.failCopy) throw new Error('Unable to copy');
    if (!this.exists) throw new Error(`Source missing: ${this.uri}`);
    const target =
      destination instanceof Directory ? new File(destination, this.name) : destination;
    if (target.exists) throw new Error('Destination already exists');
    writeFile(target.uri);
  }
}

export class Directory {
  readonly uri: string;
  constructor(...parts: UriPart[]) {
    this.uri = joinUri(parts);
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
      child === 'file' ? new File(this, name) : new Directory(this, name),
    );
  }
  static async pickDirectoryAsync(): Promise<Directory> {
    const result = fakeFs.pickResult;
    if ('error' in result) throw result.error;
    return new Directory(result.uri);
  }
}

export class Paths {
  static get document(): Directory {
    return new Directory(fakeFs.root);
  }
}

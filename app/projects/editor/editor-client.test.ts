import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("editor title can enter inline edit mode on click and saves on blur", async () => {
  const source = await readFile(new URL("./editor-client.tsx", import.meta.url), "utf8");

  assert.match(source, /onClick=\{\(\) => startTitleEditing\(\)\}/);
  assert.match(source, /onBlur=\{\(\) => void commitTitleChange\(\)\}/);
  assert.match(source, /<Pencil className="size-4" \/>/);
  assert.match(source, /<Input/);
});

test("editor file operations are rendered as actions on each tree node", async () => {
  const source = await readFile(new URL("./editor-client.tsx", import.meta.url), "utf8");
  const toolbarSource = source.slice(
    source.indexOf('<div className="flex flex-wrap gap-2">'),
    source.indexOf('<Button size="sm" onClick={() => void handleSave()}')
  );

  assert.match(source, /renderActions=\{\(element\) =>/);
  assert.match(source, /entryDialogStateFromTreeElement\(element\)/);
  assert.match(source, /handleRefreshEntry\(target\)/);
  assert.match(source, /handleUploadIntoEntry\(target\)/);
  assert.match(source, /setCreateFileState\(target\)/);
  assert.match(source, /setCreateDirectoryState\(target\)/);
  assert.match(source, /onDelete=\{\(\) => setDeleteEntryState\(target\)\}/);
  assert.doesNotMatch(toolbarSource, /editor\.refreshFiles|editor\.uploadFiles|editor\.newFolder|editor\.deleteEntry/);
});

test("editor groups node operations behind one labeled action menu", async () => {
  const source = await readFile(new URL("./editor-client.tsx", import.meta.url), "utf8");
  const actionSource = source.slice(
    source.indexOf("function TreeNodeActions"),
    source.indexOf("export default function EditorClient")
  );

  assert.match(source, /Ellipsis/);
  assert.match(source, /PopoverTrigger/);
  assert.match(source, /PopoverPopup/);
  assert.match(source, /t\("editor\.nodeActions"\)/);
  assert.match(actionSource, /icon \+ action label/);
  assert.match(actionSource, /editor\.refreshFiles/);
  assert.match(actionSource, /editor\.uploadFiles/);
  assert.match(actionSource, /editor\.newFile/);
  assert.match(actionSource, /editor\.newFolder/);
  assert.match(actionSource, /editor\.deleteEntry/);
});

test("editor can create a blank text file in the selected node directory", async () => {
  const source = await readFile(new URL("./editor-client.tsx", import.meta.url), "utf8");

  assert.match(source, /const \[createFileState, setCreateFileState\] = useState<EntryDialogState \| null>\(null\)/);
  assert.match(source, /async function handleCreateFile\(\)/);
  assert.match(source, /resolveNewEntryPath\(dialogState\.path, dialogState\.kind, name\)/);
  assert.match(source, /await writeTextFile\(root, path, ""\)/);
  assert.match(source, /await reloadFiles\(path, "file"\)/);
  assert.match(source, /title=\{t\("editor\.newFileTitle"\)\}/);
});

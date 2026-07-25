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

test("editor uses mobile tabs defaulting to chat while preserving desktop columns", async () => {
  const source = await readFile(new URL("./editor-client.tsx", import.meta.url), "utf8");

  assert.match(source, /import \{ Tabs, TabsList, TabsTrigger \} from "@\/components\/ui\/tabs"/);
  assert.match(source, /const \[mobileTab, setMobileTab\] = useState<EditorMobileTab>\("chat"\)/);
  assert.match(source, /<Tabs value=\{mobileTab\} onValueChange=\{selectMobileTab\} className="shrink-0 border-b p-2 lg:hidden">/);
  assert.match(source, /<TabsTrigger value="chat">\{t\("editor\.chat"\)\}<\/TabsTrigger>/);
  assert.match(source, /<TabsTrigger value="files">\{t\("editor\.files"\)\}<\/TabsTrigger>/);
  assert.match(source, /<TabsTrigger value="editor">\{t\("editor\.content"\)\}<\/TabsTrigger>/);
  assert.match(source, /<div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-\[260px_1fr_360px\]">/);
  assert.match(source, /mobileTab === "chat" \? "block" : "hidden",\s*"lg:block"/);
});

test("editor places sync to cloud drive immediately after backup", async () => {
  const source = await readFile(new URL("./editor-client.tsx", import.meta.url), "utf8");
  const backupIndex = source.indexOf('{t("editor.downloadSource")}');
  const syncIndex = source.indexOf('{t("projects.cloudUploadProject")}', backupIndex);

  assert.ok(backupIndex >= 0);
  assert.ok(syncIndex > backupIndex);
  assert.match(source, /prepareCloudUpload\(\)/);
  assert.match(source, /projects\.cloudUploadTitle/);
  assert.match(source, /uploadLocalWorkspace/);
});

test("editor moves project actions into a mobile top-right menu", async () => {
  const source = await readFile(new URL("./editor-client.tsx", import.meta.url), "utf8");
  const mobileMenuSource = source.slice(
    source.indexOf("function MobileProjectActions"),
    source.indexOf("export default function EditorClient")
  );

  assert.match(source, /function MobileProjectActions/);
  assert.match(mobileMenuSource, /className="lg:hidden"/);
  assert.match(mobileMenuSource, /Menu/);
  assert.match(mobileMenuSource, /editor\.preview/);
  assert.match(mobileMenuSource, /editor\.export/);
  assert.match(mobileMenuSource, /editor\.downloadSource/);
  assert.match(mobileMenuSource, /projects\.cloudUploadProject/);
  assert.match(mobileMenuSource, /editor\.save/);
  assert.match(source, /className="hidden gap-2 lg:flex"/);
});

test("project read tool supports batch file paths while keeping single path compatibility", async () => {
  const source = await readFile(new URL("./editor-client.tsx", import.meta.url), "utf8");
  const readToolSource = source.slice(
    source.indexOf('name: "genstory_read_project_file"'),
    source.indexOf('name: "genstory_search_project_files"')
  );

  assert.match(readToolSource, /path: \{ type: "string"/);
  assert.match(readToolSource, /paths: \{\s*type: "array"/);
  assert.match(readToolSource, /items: \{ type: "string"/);
  assert.match(readToolSource, /const files = paths\.map/);
});

test("project move tool supports batch moves while keeping single move compatibility", async () => {
  const source = await readFile(new URL("./editor-client.tsx", import.meta.url), "utf8");
  const moveToolSource = source.slice(
    source.indexOf('name: "genstory_move_project_file"'),
    source.indexOf("const createDirectoryTarget")
  );

  assert.match(moveToolSource, /sourcePath: \{/);
  assert.match(moveToolSource, /targetPath: \{/);
  assert.match(moveToolSource, /moves: \{\s*type: "array"/);
  assert.match(moveToolSource, /items: \{\s*type: "object"/);
  assert.match(moveToolSource, /for \(const move of moves\)/);
  assert.match(moveToolSource, /: \{ moved: true, moves \}/);
});

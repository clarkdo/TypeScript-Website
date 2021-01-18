define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createVirtualLanguageServiceHost = exports.createVirtualCompilerHost = exports.createFSBackedSystem = exports.createSystem = exports.createDefaultMapFromCDN = exports.addFilesForTypesIntoFolder = exports.addAllFilesFromFolder = exports.createDefaultMapFromNodeModules = exports.knownLibFilesForCompilerOptions = exports.createVirtualTypeScriptEnvironment = void 0;
    let hasLocalStorage = false;
    try {
        hasLocalStorage = typeof localStorage !== `undefined`;
    }
    catch (error) { }
    const hasProcess = typeof process !== `undefined`;
    const shouldDebug = (hasLocalStorage && localStorage.getItem("DEBUG")) || (hasProcess && process.env.DEBUG);
    const debugLog = shouldDebug ? console.log : (_message, ..._optionalParams) => "";
    /**
     * Makes a virtual copy of the TypeScript environment. This is the main API you want to be using with
     * @typescript/vfs. A lot of the other exposed functions are used by this function to get set up.
     *
     * @param sys an object which conforms to the TS Sys (a shim over read/write access to the fs)
     * @param rootFiles a list of files which are considered inside the project
     * @param ts a copy pf the TypeScript module
     * @param compilerOptions the options for this compiler run
     * @param customTransformers custom transformers for this compiler run
     */
    function createVirtualTypeScriptEnvironment(sys, rootFiles, ts, compilerOptions = {}, customTransformers) {
        const mergedCompilerOpts = Object.assign(Object.assign({}, defaultCompilerOptions(ts)), compilerOptions);
        const { languageServiceHost, updateFile } = createVirtualLanguageServiceHost(sys, rootFiles, mergedCompilerOpts, ts, customTransformers);
        const languageService = ts.createLanguageService(languageServiceHost);
        const diagnostics = languageService.getCompilerOptionsDiagnostics();
        if (diagnostics.length) {
            const compilerHost = createVirtualCompilerHost(sys, compilerOptions, ts);
            throw new Error(ts.formatDiagnostics(diagnostics, compilerHost.compilerHost));
        }
        return {
            sys,
            languageService,
            getSourceFile: fileName => { var _a; return (_a = languageService.getProgram()) === null || _a === void 0 ? void 0 : _a.getSourceFile(fileName); },
            createFile: (fileName, content) => {
                updateFile(ts.createSourceFile(fileName, content, mergedCompilerOpts.target, false));
            },
            updateFile: (fileName, content, optPrevTextSpan) => {
                const prevSourceFile = languageService.getProgram().getSourceFile(fileName);
                if (!prevSourceFile) {
                    throw new Error("Did not find a source file for " + fileName);
                }
                const prevFullContents = prevSourceFile.text;
                // TODO: Validate if the default text span has a fencepost error?
                const prevTextSpan = optPrevTextSpan !== null && optPrevTextSpan !== void 0 ? optPrevTextSpan : ts.createTextSpan(0, prevFullContents.length);
                const newText = prevFullContents.slice(0, prevTextSpan.start) +
                    content +
                    prevFullContents.slice(prevTextSpan.start + prevTextSpan.length);
                const newSourceFile = ts.updateSourceFile(prevSourceFile, newText, {
                    span: prevTextSpan,
                    newLength: content.length,
                });
                updateFile(newSourceFile);
            },
        };
    }
    exports.createVirtualTypeScriptEnvironment = createVirtualTypeScriptEnvironment;
    /**
     * Grab the list of lib files for a particular target, will return a bit more than necessary (by including
     * the dom) but that's OK
     *
     * @param target The compiler settings target baseline
     * @param ts A copy of the TypeScript module
     */
    const knownLibFilesForCompilerOptions = (compilerOptions, ts) => {
        const target = compilerOptions.target || ts.ScriptTarget.ES5;
        const lib = compilerOptions.lib || [];
        const files = [
            "lib.d.ts",
            "lib.dom.d.ts",
            "lib.dom.iterable.d.ts",
            "lib.webworker.d.ts",
            "lib.webworker.importscripts.d.ts",
            "lib.scripthost.d.ts",
            "lib.es5.d.ts",
            "lib.es6.d.ts",
            "lib.es2015.collection.d.ts",
            "lib.es2015.core.d.ts",
            "lib.es2015.d.ts",
            "lib.es2015.generator.d.ts",
            "lib.es2015.iterable.d.ts",
            "lib.es2015.promise.d.ts",
            "lib.es2015.proxy.d.ts",
            "lib.es2015.reflect.d.ts",
            "lib.es2015.symbol.d.ts",
            "lib.es2015.symbol.wellknown.d.ts",
            "lib.es2016.array.include.d.ts",
            "lib.es2016.d.ts",
            "lib.es2016.full.d.ts",
            "lib.es2017.d.ts",
            "lib.es2017.full.d.ts",
            "lib.es2017.intl.d.ts",
            "lib.es2017.object.d.ts",
            "lib.es2017.sharedmemory.d.ts",
            "lib.es2017.string.d.ts",
            "lib.es2017.typedarrays.d.ts",
            "lib.es2018.asyncgenerator.d.ts",
            "lib.es2018.asynciterable.d.ts",
            "lib.es2018.d.ts",
            "lib.es2018.full.d.ts",
            "lib.es2018.intl.d.ts",
            "lib.es2018.promise.d.ts",
            "lib.es2018.regexp.d.ts",
            "lib.es2019.array.d.ts",
            "lib.es2019.d.ts",
            "lib.es2019.full.d.ts",
            "lib.es2019.object.d.ts",
            "lib.es2019.string.d.ts",
            "lib.es2019.symbol.d.ts",
            "lib.es2020.d.ts",
            "lib.es2020.full.d.ts",
            "lib.es2020.string.d.ts",
            "lib.es2020.symbol.wellknown.d.ts",
            "lib.es2020.bigint.d.ts",
            "lib.es2020.promise.d.ts",
            "lib.es2020.sharedmemory.d.ts",
            "lib.es2020.intl.d.ts",
            "lib.esnext.array.d.ts",
            "lib.esnext.asynciterable.d.ts",
            "lib.esnext.bigint.d.ts",
            "lib.esnext.d.ts",
            "lib.esnext.full.d.ts",
            "lib.esnext.intl.d.ts",
            "lib.esnext.symbol.d.ts",
        ];
        const targetToCut = ts.ScriptTarget[target];
        const matches = files.filter(f => f.startsWith(`lib.${targetToCut.toLowerCase()}`));
        const targetCutIndex = files.indexOf(matches.pop());
        const getMax = (array) => array && array.length ? array.reduce((max, current) => (current > max ? current : max)) : undefined;
        // Find the index for everything in
        const indexesForCutting = lib.map(lib => {
            const matches = files.filter(f => f.startsWith(`lib.${lib.toLowerCase()}`));
            if (matches.length === 0)
                return 0;
            const cutIndex = files.indexOf(matches.pop());
            return cutIndex;
        });
        const libCutIndex = getMax(indexesForCutting) || 0;
        const finalCutIndex = Math.max(targetCutIndex, libCutIndex);
        return files.slice(0, finalCutIndex + 1);
    };
    exports.knownLibFilesForCompilerOptions = knownLibFilesForCompilerOptions;
    /**
     * Sets up a Map with lib contents by grabbing the necessary files from
     * the local copy of typescript via the file system.
     */
    const createDefaultMapFromNodeModules = (compilerOptions, ts) => {
        const tsModule = ts || require("typescript");
        const path = require("path");
        const fs = require("fs");
        const getLib = (name) => {
            const lib = path.dirname(require.resolve("typescript"));
            return fs.readFileSync(path.join(lib, name), "utf8");
        };
        const libs = exports.knownLibFilesForCompilerOptions(compilerOptions, tsModule);
        const fsMap = new Map();
        libs.forEach(lib => {
            fsMap.set("/" + lib, getLib(lib));
        });
        return fsMap;
    };
    exports.createDefaultMapFromNodeModules = createDefaultMapFromNodeModules;
    /**
     * Adds recursively files from the FS into the map based on the folder
     */
    const addAllFilesFromFolder = (map, workingDir) => {
        const path = require("path");
        const fs = require("fs");
        const walk = function (dir) {
            let results = [];
            const list = fs.readdirSync(dir);
            list.forEach(function (file) {
                file = path.join(dir, file);
                const stat = fs.statSync(file);
                if (stat && stat.isDirectory()) {
                    /* Recurse into a subdirectory */
                    results = results.concat(walk(file));
                }
                else {
                    /* Is a file */
                    results.push(file);
                }
            });
            return results;
        };
        const allFiles = walk(workingDir);
        allFiles.forEach(lib => {
            const fsPath = "/node_modules/@types" + lib.replace(workingDir, "");
            const content = fs.readFileSync(lib, "utf8");
            const validExtensions = [".ts", ".tsx"];
            if (validExtensions.includes(path.extname(fsPath))) {
                map.set(fsPath, content);
            }
        });
    };
    exports.addAllFilesFromFolder = addAllFilesFromFolder;
    /** Adds all files from node_modules/@types into the FS Map */
    const addFilesForTypesIntoFolder = (map) => exports.addAllFilesFromFolder(map, "node_modules/@types");
    exports.addFilesForTypesIntoFolder = addFilesForTypesIntoFolder;
    /**
     * Create a virtual FS Map with the lib files from a particular TypeScript
     * version based on the target, Always includes dom ATM.
     *
     * @param options The compiler target, which dictates the libs to set up
     * @param version the versions of TypeScript which are supported
     * @param cache should the values be stored in local storage
     * @param ts a copy of the typescript import
     * @param lzstring an optional copy of the lz-string import
     * @param fetcher an optional replacement for the global fetch function (tests mainly)
     * @param storer an optional replacement for the localStorage global (tests mainly)
     */
    const createDefaultMapFromCDN = (options, version, cache, ts, lzstring, fetcher, storer) => {
        const fetchlike = fetcher || fetch;
        const storelike = storer || localStorage;
        const fsMap = new Map();
        const files = exports.knownLibFilesForCompilerOptions(options, ts);
        const prefix = `https://typescript.azureedge.net/cdn/${version}/typescript/lib/`;
        function zip(str) {
            return lzstring ? lzstring.compressToUTF16(str) : str;
        }
        function unzip(str) {
            return lzstring ? lzstring.decompressFromUTF16(str) : str;
        }
        // Map the known libs to a node fetch promise, then return the contents
        function uncached() {
            return Promise.all(files.map(lib => fetchlike(prefix + lib).then(resp => resp.text()))).then(contents => {
                contents.forEach((text, index) => fsMap.set("/" + files[index], text));
            });
        }
        // A localstorage and lzzip aware version of the lib files
        function cached() {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                // Remove anything which isn't from this version
                if (key.startsWith("ts-lib-") && !key.startsWith("ts-lib-" + version)) {
                    storelike.removeItem(key);
                }
            });
            return Promise.all(files.map(lib => {
                const cacheKey = `ts-lib-${version}-${lib}`;
                const content = storelike.getItem(cacheKey);
                if (!content) {
                    // Make the API call and store the text concent in the cache
                    return fetchlike(prefix + lib)
                        .then(resp => resp.text())
                        .then(t => {
                        storelike.setItem(cacheKey, zip(t));
                        return t;
                    });
                }
                else {
                    return Promise.resolve(unzip(content));
                }
            })).then(contents => {
                contents.forEach((text, index) => {
                    const name = "/" + files[index];
                    fsMap.set(name, text);
                });
            });
        }
        const func = cache ? cached : uncached;
        return func().then(() => fsMap);
    };
    exports.createDefaultMapFromCDN = createDefaultMapFromCDN;
    function notImplemented(methodName) {
        throw new Error(`Method '${methodName}' is not implemented.`);
    }
    function audit(name, fn) {
        return (...args) => {
            const res = fn(...args);
            const smallres = typeof res === "string" ? res.slice(0, 80) + "..." : res;
            debugLog("> " + name, ...args);
            debugLog("< " + smallres);
            return res;
        };
    }
    /** The default compiler options if TypeScript could ever change the compiler options */
    const defaultCompilerOptions = (ts) => {
        return Object.assign(Object.assign({}, ts.getDefaultCompilerOptions()), { jsx: ts.JsxEmit.React, strict: true, esModuleInterop: true, module: ts.ModuleKind.ESNext, suppressOutputPathCheck: true, skipLibCheck: true, skipDefaultLibCheck: true, moduleResolution: ts.ModuleResolutionKind.NodeJs });
    };
    // "/DOM.d.ts" => "/lib.dom.d.ts"
    const libize = (path) => path.replace("/", "/lib.").toLowerCase();
    /**
     * Creates an in-memory System object which can be used in a TypeScript program, this
     * is what provides read/write aspects of the virtual fs
     */
    function createSystem(files) {
        return {
            args: [],
            createDirectory: () => notImplemented("createDirectory"),
            // TODO: could make a real file tree
            directoryExists: audit("directoryExists", directory => {
                return Array.from(files.keys()).some(path => path.startsWith(directory));
            }),
            exit: () => notImplemented("exit"),
            fileExists: audit("fileExists", fileName => files.has(fileName) || files.has(libize(fileName))),
            getCurrentDirectory: () => "/",
            getDirectories: () => [],
            getExecutingFilePath: () => notImplemented("getExecutingFilePath"),
            readDirectory: audit("readDirectory", directory => (directory === "/" ? Array.from(files.keys()) : [])),
            readFile: audit("readFile", fileName => files.get(fileName) || files.get(libize(fileName))),
            resolvePath: path => path,
            newLine: "\n",
            useCaseSensitiveFileNames: true,
            write: () => notImplemented("write"),
            writeFile: (fileName, contents) => {
                files.set(fileName, contents);
            },
        };
    }
    exports.createSystem = createSystem;
    /**
     * Creates a file-system backed System object which can be used in a TypeScript program, you provide
     * a set of virtual files which are prioritised over the FS versions, then a path to the root of your
     * project (basically the folder your node_modules lives)
     */
    function createFSBackedSystem(files, _projectRoot, ts) {
        // We need to make an isolated folder for the tsconfig, but also need to be able to resolve the
        // existing node_modules structures going back through the history
        const root = _projectRoot + "/vfs";
        const path = require("path");
        // The default System in TypeScript
        const nodeSys = ts.sys;
        const tsLib = path.dirname(require.resolve("typescript"));
        return {
            args: [],
            createDirectory: () => notImplemented("createDirectory"),
            // TODO: could make a real file tree
            directoryExists: audit("directoryExists", directory => {
                return Array.from(files.keys()).some(path => path.startsWith(directory)) || nodeSys.directoryExists(directory);
            }),
            exit: nodeSys.exit,
            fileExists: audit("fileExists", fileName => {
                if (files.has(fileName))
                    return true;
                // Don't let other tsconfigs end up touching the vfs
                if (fileName.includes("tsconfig.json") || fileName.includes("tsconfig.json"))
                    return false;
                if (fileName.startsWith("/lib")) {
                    const tsLibName = `${tsLib}/${fileName.replace("/", "")}`;
                    return nodeSys.fileExists(tsLibName);
                }
                return nodeSys.fileExists(fileName);
            }),
            getCurrentDirectory: () => root,
            getDirectories: nodeSys.getDirectories,
            getExecutingFilePath: () => notImplemented("getExecutingFilePath"),
            readDirectory: audit("readDirectory", (...args) => {
                if (args[0] === "/") {
                    return Array.from(files.keys());
                }
                else {
                    return nodeSys.readDirectory(...args);
                }
            }),
            readFile: audit("readFile", fileName => {
                if (files.has(fileName))
                    return files.get(fileName);
                if (fileName.startsWith("/lib")) {
                    const tsLibName = `${tsLib}/${fileName.replace("/", "")}`;
                    const result = nodeSys.readFile(tsLibName);
                    if (!result) {
                        const libs = nodeSys.readDirectory(tsLib);
                        throw new Error(`TSVFS: A request was made for ${tsLibName} but there wasn't a file found in the file map. You likely have a mismatch in the compiler options for the CDN download vs the compiler program. Existing Libs: ${libs}.`);
                    }
                    return result;
                }
                return nodeSys.readFile(fileName);
            }),
            resolvePath: path => {
                if (files.has(path))
                    return path;
                return nodeSys.resolvePath(path);
            },
            newLine: "\n",
            useCaseSensitiveFileNames: true,
            write: () => notImplemented("write"),
            writeFile: (fileName, contents) => {
                files.set(fileName, contents);
            },
        };
    }
    exports.createFSBackedSystem = createFSBackedSystem;
    /**
     * Creates an in-memory CompilerHost -which is essentially an extra wrapper to System
     * which works with TypeScript objects - returns both a compiler host, and a way to add new SourceFile
     * instances to the in-memory file system.
     */
    function createVirtualCompilerHost(sys, compilerOptions, ts) {
        const sourceFiles = new Map();
        const save = (sourceFile) => {
            sourceFiles.set(sourceFile.fileName, sourceFile);
            return sourceFile;
        };
        const vHost = {
            compilerHost: Object.assign(Object.assign({}, sys), { getCanonicalFileName: fileName => fileName, getDefaultLibFileName: () => "/" + ts.getDefaultLibFileName(compilerOptions), 
                // getDefaultLibLocation: () => '/',
                getDirectories: () => [], getNewLine: () => sys.newLine, getSourceFile: fileName => {
                    return (sourceFiles.get(fileName) ||
                        save(ts.createSourceFile(fileName, sys.readFile(fileName), compilerOptions.target || defaultCompilerOptions(ts).target, false)));
                }, useCaseSensitiveFileNames: () => sys.useCaseSensitiveFileNames }),
            updateFile: sourceFile => {
                const alreadyExists = sourceFiles.has(sourceFile.fileName);
                sys.writeFile(sourceFile.fileName, sourceFile.text);
                sourceFiles.set(sourceFile.fileName, sourceFile);
                return alreadyExists;
            },
        };
        return vHost;
    }
    exports.createVirtualCompilerHost = createVirtualCompilerHost;
    /**
     * Creates an object which can host a language service against the virtual file-system
     */
    function createVirtualLanguageServiceHost(sys, rootFiles, compilerOptions, ts, customTransformers) {
        const fileNames = [...rootFiles];
        const { compilerHost, updateFile } = createVirtualCompilerHost(sys, compilerOptions, ts);
        const fileVersions = new Map();
        let projectVersion = 0;
        const languageServiceHost = Object.assign(Object.assign({}, compilerHost), { getProjectVersion: () => projectVersion.toString(), getCompilationSettings: () => compilerOptions, getCustomTransformers: () => customTransformers, getScriptFileNames: () => fileNames, getScriptSnapshot: fileName => {
                const contents = sys.readFile(fileName);
                if (contents) {
                    return ts.ScriptSnapshot.fromString(contents);
                }
                return;
            }, getScriptVersion: fileName => {
                return fileVersions.get(fileName) || "0";
            }, writeFile: sys.writeFile });
        const lsHost = {
            languageServiceHost,
            updateFile: sourceFile => {
                projectVersion++;
                fileVersions.set(sourceFile.fileName, projectVersion.toString());
                if (!fileNames.includes(sourceFile.fileName)) {
                    fileNames.push(sourceFile.fileName);
                }
                updateFile(sourceFile);
            },
        };
        return lsHost;
    }
    exports.createVirtualLanguageServiceHost = createVirtualLanguageServiceHost;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZXNjcmlwdC12ZnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zYW5kYm94L3NyYy92ZW5kb3IvdHlwZXNjcmlwdC12ZnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztJQVFBLElBQUksZUFBZSxHQUFHLEtBQUssQ0FBQTtJQUMzQixJQUFJO1FBQ0YsZUFBZSxHQUFHLE9BQU8sWUFBWSxLQUFLLFdBQVcsQ0FBQTtLQUN0RDtJQUFDLE9BQU8sS0FBSyxFQUFFLEdBQUU7SUFFbEIsTUFBTSxVQUFVLEdBQUcsT0FBTyxPQUFPLEtBQUssV0FBVyxDQUFBO0lBQ2pELE1BQU0sV0FBVyxHQUFHLENBQUMsZUFBZSxJQUFJLFlBQVksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBQzNHLE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFjLEVBQUUsR0FBRyxlQUFzQixFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUE7SUFVOUY7Ozs7Ozs7OztPQVNHO0lBRUgsU0FBZ0Isa0NBQWtDLENBQ2hELEdBQVcsRUFDWCxTQUFtQixFQUNuQixFQUFNLEVBQ04sa0JBQW1DLEVBQUUsRUFDckMsa0JBQXVDO1FBRXZDLE1BQU0sa0JBQWtCLG1DQUFRLHNCQUFzQixDQUFDLEVBQUUsQ0FBQyxHQUFLLGVBQWUsQ0FBRSxDQUFBO1FBRWhGLE1BQU0sRUFBRSxtQkFBbUIsRUFBRSxVQUFVLEVBQUUsR0FBRyxnQ0FBZ0MsQ0FDMUUsR0FBRyxFQUNILFNBQVMsRUFDVCxrQkFBa0IsRUFDbEIsRUFBRSxFQUNGLGtCQUFrQixDQUNuQixDQUFBO1FBQ0QsTUFBTSxlQUFlLEdBQUcsRUFBRSxDQUFDLHFCQUFxQixDQUFDLG1CQUFtQixDQUFDLENBQUE7UUFD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LEVBQUUsQ0FBQyxDQUFBO2dCQUNoRSxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUU7b0JBQzVDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFBO2lCQUNwQztnQkFDRCxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUE7WUFDeEIsQ0FBQztTQUNGLENBQUE7UUFDRCxPQUFPLE1BQU0sQ0FBQTtJQUNmLENBQUM7SUEvQ0QsNEVBK0NDIiwic291cmNlc0NvbnRlbnQiOlsidHlwZSBTeXN0ZW0gPSBpbXBvcnQoXCJ0eXBlc2NyaXB0XCIpLlN5c3RlbVxudHlwZSBDb21waWxlck9wdGlvbnMgPSBpbXBvcnQoXCJ0eXBlc2NyaXB0XCIpLkNvbXBpbGVyT3B0aW9uc1xudHlwZSBDdXN0b21UcmFuc2Zvcm1lcnMgPSBpbXBvcnQoXCJ0eXBlc2NyaXB0XCIpLkN1c3RvbVRyYW5zZm9ybWVyc1xudHlwZSBMYW5ndWFnZVNlcnZpY2VIb3N0ID0gaW1wb3J0KFwidHlwZXNjcmlwdFwiKS5MYW5ndWFnZVNlcnZpY2VIb3N0XG50eXBlIENvbXBpbGVySG9zdCA9IGltcG9ydChcInR5cGVzY3JpcHRcIikuQ29tcGlsZXJIb3N0XG50eXBlIFNvdXJjZUZpbGUgPSBpbXBvcnQoXCJ0eXBlc2NyaXB0XCIpLlNvdXJjZUZpbGVcbnR5cGUgVFMgPSB0eXBlb2YgaW1wb3J0KFwidHlwZXNjcmlwdFwiKVxuXG5sZXQgaGFzTG9jYWxTdG9yYWdlID0gZmFsc2VcbnRyeSB7XG4gIGhhc0xvY2FsU3RvcmFnZSA9IHR5cGVvZiBsb2NhbFN0b3JhZ2UgIT09IGB1bmRlZmluZWRgXG59IGNhdGNoIChlcnJvcikge31cblxuY29uc3QgaGFzUHJvY2VzcyA9IHR5cGVvZiBwcm9jZXNzICE9PSBgdW5kZWZpbmVkYFxuY29uc3Qgc2hvdWxkRGVidWcgPSAoaGFzTG9jYWxTdG9yYWdlICYmIGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwiREVCVUdcIikpIHx8IChoYXNQcm9jZXNzICYmIHByb2Nlc3MuZW52LkRFQlVHKVxuY29uc3QgZGVidWdMb2cgPSBzaG91bGREZWJ1ZyA/IGNvbnNvbGUubG9nIDogKF9tZXNzYWdlPzogYW55LCAuLi5fb3B0aW9uYWxQYXJhbXM6IGFueVtdKSA9PiBcIlwiXG5cbmV4cG9ydCBpbnRlcmZhY2UgVmlydHVhbFR5cGVTY3JpcHRFbnZpcm9ubWVudCB7XG4gIHN5czogU3lzdGVtXG4gIGxhbmd1YWdlU2VydmljZTogaW1wb3J0KFwidHlwZXNjcmlwdFwiKS5MYW5ndWFnZVNlcnZpY2VcbiAgZ2V0U291cmNlRmlsZTogKGZpbGVOYW1lOiBzdHJpbmcpID0+IGltcG9ydChcInR5cGVzY3JpcHRcIikuU291cmNlRmlsZSB8IHVuZGVmaW5lZFxuICBjcmVhdGVGaWxlOiAoZmlsZU5hbWU6IHN0cmluZywgY29udGVudDogc3RyaW5nKSA9PiB2b2lkXG4gIHVwZGF0ZUZpbGU6IChmaWxlTmFtZTogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcsIHJlcGxhY2VUZXh0U3Bhbj86IGltcG9ydChcInR5cGVzY3JpcHRcIikuVGV4dFNwYW4pID0+IHZvaWRcbn1cblxuLyoqXG4gKiBNYWtlcyBhIHZpcnR1YWwgY29weSBvZiB0aGUgVHlwZVNjcmlwdCBlbnZpcm9ubWVudC4gVGhpcyBpcyB0aGUgbWFpbiBBUEkgeW91IHdhbnQgdG8gYmUgdXNpbmcgd2l0aFxuICogQHR5cGVzY3JpcHQvdmZzLiBBIGxvdCBvZiB0aGUgb3RoZXIgZXhwb3NlZCBmdW5jdGlvbnMgYXJlIHVzZWQgYnkgdGhpcyBmdW5jdGlvbiB0byBnZXQgc2V0IHVwLlxuICpcbiAqIEBwYXJhbSBzeXMgYW4gb2JqZWN0IHdoaWNoIGNvbmZvcm1zIHRvIHRoZSBUUyBTeXMgKGEgc2hpbSBvdmVyIHJlYWQvd3JpdGUgYWNjZXNzIHRvIHRoZSBmcylcbiAqIEBwYXJhbSByb290RmlsZXMgYSBsaXN0IG9mIGZpbGVzIHdoaWNoIGFyZSBjb25zaWRlcmVkIGluc2lkZSB0aGUgcHJvamVjdFxuICogQHBhcmFtIHRzIGEgY29weSBwZiB0aGUgVHlwZVNjcmlwdCBtb2R1bGVcbiAqIEBwYXJhbSBjb21waWxlck9wdGlvbnMgdGhlIG9wdGlvbnMgZm9yIHRoaXMgY29tcGlsZXIgcnVuXG4gKiBAcGFyYW0gY3VzdG9tVHJhbnNmb3JtZXJzIGN1c3RvbSB0cmFuc2Zvcm1lcnMgZm9yIHRoaXMgY29tcGlsZXIgcnVuXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVZpcnR1YWxUeXBlU2NyaXB0RW52aXJvbm1lbnQoXG4gIHN5czogU3lzdGVtLFxuICByb290RmlsZXM6IHN0cmluZ1tdLFxuICB0czogVFMsXG4gIGNvbXBpbGVyT3B0aW9uczogQ29tcGlsZXJPcHRpb25zID0ge30sXG4gIGN1c3RvbVRyYW5zZm9ybWVycz86IEN1c3RvbVRyYW5zZm9ybWVyc1xuKTogVmlydHVhbFR5cGVTY3JpcHRFbnZpcm9ubWVudCB7XG4gIGNvbnN0IG1lcmdlZENvbXBpbGVyT3B0cyA9IHsgLi4uZGVmYXVsdENvbXBpbGVyT3B0aW9ucyh0cyksIC4uLmNvbXBpbGVyT3B0aW9ucyB9XG5cbiAgY29uc3QgeyBsYW5ndWFnZVNlcnZpY2VIb3N0LCB1cGRhdGVGaWxlIH0gPSBjcmVhdGVWaXJ0dWFsTGFuZ3VhZ2VTZXJ2aWNlSG9zdChcbiAgICBzeXMsXG4gICAgcm9vdEZpbGVzLFxuICAgIG1lcmdlZENvbXBpbGVyT3B0cyxcbiAgICB0cyxcbiAgICBjdXN0b21UcmFuc2Zvcm1lcnNcbiAgKVxuICBjb25zdCBsYW5ndWFnZVNlcnZpY2UgPSB0cy5jcmVhdGVMYW5ndWFnZVNlcnZpY2UobGFuZ3VhZ2VTZXJ2aWNlSG9zdClcbiAgY29uc3QgZGlhZ25vc3RpY3MgPSBsYW5ndWFnZVNlcnZpY2UuZ2V0Q29tcGlsZXJPcHRpb25zRGlhZ25vc3RpY3MoKVxuXG4gIGlmIChkaWFnbm9zdGljcy5sZW5ndGgpIHtcbiAgICBjb25zdCBjb21waWxlckhvc3QgPSBjcmVhdGVWaXJ0dWFsQ29tcGlsZXJIb3N0KHN5cywgY29tcGlsZXJPcHRpb25zLCB0cylcbiAgICB0aHJvdyBuZXcgRXJyb3IodHMuZm9ybWF0RGlhZ25vc3RpY3MoZGlhZ25vc3RpY3MsIGNvbXBpbGVySG9zdC5jb21waWxlckhvc3QpKVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzeXMsXG4gICAgbGFuZ3VhZ2VTZXJ2aWNlLFxuICAgIGdldFNvdXJjZUZpbGU6IGZpbGVOYW1lID0+IGxhbmd1YWdlU2VydmljZS5nZXRQcm9ncmFtKCk/LmdldFNvdXJjZUZpbGUoZmlsZU5hbWUpLFxuXG4gICAgY3JlYXRlRmlsZTogKGZpbGVOYW1lLCBjb250ZW50KSA9PiB7XG4gICAgICB1cGRhdGVGaWxlKHRzLmNyZWF0ZVNvdXJjZUZpbGUoZmlsZU5hbWUsIGNvbnRlbnQsIG1lcmdlZENvbXBpbGVyT3B0cy50YXJnZXQhLCBmYWxzZSkpXG4gICAgfSxcbiAgICB1cGRhdGVGaWxlOiAoZmlsZU5hbWUsIGNvbnRlbnQsIG9wdFByZXZUZXh0U3BhbikgPT4ge1xuICAgICAgY29uc3QgcHJldlNvdXJjZUZpbGUgPSBsYW5ndWFnZVNlcnZpY2UuZ2V0UHJvZ3JhbSgpIS5nZXRTb3VyY2VGaWxlKGZpbGVOYW1lKVxuICAgICAgaWYgKCFwcmV2U291cmNlRmlsZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJEaWQgbm90IGZpbmQgYSBzb3VyY2UgZmlsZSBmb3IgXCIgKyBmaWxlTmFtZSlcbiAgICAgIH1cbiAgICAgIGNvbnN0IHByZXZGdWxsQ29udGVudHMgPSBwcmV2U291cmNlRmlsZS50ZXh0XG5cbiAgICAgIC8vIFRPRE86IFZhbGlkYXRlIGlmIHRoZSBkZWZhdWx0IHRleHQgc3BhbiBoYXMgYSBmZW5jZXBvc3QgZXJyb3I/XG4gICAgICBjb25zdCBwcmV2VGV4dFNwYW4gPSBvcHRQcmV2VGV4dFNwYW4gPz8gdHMuY3JlYXRlVGV4dFNwYW4oMCwgcHJldkZ1bGxDb250ZW50cy5sZW5ndGgpXG4gICAgICBjb25zdCBuZXdUZXh0ID1cbiAgICAgICAgcHJldkZ1bGxDb250ZW50cy5zbGljZSgwLCBwcmV2VGV4dFNwYW4uc3RhcnQpICtcbiAgICAgICAgY29udGVudCArXG4gICAgICAgIHByZXZGdWxsQ29udGVudHMuc2xpY2UocHJldlRleHRTcGFuLnN0YXJ0ICsgcHJldlRleHRTcGFuLmxlbmd0aClcbiAgICAgIGNvbnN0IG5ld1NvdXJjZUZpbGUgPSB0cy51cGRhdGVTb3VyY2VGaWxlKHByZXZTb3VyY2VGaWxlLCBuZXdUZXh0LCB7XG4gICAgICAgIHNwYW46IHByZXZUZXh0U3BhbixcbiAgICAgICAgbmV3TGVuZ3RoOiBjb250ZW50Lmxlbmd0aCxcbiAgICAgIH0pXG5cbiAgICAgIHVwZGF0ZUZpbGUobmV3U291cmNlRmlsZSlcbiAgICB9LFxuICB9XG59XG5cbi8qKlxuICogR3JhYiB0aGUgbGlzdCBvZiBsaWIgZmlsZXMgZm9yIGEgcGFydGljdWxhciB0YXJnZXQsIHdpbGwgcmV0dXJuIGEgYml0IG1vcmUgdGhhbiBuZWNlc3NhcnkgKGJ5IGluY2x1ZGluZ1xuICogdGhlIGRvbSkgYnV0IHRoYXQncyBPS1xuICpcbiAqIEBwYXJhbSB0YXJnZXQgVGhlIGNvbXBpbGVyIHNldHRpbmdzIHRhcmdldCBiYXNlbGluZVxuICogQHBhcmFtIHRzIEEgY29weSBvZiB0aGUgVHlwZVNjcmlwdCBtb2R1bGVcbiAqL1xuZXhwb3J0IGNvbnN0IGtub3duTGliRmlsZXNGb3JDb21waWxlck9wdGlvbnMgPSAoY29tcGlsZXJPcHRpb25zOiBDb21waWxlck9wdGlvbnMsIHRzOiBUUykgPT4ge1xuICBjb25zdCB0YXJnZXQgPSBjb21waWxlck9wdGlvbnMudGFyZ2V0IHx8IHRzLlNjcmlwdFRhcmdldC5FUzVcbiAgY29uc3QgbGliID0gY29tcGlsZXJPcHRpb25zLmxpYiB8fCBbXVxuXG4gIGNvbnN0IGZpbGVzID0gW1xuICAgIFwibGliLmQudHNcIixcbiAgICBcImxpYi5kb20uZC50c1wiLFxuICAgIFwibGliLmRvbS5pdGVyYWJsZS5kLnRzXCIsXG4gICAgXCJsaWIud2Vid29ya2VyLmQudHNcIixcbiAgICBcImxpYi53ZWJ3b3JrZXIuaW1wb3J0c2NyaXB0cy5kLnRzXCIsXG4gICAgXCJsaWIuc2NyaXB0aG9zdC5kLnRzXCIsXG4gICAgXCJsaWIuZXM1LmQudHNcIixcbiAgICBcImxpYi5lczYuZC50c1wiLFxuICAgIFwibGliLmVzMjAxNS5jb2xsZWN0aW9uLmQudHNcIixcbiAgICBcImxpYi5lczIwMTUuY29yZS5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDE1LmQudHNcIixcbiAgICBcImxpYi5lczIwMTUuZ2VuZXJhdG9yLmQudHNcIixcbiAgICBcImxpYi5lczIwMTUuaXRlcmFibGUuZC50c1wiLFxuICAgIFwibGliLmVzMjAxNS5wcm9taXNlLmQudHNcIixcbiAgICBcImxpYi5lczIwMTUucHJveHkuZC50c1wiLFxuICAgIFwibGliLmVzMjAxNS5yZWZsZWN0LmQudHNcIixcbiAgICBcImxpYi5lczIwMTUuc3ltYm9sLmQudHNcIixcbiAgICBcImxpYi5lczIwMTUuc3ltYm9sLndlbGxrbm93bi5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDE2LmFycmF5LmluY2x1ZGUuZC50c1wiLFxuICAgIFwibGliLmVzMjAxNi5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDE2LmZ1bGwuZC50c1wiLFxuICAgIFwibGliLmVzMjAxNy5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDE3LmZ1bGwuZC50c1wiLFxuICAgIFwibGliLmVzMjAxNy5pbnRsLmQudHNcIixcbiAgICBcImxpYi5lczIwMTcub2JqZWN0LmQudHNcIixcbiAgICBcImxpYi5lczIwMTcuc2hhcmVkbWVtb3J5LmQudHNcIixcbiAgICBcImxpYi5lczIwMTcuc3RyaW5nLmQudHNcIixcbiAgICBcImxpYi5lczIwMTcudHlwZWRhcnJheXMuZC50c1wiLFxuICAgIFwibGliLmVzMjAxOC5hc3luY2dlbmVyYXRvci5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDE4LmFzeW5jaXRlcmFibGUuZC50c1wiLFxuICAgIFwibGliLmVzMjAxOC5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDE4LmZ1bGwuZC50c1wiLFxuICAgIFwibGliLmVzMjAxOC5pbnRsLmQudHNcIixcbiAgICBcImxpYi5lczIwMTgucHJvbWlzZS5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDE4LnJlZ2V4cC5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDE5LmFycmF5LmQudHNcIixcbiAgICBcImxpYi5lczIwMTkuZC50c1wiLFxuICAgIFwibGliLmVzMjAxOS5mdWxsLmQudHNcIixcbiAgICBcImxpYi5lczIwMTkub2JqZWN0LmQudHNcIixcbiAgICBcImxpYi5lczIwMTkuc3RyaW5nLmQudHNcIixcbiAgICBcImxpYi5lczIwMTkuc3ltYm9sLmQudHNcIixcbiAgICBcImxpYi5lczIwMjAuZC50c1wiLFxuICAgIFwibGliLmVzMjAyMC5mdWxsLmQudHNcIixcbiAgICBcImxpYi5lczIwMjAuc3RyaW5nLmQudHNcIixcbiAgICBcImxpYi5lczIwMjAuc3ltYm9sLndlbGxrbm93bi5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDIwLmJpZ2ludC5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDIwLnByb21pc2UuZC50c1wiLFxuICAgIFwibGliLmVzMjAyMC5zaGFyZWRtZW1vcnkuZC50c1wiLFxuICAgIFwibGliLmVzMjAyMC5pbnRsLmQudHNcIixcbiAgICBcImxpYi5lc25leHQuYXJyYXkuZC50c1wiLFxuICAgIFwibGliLmVzbmV4dC5hc3luY2l0ZXJhYmxlLmQudHNcIixcbiAgICBcImxpYi5lc25leHQuYmlnaW50LmQudHNcIixcbiAgICBcImxpYi5lc25leHQuZC50c1wiLFxuICAgIFwibGliLmVzbmV4dC5mdWxsLmQudHNcIixcbiAgICBcImxpYi5lc25leHQuaW50bC5kLnRzXCIsXG4gICAgXCJsaWIuZXNuZXh0LnN5bWJvbC5kLnRzXCIsXG4gIF1cblxuICBjb25zdCB0YXJnZXRUb0N1dCA9IHRzLlNjcmlwdFRhcmdldFt0YXJnZXRdXG4gIGNvbnN0IG1hdGNoZXMgPSBmaWxlcy5maWx0ZXIoZiA9PiBmLnN0YXJ0c1dpdGgoYGxpYi4ke3RhcmdldFRvQ3V0LnRvTG93ZXJDYXNlKCl9YCkpXG4gIGNvbnN0IHRhcmdldEN1dEluZGV4ID0gZmlsZXMuaW5kZXhPZihtYXRjaGVzLnBvcCgpISlcblxuICBjb25zdCBnZXRNYXggPSAoYXJyYXk6IG51bWJlcltdKSA9PlxuICAgIGFycmF5ICYmIGFycmF5Lmxlbmd0aCA/IGFycmF5LnJlZHVjZSgobWF4LCBjdXJyZW50KSA9PiAoY3VycmVudCA+IG1heCA/IGN1cnJlbnQgOiBtYXgpKSA6IHVuZGVmaW5lZFxuXG4gIC8vIEZpbmQgdGhlIGluZGV4IGZvciBldmVyeXRoaW5nIGluXG4gIGNvbnN0IGluZGV4ZXNGb3JDdXR0aW5nID0gbGliLm1hcChsaWIgPT4ge1xuICAgIGNvbnN0IG1hdGNoZXMgPSBmaWxlcy5maWx0ZXIoZiA9PiBmLnN0YXJ0c1dpdGgoYGxpYi4ke2xpYi50b0xvd2VyQ2FzZSgpfWApKVxuICAgIGlmIChtYXRjaGVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDBcblxuICAgIGNvbnN0IGN1dEluZGV4ID0gZmlsZXMuaW5kZXhPZihtYXRjaGVzLnBvcCgpISlcbiAgICByZXR1cm4gY3V0SW5kZXhcbiAgfSlcblxuICBjb25zdCBsaWJDdXRJbmRleCA9IGdldE1heChpbmRleGVzRm9yQ3V0dGluZykgfHwgMFxuXG4gIGNvbnN0IGZpbmFsQ3V0SW5kZXggPSBNYXRoLm1heCh0YXJnZXRDdXRJbmRleCwgbGliQ3V0SW5kZXgpXG4gIHJldHVybiBmaWxlcy5zbGljZSgwLCBmaW5hbEN1dEluZGV4ICsgMSlcbn1cblxuLyoqXG4gKiBTZXRzIHVwIGEgTWFwIHdpdGggbGliIGNvbnRlbnRzIGJ5IGdyYWJiaW5nIHRoZSBuZWNlc3NhcnkgZmlsZXMgZnJvbVxuICogdGhlIGxvY2FsIGNvcHkgb2YgdHlwZXNjcmlwdCB2aWEgdGhlIGZpbGUgc3lzdGVtLlxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlRGVmYXVsdE1hcEZyb21Ob2RlTW9kdWxlcyA9IChjb21waWxlck9wdGlvbnM6IENvbXBpbGVyT3B0aW9ucywgdHM/OiB0eXBlb2YgaW1wb3J0KFwidHlwZXNjcmlwdFwiKSkgPT4ge1xuICBjb25zdCB0c01vZHVsZSA9IHRzIHx8IHJlcXVpcmUoXCJ0eXBlc2NyaXB0XCIpXG4gIGNvbnN0IHBhdGggPSByZXF1aXJlKFwicGF0aFwiKVxuICBjb25zdCBmcyA9IHJlcXVpcmUoXCJmc1wiKVxuXG4gIGNvbnN0IGdldExpYiA9IChuYW1lOiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBsaWIgPSBwYXRoLmRpcm5hbWUocmVxdWlyZS5yZXNvbHZlKFwidHlwZXNjcmlwdFwiKSlcbiAgICByZXR1cm4gZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbihsaWIsIG5hbWUpLCBcInV0ZjhcIilcbiAgfVxuXG4gIGNvbnN0IGxpYnMgPSBrbm93bkxpYkZpbGVzRm9yQ29tcGlsZXJPcHRpb25zKGNvbXBpbGVyT3B0aW9ucywgdHNNb2R1bGUpXG4gIGNvbnN0IGZzTWFwID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKVxuICBsaWJzLmZvckVhY2gobGliID0+IHtcbiAgICBmc01hcC5zZXQoXCIvXCIgKyBsaWIsIGdldExpYihsaWIpKVxuICB9KVxuICByZXR1cm4gZnNNYXBcbn1cblxuLyoqXG4gKiBBZGRzIHJlY3Vyc2l2ZWx5IGZpbGVzIGZyb20gdGhlIEZTIGludG8gdGhlIG1hcCBiYXNlZCBvbiB0aGUgZm9sZGVyXG4gKi9cbmV4cG9ydCBjb25zdCBhZGRBbGxGaWxlc0Zyb21Gb2xkZXIgPSAobWFwOiBNYXA8c3RyaW5nLCBzdHJpbmc+LCB3b3JraW5nRGlyOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgY29uc3QgcGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpXG4gIGNvbnN0IGZzID0gcmVxdWlyZShcImZzXCIpXG5cbiAgY29uc3Qgd2FsayA9IGZ1bmN0aW9uIChkaXI6IHN0cmluZykge1xuICAgIGxldCByZXN1bHRzOiBzdHJpbmdbXSA9IFtdXG4gICAgY29uc3QgbGlzdCA9IGZzLnJlYWRkaXJTeW5jKGRpcilcbiAgICBsaXN0LmZvckVhY2goZnVuY3Rpb24gKGZpbGU6IHN0cmluZykge1xuICAgICAgZmlsZSA9IHBhdGguam9pbihkaXIsIGZpbGUpXG4gICAgICBjb25zdCBzdGF0ID0gZnMuc3RhdFN5bmMoZmlsZSlcbiAgICAgIGlmIChzdGF0ICYmIHN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAvKiBSZWN1cnNlIGludG8gYSBzdWJkaXJlY3RvcnkgKi9cbiAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuY29uY2F0KHdhbGsoZmlsZSkpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvKiBJcyBhIGZpbGUgKi9cbiAgICAgICAgcmVzdWx0cy5wdXNoKGZpbGUpXG4gICAgICB9XG4gICAgfSlcbiAgICByZXR1cm4gcmVzdWx0c1xuICB9XG5cbiAgY29uc3QgYWxsRmlsZXMgPSB3YWxrKHdvcmtpbmdEaXIpXG5cbiAgYWxsRmlsZXMuZm9yRWFjaChsaWIgPT4ge1xuICAgIGNvbnN0IGZzUGF0aCA9IFwiL25vZGVfbW9kdWxlcy9AdHlwZXNcIiArIGxpYi5yZXBsYWNlKHdvcmtpbmdEaXIsIFwiXCIpXG4gICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhsaWIsIFwidXRmOFwiKVxuICAgIGNvbnN0IHZhbGlkRXh0ZW5zaW9ucyA9IFtcIi50c1wiLCBcIi50c3hcIl1cblxuICAgIGlmICh2YWxpZEV4dGVuc2lvbnMuaW5jbHVkZXMocGF0aC5leHRuYW1lKGZzUGF0aCkpKSB7XG4gICAgICBtYXAuc2V0KGZzUGF0aCwgY29udGVudClcbiAgICB9XG4gIH0pXG59XG5cbi8qKiBBZGRzIGFsbCBmaWxlcyBmcm9tIG5vZGVfbW9kdWxlcy9AdHlwZXMgaW50byB0aGUgRlMgTWFwICovXG5leHBvcnQgY29uc3QgYWRkRmlsZXNGb3JUeXBlc0ludG9Gb2xkZXIgPSAobWFwOiBNYXA8c3RyaW5nLCBzdHJpbmc+KSA9PlxuICBhZGRBbGxGaWxlc0Zyb21Gb2xkZXIobWFwLCBcIm5vZGVfbW9kdWxlcy9AdHlwZXNcIilcblxuLyoqXG4gKiBDcmVhdGUgYSB2aXJ0dWFsIEZTIE1hcCB3aXRoIHRoZSBsaWIgZmlsZXMgZnJvbSBhIHBhcnRpY3VsYXIgVHlwZVNjcmlwdFxuICogdmVyc2lvbiBiYXNlZCBvbiB0aGUgdGFyZ2V0LCBBbHdheXMgaW5jbHVkZXMgZG9tIEFUTS5cbiAqXG4gKiBAcGFyYW0gb3B0aW9ucyBUaGUgY29tcGlsZXIgdGFyZ2V0LCB3aGljaCBkaWN0YXRlcyB0aGUgbGlicyB0byBzZXQgdXBcbiAqIEBwYXJhbSB2ZXJzaW9uIHRoZSB2ZXJzaW9ucyBvZiBUeXBlU2NyaXB0IHdoaWNoIGFyZSBzdXBwb3J0ZWRcbiAqIEBwYXJhbSBjYWNoZSBzaG91bGQgdGhlIHZhbHVlcyBiZSBzdG9yZWQgaW4gbG9jYWwgc3RvcmFnZVxuICogQHBhcmFtIHRzIGEgY29weSBvZiB0aGUgdHlwZXNjcmlwdCBpbXBvcnRcbiAqIEBwYXJhbSBsenN0cmluZyBhbiBvcHRpb25hbCBjb3B5IG9mIHRoZSBsei1zdHJpbmcgaW1wb3J0XG4gKiBAcGFyYW0gZmV0Y2hlciBhbiBvcHRpb25hbCByZXBsYWNlbWVudCBmb3IgdGhlIGdsb2JhbCBmZXRjaCBmdW5jdGlvbiAodGVzdHMgbWFpbmx5KVxuICogQHBhcmFtIHN0b3JlciBhbiBvcHRpb25hbCByZXBsYWNlbWVudCBmb3IgdGhlIGxvY2FsU3RvcmFnZSBnbG9iYWwgKHRlc3RzIG1haW5seSlcbiAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZURlZmF1bHRNYXBGcm9tQ0ROID0gKFxuICBvcHRpb25zOiBDb21waWxlck9wdGlvbnMsXG4gIHZlcnNpb246IHN0cmluZyxcbiAgY2FjaGU6IGJvb2xlYW4sXG4gIHRzOiBUUyxcbiAgbHpzdHJpbmc/OiB0eXBlb2YgaW1wb3J0KFwibHotc3RyaW5nXCIpLFxuICBmZXRjaGVyPzogdHlwZW9mIGZldGNoLFxuICBzdG9yZXI/OiB0eXBlb2YgbG9jYWxTdG9yYWdlXG4pID0+IHtcbiAgY29uc3QgZmV0Y2hsaWtlID0gZmV0Y2hlciB8fCBmZXRjaFxuICBjb25zdCBzdG9yZWxpa2UgPSBzdG9yZXIgfHwgbG9jYWxTdG9yYWdlXG4gIGNvbnN0IGZzTWFwID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKVxuICBjb25zdCBmaWxlcyA9IGtub3duTGliRmlsZXNGb3JDb21waWxlck9wdGlvbnMob3B0aW9ucywgdHMpXG4gIGNvbnN0IHByZWZpeCA9IGBodHRwczovL3R5cGVzY3JpcHQuYXp1cmVlZGdlLm5ldC9jZG4vJHt2ZXJzaW9ufS90eXBlc2NyaXB0L2xpYi9gXG5cbiAgZnVuY3Rpb24gemlwKHN0cjogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGx6c3RyaW5nID8gbHpzdHJpbmcuY29tcHJlc3NUb1VURjE2KHN0cikgOiBzdHJcbiAgfVxuXG4gIGZ1bmN0aW9uIHVuemlwKHN0cjogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGx6c3RyaW5nID8gbHpzdHJpbmcuZGVjb21wcmVzc0Zyb21VVEYxNihzdHIpIDogc3RyXG4gIH1cblxuICAvLyBNYXAgdGhlIGtub3duIGxpYnMgdG8gYSBub2RlIGZldGNoIHByb21pc2UsIHRoZW4gcmV0dXJuIHRoZSBjb250ZW50c1xuICBmdW5jdGlvbiB1bmNhY2hlZCgpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoZmlsZXMubWFwKGxpYiA9PiBmZXRjaGxpa2UocHJlZml4ICsgbGliKS50aGVuKHJlc3AgPT4gcmVzcC50ZXh0KCkpKSkudGhlbihjb250ZW50cyA9PiB7XG4gICAgICBjb250ZW50cy5mb3JFYWNoKCh0ZXh0LCBpbmRleCkgPT4gZnNNYXAuc2V0KFwiL1wiICsgZmlsZXNbaW5kZXhdLCB0ZXh0KSlcbiAgICB9KVxuICB9XG5cbiAgLy8gQSBsb2NhbHN0b3JhZ2UgYW5kIGx6emlwIGF3YXJlIHZlcnNpb24gb2YgdGhlIGxpYiBmaWxlc1xuICBmdW5jdGlvbiBjYWNoZWQoKSB7XG4gICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGxvY2FsU3RvcmFnZSlcbiAgICBrZXlzLmZvckVhY2goa2V5ID0+IHtcbiAgICAgIC8vIFJlbW92ZSBhbnl0aGluZyB3aGljaCBpc24ndCBmcm9tIHRoaXMgdmVyc2lvblxuICAgICAgaWYgKGtleS5zdGFydHNXaXRoKFwidHMtbGliLVwiKSAmJiAha2V5LnN0YXJ0c1dpdGgoXCJ0cy1saWItXCIgKyB2ZXJzaW9uKSkge1xuICAgICAgICBzdG9yZWxpa2UucmVtb3ZlSXRlbShrZXkpXG4gICAgICB9XG4gICAgfSlcblxuICAgIHJldHVybiBQcm9taXNlLmFsbChcbiAgICAgIGZpbGVzLm1hcChsaWIgPT4ge1xuICAgICAgICBjb25zdCBjYWNoZUtleSA9IGB0cy1saWItJHt2ZXJzaW9ufS0ke2xpYn1gXG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSBzdG9yZWxpa2UuZ2V0SXRlbShjYWNoZUtleSlcblxuICAgICAgICBpZiAoIWNvbnRlbnQpIHtcbiAgICAgICAgICAvLyBNYWtlIHRoZSBBUEkgY2FsbCBhbmQgc3RvcmUgdGhlIHRleHQgY29uY2VudCBpbiB0aGUgY2FjaGVcbiAgICAgICAgICByZXR1cm4gZmV0Y2hsaWtlKHByZWZpeCArIGxpYilcbiAgICAgICAgICAgIC50aGVuKHJlc3AgPT4gcmVzcC50ZXh0KCkpXG4gICAgICAgICAgICAudGhlbih0ID0+IHtcbiAgICAgICAgICAgICAgc3RvcmVsaWtlLnNldEl0ZW0oY2FjaGVLZXksIHppcCh0KSlcbiAgICAgICAgICAgICAgcmV0dXJuIHRcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bnppcChjb250ZW50KSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICApLnRoZW4oY29udGVudHMgPT4ge1xuICAgICAgY29udGVudHMuZm9yRWFjaCgodGV4dCwgaW5kZXgpID0+IHtcbiAgICAgICAgY29uc3QgbmFtZSA9IFwiL1wiICsgZmlsZXNbaW5kZXhdXG4gICAgICAgIGZzTWFwLnNldChuYW1lLCB0ZXh0KVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgY29uc3QgZnVuYyA9IGNhY2hlID8gY2FjaGVkIDogdW5jYWNoZWRcbiAgcmV0dXJuIGZ1bmMoKS50aGVuKCgpID0+IGZzTWFwKVxufVxuXG5mdW5jdGlvbiBub3RJbXBsZW1lbnRlZChtZXRob2ROYW1lOiBzdHJpbmcpOiBhbnkge1xuICB0aHJvdyBuZXcgRXJyb3IoYE1ldGhvZCAnJHttZXRob2ROYW1lfScgaXMgbm90IGltcGxlbWVudGVkLmApXG59XG5cbmZ1bmN0aW9uIGF1ZGl0PEFyZ3NUIGV4dGVuZHMgYW55W10sIFJldHVyblQ+KFxuICBuYW1lOiBzdHJpbmcsXG4gIGZuOiAoLi4uYXJnczogQXJnc1QpID0+IFJldHVyblRcbik6ICguLi5hcmdzOiBBcmdzVCkgPT4gUmV0dXJuVCB7XG4gIHJldHVybiAoLi4uYXJncykgPT4ge1xuICAgIGNvbnN0IHJlcyA9IGZuKC4uLmFyZ3MpXG5cbiAgICBjb25zdCBzbWFsbHJlcyA9IHR5cGVvZiByZXMgPT09IFwic3RyaW5nXCIgPyByZXMuc2xpY2UoMCwgODApICsgXCIuLi5cIiA6IHJlc1xuICAgIGRlYnVnTG9nKFwiPiBcIiArIG5hbWUsIC4uLmFyZ3MpXG4gICAgZGVidWdMb2coXCI8IFwiICsgc21hbGxyZXMpXG5cbiAgICByZXR1cm4gcmVzXG4gIH1cbn1cblxuLyoqIFRoZSBkZWZhdWx0IGNvbXBpbGVyIG9wdGlvbnMgaWYgVHlwZVNjcmlwdCBjb3VsZCBldmVyIGNoYW5nZSB0aGUgY29tcGlsZXIgb3B0aW9ucyAqL1xuY29uc3QgZGVmYXVsdENvbXBpbGVyT3B0aW9ucyA9ICh0czogdHlwZW9mIGltcG9ydChcInR5cGVzY3JpcHRcIikpOiBDb21waWxlck9wdGlvbnMgPT4ge1xuICByZXR1cm4ge1xuICAgIC4uLnRzLmdldERlZmF1bHRDb21waWxlck9wdGlvbnMoKSxcbiAgICBqc3g6IHRzLkpzeEVtaXQuUmVhY3QsXG4gICAgc3RyaWN0OiB0cnVlLFxuICAgIGVzTW9kdWxlSW50ZXJvcDogdHJ1ZSxcbiAgICBtb2R1bGU6IHRzLk1vZHVsZUtpbmQuRVNOZXh0LFxuICAgIHN1cHByZXNzT3V0cHV0UGF0aENoZWNrOiB0cnVlLFxuICAgIHNraXBMaWJDaGVjazogdHJ1ZSxcbiAgICBza2lwRGVmYXVsdExpYkNoZWNrOiB0cnVlLFxuICAgIG1vZHVsZVJlc29sdXRpb246IHRzLk1vZHVsZVJlc29sdXRpb25LaW5kLk5vZGVKcyxcbiAgfVxufVxuXG4vLyBcIi9ET00uZC50c1wiID0+IFwiL2xpYi5kb20uZC50c1wiXG5jb25zdCBsaWJpemUgPSAocGF0aDogc3RyaW5nKSA9PiBwYXRoLnJlcGxhY2UoXCIvXCIsIFwiL2xpYi5cIikudG9Mb3dlckNhc2UoKVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gaW4tbWVtb3J5IFN5c3RlbSBvYmplY3Qgd2hpY2ggY2FuIGJlIHVzZWQgaW4gYSBUeXBlU2NyaXB0IHByb2dyYW0sIHRoaXNcbiAqIGlzIHdoYXQgcHJvdmlkZXMgcmVhZC93cml0ZSBhc3BlY3RzIG9mIHRoZSB2aXJ0dWFsIGZzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTeXN0ZW0oZmlsZXM6IE1hcDxzdHJpbmcsIHN0cmluZz4pOiBTeXN0ZW0ge1xuICByZXR1cm4ge1xuICAgIGFyZ3M6IFtdLFxuICAgIGNyZWF0ZURpcmVjdG9yeTogKCkgPT4gbm90SW1wbGVtZW50ZWQoXCJjcmVhdGVEaXJlY3RvcnlcIiksXG4gICAgLy8gVE9ETzogY291bGQgbWFrZSBhIHJlYWwgZmlsZSB0cmVlXG4gICAgZGlyZWN0b3J5RXhpc3RzOiBhdWRpdChcImRpcmVjdG9yeUV4aXN0c1wiLCBkaXJlY3RvcnkgPT4ge1xuICAgICAgcmV0dXJuIEFycmF5LmZyb20oZmlsZXMua2V5cygpKS5zb21lKHBhdGggPT4gcGF0aC5zdGFydHNXaXRoKGRpcmVjdG9yeSkpXG4gICAgfSksXG4gICAgZXhpdDogKCkgPT4gbm90SW1wbGVtZW50ZWQoXCJleGl0XCIpLFxuICAgIGZpbGVFeGlzdHM6IGF1ZGl0KFwiZmlsZUV4aXN0c1wiLCBmaWxlTmFtZSA9PiBmaWxlcy5oYXMoZmlsZU5hbWUpIHx8IGZpbGVzLmhhcyhsaWJpemUoZmlsZU5hbWUpKSksXG4gICAgZ2V0Q3VycmVudERpcmVjdG9yeTogKCkgPT4gXCIvXCIsXG4gICAgZ2V0RGlyZWN0b3JpZXM6ICgpID0+IFtdLFxuICAgIGdldEV4ZWN1dGluZ0ZpbGVQYXRoOiAoKSA9PiBub3RJbXBsZW1lbnRlZChcImdldEV4ZWN1dGluZ0ZpbGVQYXRoXCIpLFxuICAgIHJlYWREaXJlY3Rvcnk6IGF1ZGl0KFwicmVhZERpcmVjdG9yeVwiLCBkaXJlY3RvcnkgPT4gKGRpcmVjdG9yeSA9PT0gXCIvXCIgPyBBcnJheS5mcm9tKGZpbGVzLmtleXMoKSkgOiBbXSkpLFxuICAgIHJlYWRGaWxlOiBhdWRpdChcInJlYWRGaWxlXCIsIGZpbGVOYW1lID0+IGZpbGVzLmdldChmaWxlTmFtZSkgfHwgZmlsZXMuZ2V0KGxpYml6ZShmaWxlTmFtZSkpKSxcbiAgICByZXNvbHZlUGF0aDogcGF0aCA9PiBwYXRoLFxuICAgIG5ld0xpbmU6IFwiXFxuXCIsXG4gICAgdXNlQ2FzZVNlbnNpdGl2ZUZpbGVOYW1lczogdHJ1ZSxcbiAgICB3cml0ZTogKCkgPT4gbm90SW1wbGVtZW50ZWQoXCJ3cml0ZVwiKSxcbiAgICB3cml0ZUZpbGU6IChmaWxlTmFtZSwgY29udGVudHMpID0+IHtcbiAgICAgIGZpbGVzLnNldChmaWxlTmFtZSwgY29udGVudHMpXG4gICAgfSxcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBmaWxlLXN5c3RlbSBiYWNrZWQgU3lzdGVtIG9iamVjdCB3aGljaCBjYW4gYmUgdXNlZCBpbiBhIFR5cGVTY3JpcHQgcHJvZ3JhbSwgeW91IHByb3ZpZGVcbiAqIGEgc2V0IG9mIHZpcnR1YWwgZmlsZXMgd2hpY2ggYXJlIHByaW9yaXRpc2VkIG92ZXIgdGhlIEZTIHZlcnNpb25zLCB0aGVuIGEgcGF0aCB0byB0aGUgcm9vdCBvZiB5b3VyXG4gKiBwcm9qZWN0IChiYXNpY2FsbHkgdGhlIGZvbGRlciB5b3VyIG5vZGVfbW9kdWxlcyBsaXZlcylcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUZTQmFja2VkU3lzdGVtKGZpbGVzOiBNYXA8c3RyaW5nLCBzdHJpbmc+LCBfcHJvamVjdFJvb3Q6IHN0cmluZywgdHM6IFRTKTogU3lzdGVtIHtcbiAgLy8gV2UgbmVlZCB0byBtYWtlIGFuIGlzb2xhdGVkIGZvbGRlciBmb3IgdGhlIHRzY29uZmlnLCBidXQgYWxzbyBuZWVkIHRvIGJlIGFibGUgdG8gcmVzb2x2ZSB0aGVcbiAgLy8gZXhpc3Rpbmcgbm9kZV9tb2R1bGVzIHN0cnVjdHVyZXMgZ29pbmcgYmFjayB0aHJvdWdoIHRoZSBoaXN0b3J5XG4gIGNvbnN0IHJvb3QgPSBfcHJvamVjdFJvb3QgKyBcIi92ZnNcIlxuICBjb25zdCBwYXRoID0gcmVxdWlyZShcInBhdGhcIilcblxuICAvLyBUaGUgZGVmYXVsdCBTeXN0ZW0gaW4gVHlwZVNjcmlwdFxuICBjb25zdCBub2RlU3lzID0gdHMuc3lzXG4gIGNvbnN0IHRzTGliID0gcGF0aC5kaXJuYW1lKHJlcXVpcmUucmVzb2x2ZShcInR5cGVzY3JpcHRcIikpXG5cbiAgcmV0dXJuIHtcbiAgICBhcmdzOiBbXSxcbiAgICBjcmVhdGVEaXJlY3Rvcnk6ICgpID0+IG5vdEltcGxlbWVudGVkKFwiY3JlYXRlRGlyZWN0b3J5XCIpLFxuICAgIC8vIFRPRE86IGNvdWxkIG1ha2UgYSByZWFsIGZpbGUgdHJlZVxuICAgIGRpcmVjdG9yeUV4aXN0czogYXVkaXQoXCJkaXJlY3RvcnlFeGlzdHNcIiwgZGlyZWN0b3J5ID0+IHtcbiAgICAgIHJldHVybiBBcnJheS5mcm9tKGZpbGVzLmtleXMoKSkuc29tZShwYXRoID0+IHBhdGguc3RhcnRzV2l0aChkaXJlY3RvcnkpKSB8fCBub2RlU3lzLmRpcmVjdG9yeUV4aXN0cyhkaXJlY3RvcnkpXG4gICAgfSksXG4gICAgZXhpdDogbm9kZVN5cy5leGl0LFxuICAgIGZpbGVFeGlzdHM6IGF1ZGl0KFwiZmlsZUV4aXN0c1wiLCBmaWxlTmFtZSA9PiB7XG4gICAgICBpZiAoZmlsZXMuaGFzKGZpbGVOYW1lKSkgcmV0dXJuIHRydWVcbiAgICAgIC8vIERvbid0IGxldCBvdGhlciB0c2NvbmZpZ3MgZW5kIHVwIHRvdWNoaW5nIHRoZSB2ZnNcbiAgICAgIGlmIChmaWxlTmFtZS5pbmNsdWRlcyhcInRzY29uZmlnLmpzb25cIikgfHwgZmlsZU5hbWUuaW5jbHVkZXMoXCJ0c2NvbmZpZy5qc29uXCIpKSByZXR1cm4gZmFsc2VcbiAgICAgIGlmIChmaWxlTmFtZS5zdGFydHNXaXRoKFwiL2xpYlwiKSkge1xuICAgICAgICBjb25zdCB0c0xpYk5hbWUgPSBgJHt0c0xpYn0vJHtmaWxlTmFtZS5yZXBsYWNlKFwiL1wiLCBcIlwiKX1gXG4gICAgICAgIHJldHVybiBub2RlU3lzLmZpbGVFeGlzdHModHNMaWJOYW1lKVxuICAgICAgfVxuICAgICAgcmV0dXJuIG5vZGVTeXMuZmlsZUV4aXN0cyhmaWxlTmFtZSlcbiAgICB9KSxcbiAgICBnZXRDdXJyZW50RGlyZWN0b3J5OiAoKSA9PiByb290LFxuICAgIGdldERpcmVjdG9yaWVzOiBub2RlU3lzLmdldERpcmVjdG9yaWVzLFxuICAgIGdldEV4ZWN1dGluZ0ZpbGVQYXRoOiAoKSA9PiBub3RJbXBsZW1lbnRlZChcImdldEV4ZWN1dGluZ0ZpbGVQYXRoXCIpLFxuICAgIHJlYWREaXJlY3Rvcnk6IGF1ZGl0KFwicmVhZERpcmVjdG9yeVwiLCAoLi4uYXJncykgPT4ge1xuICAgICAgaWYgKGFyZ3NbMF0gPT09IFwiL1wiKSB7XG4gICAgICAgIHJldHVybiBBcnJheS5mcm9tKGZpbGVzLmtleXMoKSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBub2RlU3lzLnJlYWREaXJlY3RvcnkoLi4uYXJncylcbiAgICAgIH1cbiAgICB9KSxcbiAgICByZWFkRmlsZTogYXVkaXQoXCJyZWFkRmlsZVwiLCBmaWxlTmFtZSA9PiB7XG4gICAgICBpZiAoZmlsZXMuaGFzKGZpbGVOYW1lKSkgcmV0dXJuIGZpbGVzLmdldChmaWxlTmFtZSlcbiAgICAgIGlmIChmaWxlTmFtZS5zdGFydHNXaXRoKFwiL2xpYlwiKSkge1xuICAgICAgICBjb25zdCB0c0xpYk5hbWUgPSBgJHt0c0xpYn0vJHtmaWxlTmFtZS5yZXBsYWNlKFwiL1wiLCBcIlwiKX1gXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IG5vZGVTeXMucmVhZEZpbGUodHNMaWJOYW1lKVxuICAgICAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgICAgIGNvbnN0IGxpYnMgPSBub2RlU3lzLnJlYWREaXJlY3RvcnkodHNMaWIpXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgYFRTVkZTOiBBIHJlcXVlc3Qgd2FzIG1hZGUgZm9yICR7dHNMaWJOYW1lfSBidXQgdGhlcmUgd2Fzbid0IGEgZmlsZSBmb3VuZCBpbiB0aGUgZmlsZSBtYXAuIFlvdSBsaWtlbHkgaGF2ZSBhIG1pc21hdGNoIGluIHRoZSBjb21waWxlciBvcHRpb25zIGZvciB0aGUgQ0ROIGRvd25sb2FkIHZzIHRoZSBjb21waWxlciBwcm9ncmFtLiBFeGlzdGluZyBMaWJzOiAke2xpYnN9LmBcbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdFxuICAgICAgfVxuICAgICAgcmV0dXJuIG5vZGVTeXMucmVhZEZpbGUoZmlsZU5hbWUpXG4gICAgfSksXG4gICAgcmVzb2x2ZVBhdGg6IHBhdGggPT4ge1xuICAgICAgaWYgKGZpbGVzLmhhcyhwYXRoKSkgcmV0dXJuIHBhdGhcbiAgICAgIHJldHVybiBub2RlU3lzLnJlc29sdmVQYXRoKHBhdGgpXG4gICAgfSxcbiAgICBuZXdMaW5lOiBcIlxcblwiLFxuICAgIHVzZUNhc2VTZW5zaXRpdmVGaWxlTmFtZXM6IHRydWUsXG4gICAgd3JpdGU6ICgpID0+IG5vdEltcGxlbWVudGVkKFwid3JpdGVcIiksXG4gICAgd3JpdGVGaWxlOiAoZmlsZU5hbWUsIGNvbnRlbnRzKSA9PiB7XG4gICAgICBmaWxlcy5zZXQoZmlsZU5hbWUsIGNvbnRlbnRzKVxuICAgIH0sXG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIGluLW1lbW9yeSBDb21waWxlckhvc3QgLXdoaWNoIGlzIGVzc2VudGlhbGx5IGFuIGV4dHJhIHdyYXBwZXIgdG8gU3lzdGVtXG4gKiB3aGljaCB3b3JrcyB3aXRoIFR5cGVTY3JpcHQgb2JqZWN0cyAtIHJldHVybnMgYm90aCBhIGNvbXBpbGVyIGhvc3QsIGFuZCBhIHdheSB0byBhZGQgbmV3IFNvdXJjZUZpbGVcbiAqIGluc3RhbmNlcyB0byB0aGUgaW4tbWVtb3J5IGZpbGUgc3lzdGVtLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVmlydHVhbENvbXBpbGVySG9zdChzeXM6IFN5c3RlbSwgY29tcGlsZXJPcHRpb25zOiBDb21waWxlck9wdGlvbnMsIHRzOiBUUykge1xuICBjb25zdCBzb3VyY2VGaWxlcyA9IG5ldyBNYXA8c3RyaW5nLCBTb3VyY2VGaWxlPigpXG4gIGNvbnN0IHNhdmUgPSAoc291cmNlRmlsZTogU291cmNlRmlsZSkgPT4ge1xuICAgIHNvdXJjZUZpbGVzLnNldChzb3VyY2VGaWxlLmZpbGVOYW1lLCBzb3VyY2VGaWxlKVxuICAgIHJldHVybiBzb3VyY2VGaWxlXG4gIH1cblxuICB0eXBlIFJldHVybiA9IHtcbiAgICBjb21waWxlckhvc3Q6IENvbXBpbGVySG9zdFxuICAgIHVwZGF0ZUZpbGU6IChzb3VyY2VGaWxlOiBTb3VyY2VGaWxlKSA9PiBib29sZWFuXG4gIH1cblxuICBjb25zdCB2SG9zdDogUmV0dXJuID0ge1xuICAgIGNvbXBpbGVySG9zdDoge1xuICAgICAgLi4uc3lzLFxuICAgICAgZ2V0Q2Fub25pY2FsRmlsZU5hbWU6IGZpbGVOYW1lID0+IGZpbGVOYW1lLFxuICAgICAgZ2V0RGVmYXVsdExpYkZpbGVOYW1lOiAoKSA9PiBcIi9cIiArIHRzLmdldERlZmF1bHRMaWJGaWxlTmFtZShjb21waWxlck9wdGlvbnMpLCAvLyAnL2xpYi5kLnRzJyxcbiAgICAgIC8vIGdldERlZmF1bHRMaWJMb2NhdGlvbjogKCkgPT4gJy8nLFxuICAgICAgZ2V0RGlyZWN0b3JpZXM6ICgpID0+IFtdLFxuICAgICAgZ2V0TmV3TGluZTogKCkgPT4gc3lzLm5ld0xpbmUsXG4gICAgICBnZXRTb3VyY2VGaWxlOiBmaWxlTmFtZSA9PiB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgc291cmNlRmlsZXMuZ2V0KGZpbGVOYW1lKSB8fFxuICAgICAgICAgIHNhdmUoXG4gICAgICAgICAgICB0cy5jcmVhdGVTb3VyY2VGaWxlKFxuICAgICAgICAgICAgICBmaWxlTmFtZSxcbiAgICAgICAgICAgICAgc3lzLnJlYWRGaWxlKGZpbGVOYW1lKSEsXG4gICAgICAgICAgICAgIGNvbXBpbGVyT3B0aW9ucy50YXJnZXQgfHwgZGVmYXVsdENvbXBpbGVyT3B0aW9ucyh0cykudGFyZ2V0ISxcbiAgICAgICAgICAgICAgZmFsc2VcbiAgICAgICAgICAgIClcbiAgICAgICAgICApXG4gICAgICAgIClcbiAgICAgIH0sXG4gICAgICB1c2VDYXNlU2Vuc2l0aXZlRmlsZU5hbWVzOiAoKSA9PiBzeXMudXNlQ2FzZVNlbnNpdGl2ZUZpbGVOYW1lcyxcbiAgICB9LFxuICAgIHVwZGF0ZUZpbGU6IHNvdXJjZUZpbGUgPT4ge1xuICAgICAgY29uc3QgYWxyZWFkeUV4aXN0cyA9IHNvdXJjZUZpbGVzLmhhcyhzb3VyY2VGaWxlLmZpbGVOYW1lKVxuICAgICAgc3lzLndyaXRlRmlsZShzb3VyY2VGaWxlLmZpbGVOYW1lLCBzb3VyY2VGaWxlLnRleHQpXG4gICAgICBzb3VyY2VGaWxlcy5zZXQoc291cmNlRmlsZS5maWxlTmFtZSwgc291cmNlRmlsZSlcbiAgICAgIHJldHVybiBhbHJlYWR5RXhpc3RzXG4gICAgfSxcbiAgfVxuICByZXR1cm4gdkhvc3Rcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIG9iamVjdCB3aGljaCBjYW4gaG9zdCBhIGxhbmd1YWdlIHNlcnZpY2UgYWdhaW5zdCB0aGUgdmlydHVhbCBmaWxlLXN5c3RlbVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVmlydHVhbExhbmd1YWdlU2VydmljZUhvc3QoXG4gIHN5czogU3lzdGVtLFxuICByb290RmlsZXM6IHN0cmluZ1tdLFxuICBjb21waWxlck9wdGlvbnM6IENvbXBpbGVyT3B0aW9ucyxcbiAgdHM6IFRTLFxuICBjdXN0b21UcmFuc2Zvcm1lcnM/OiBDdXN0b21UcmFuc2Zvcm1lcnNcbikge1xuICBjb25zdCBmaWxlTmFtZXMgPSBbLi4ucm9vdEZpbGVzXVxuICBjb25zdCB7IGNvbXBpbGVySG9zdCwgdXBkYXRlRmlsZSB9ID0gY3JlYXRlVmlydHVhbENvbXBpbGVySG9zdChzeXMsIGNvbXBpbGVyT3B0aW9ucywgdHMpXG4gIGNvbnN0IGZpbGVWZXJzaW9ucyA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KClcbiAgbGV0IHByb2plY3RWZXJzaW9uID0gMFxuICBjb25zdCBsYW5ndWFnZVNlcnZpY2VIb3N0OiBMYW5ndWFnZVNlcnZpY2VIb3N0ID0ge1xuICAgIC4uLmNvbXBpbGVySG9zdCxcbiAgICBnZXRQcm9qZWN0VmVyc2lvbjogKCkgPT4gcHJvamVjdFZlcnNpb24udG9TdHJpbmcoKSxcbiAgICBnZXRDb21waWxhdGlvblNldHRpbmdzOiAoKSA9PiBjb21waWxlck9wdGlvbnMsXG4gICAgZ2V0Q3VzdG9tVHJhbnNmb3JtZXJzOiAoKSA9PiBjdXN0b21UcmFuc2Zvcm1lcnMsXG4gICAgZ2V0U2NyaXB0RmlsZU5hbWVzOiAoKSA9PiBmaWxlTmFtZXMsXG4gICAgZ2V0U2NyaXB0U25hcHNob3Q6IGZpbGVOYW1lID0+IHtcbiAgICAgIGNvbnN0IGNvbnRlbnRzID0gc3lzLnJlYWRGaWxlKGZpbGVOYW1lKVxuICAgICAgaWYgKGNvbnRlbnRzKSB7XG4gICAgICAgIHJldHVybiB0cy5TY3JpcHRTbmFwc2hvdC5mcm9tU3RyaW5nKGNvbnRlbnRzKVxuICAgICAgfVxuICAgICAgcmV0dXJuXG4gICAgfSxcbiAgICBnZXRTY3JpcHRWZXJzaW9uOiBmaWxlTmFtZSA9PiB7XG4gICAgICByZXR1cm4gZmlsZVZlcnNpb25zLmdldChmaWxlTmFtZSkgfHwgXCIwXCJcbiAgICB9LFxuICAgIHdyaXRlRmlsZTogc3lzLndyaXRlRmlsZSxcbiAgfVxuXG4gIHR5cGUgUmV0dXJuID0ge1xuICAgIGxhbmd1YWdlU2VydmljZUhvc3Q6IExhbmd1YWdlU2VydmljZUhvc3RcbiAgICB1cGRhdGVGaWxlOiAoc291cmNlRmlsZTogaW1wb3J0KFwidHlwZXNjcmlwdFwiKS5Tb3VyY2VGaWxlKSA9PiB2b2lkXG4gIH1cblxuICBjb25zdCBsc0hvc3Q6IFJldHVybiA9IHtcbiAgICBsYW5ndWFnZVNlcnZpY2VIb3N0LFxuICAgIHVwZGF0ZUZpbGU6IHNvdXJjZUZpbGUgPT4ge1xuICAgICAgcHJvamVjdFZlcnNpb24rK1xuICAgICAgZmlsZVZlcnNpb25zLnNldChzb3VyY2VGaWxlLmZpbGVOYW1lLCBwcm9qZWN0VmVyc2lvbi50b1N0cmluZygpKVxuICAgICAgaWYgKCFmaWxlTmFtZXMuaW5jbHVkZXMoc291cmNlRmlsZS5maWxlTmFtZSkpIHtcbiAgICAgICAgZmlsZU5hbWVzLnB1c2goc291cmNlRmlsZS5maWxlTmFtZSlcbiAgICAgIH1cbiAgICAgIHVwZGF0ZUZpbGUoc291cmNlRmlsZSlcbiAgICB9LFxuICB9XG4gIHJldHVybiBsc0hvc3Rcbn1cbiJdfQ==
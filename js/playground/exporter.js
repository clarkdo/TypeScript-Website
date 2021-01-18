var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createExporter = void 0;
    const createExporter = (sandbox, monaco, ui) => {
        function getScriptTargetText(option) {
            return monaco.languages.typescript.ScriptTarget[option];
        }
        function getJsxEmitText(option) {
            if (option === monaco.languages.typescript.JsxEmit.None) {
                return undefined;
            }
            return monaco.languages.typescript.JsxEmit[option];
        }
        function getModuleKindText(option) {
            if (option === monaco.languages.typescript.ModuleKind.None) {
                return undefined;
            }
            return monaco.languages.typescript.ModuleKind[option];
        }
        // These are the compiler's defaults, and we want a diff from
        // these before putting it in the issue
        const defaultCompilerOptionsForTSC = {
            esModuleInterop: false,
            strictNullChecks: false,
            strict: false,
            strictFunctionTypes: false,
            strictPropertyInitialization: false,
            strictBindCallApply: false,
            noImplicitAny: false,
            noImplicitThis: false,
            noImplicitReturns: false,
            checkJs: false,
            allowJs: false,
            experimentalDecorators: false,
            emitDecoratorMetadata: false,
        };
        function getValidCompilerOptions(options) {
            const { target: targetOption, jsx: jsxOption, module: moduleOption } = options, restOptions = __rest(options, ["target", "jsx", "module"]);
            const targetText = getScriptTargetText(targetOption);
            const jsxText = getJsxEmitText(jsxOption);
            const moduleText = getModuleKindText(moduleOption);
            const opts = Object.assign(Object.assign(Object.assign(Object.assign({}, restOptions), (targetText && { target: targetText })), (jsxText && { jsx: jsxText })), (moduleText && { module: moduleText }));
            const diffFromTSCDefaults = Object.entries(opts).reduce((acc, [key, value]) => {
                if (opts[key] && value != defaultCompilerOptionsForTSC[key]) {
                    // @ts-ignore
                    acc[key] = opts[key];
                }
                return acc;
            }, {});
            return diffFromTSCDefaults;
        }
        // Based on https://github.com/stackblitz/core/blob/master/sdk/src/generate.ts
        function createHiddenInput(name, value) {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = name;
            input.value = value;
            return input;
        }
        function createProjectForm(project) {
            const form = document.createElement("form");
            form.method = "POST";
            form.setAttribute("style", "display:none;");
            form.appendChild(createHiddenInput("project[title]", project.title));
            form.appendChild(createHiddenInput("project[description]", project.description));
            form.appendChild(createHiddenInput("project[template]", project.template));
            if (project.tags) {
                project.tags.forEach((tag) => {
                    form.appendChild(createHiddenInput("project[tags][]", tag));
                });
            }
            if (project.dependencies) {
                form.appendChild(createHiddenInput("project[dependencies]", JSON.stringify(project.dependencies)));
            }
            if (project.settings) {
                form.appendChild(createHiddenInput("project[settings]", JSON.stringify(project.settings)));
            }
            Object.keys(project.files).forEach(path => {
                form.appendChild(createHiddenInput(`project[files][${path}]`, project.files[path]));
            });
            return form;
        }
        const typescriptVersion = sandbox.ts.version;
        // prettier-ignore
        const stringifiedCompilerOptions = JSON.stringify({ compilerOptions: getValidCompilerOptions(sandbox.getCompilerOptions()) }, null, '  ');
        // TODO: pull deps
        function openProjectInStackBlitz() {
            const project = {
                title: "Playground Export - ",
                description: "123",
                template: "typescript",
                files: {
                    "index.ts": sandbox.getText(),
                    "tsconfig.json": stringifiedCompilerOptions,
                },
                dependencies: {
                    typescript: typescriptVersion,
                },
            };
            const form = createProjectForm(project);
            form.action = "https://stackblitz.com/run?view=editor";
            // https://github.com/stackblitz/core/blob/master/sdk/src/helpers.ts#L9
            // + buildProjectQuery(options);
            form.target = "_blank";
            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
        }
        function openInBugWorkbench() {
            const hash = `#code/${sandbox.lzstring.compressToEncodedURIComponent(sandbox.getText())}`;
            document.location.assign(`/dev/bug-workbench/${hash}`);
        }
        function openInTSAST() {
            const hash = `#code/${sandbox.lzstring.compressToEncodedURIComponent(sandbox.getText())}`;
            document.location.assign(`https://ts-ast-viewer.com/${hash}`);
        }
        function openProjectInCodeSandbox() {
            const files = {
                "package.json": {
                    content: {
                        name: "TypeScript Playground Export",
                        version: "0.0.0",
                        description: "TypeScript playground exported Sandbox",
                        dependencies: {
                            typescript: typescriptVersion,
                        },
                    },
                },
                "index.ts": {
                    content: sandbox.getText(),
                },
                "tsconfig.json": {
                    content: stringifiedCompilerOptions,
                },
            };
            // Using the v1 get API
            const parameters = sandbox.lzstring
                .compressToBase64(JSON.stringify({ files }))
                .replace(/\+/g, "-") // Convert '+' to '-'
                .replace(/\//g, "_") // Convert '/' to '_'
                .replace(/=+$/, ""); // Remove ending '='
            const url = `https://codesandbox.io/api/v1/sandboxes/define?view=editor&parameters=${parameters}`;
            document.location.assign(url);
            // Alternative using the http URL API, which uses POST. This has the trade-off where
            // the async nature of the call means that the redirect at the end triggers
            // popup security mechanisms in browsers because the function isn't blessed as
            // being a direct result of a user action.
            // fetch("https://codesandbox.io/api/v1/sandboxes/define?json=1", {
            //   method: "POST",
            //   body: JSON.stringify({ files }),
            //   headers: {
            //     Accept: "application/json",
            //     "Content-Type": "application/json"
            //   }
            // })
            // .then(x => x.json())
            // .then(data => {
            //   window.open('https://codesandbox.io/s/' + data.sandbox_id, '_blank');
            // });
        }
        function codify(code, ext) {
            return "```" + ext + "\n" + code + "\n```\n";
        }
        function makeMarkdown() {
            return __awaiter(this, void 0, void 0, function* () {
                const query = sandbox.createURLQueryWithCompilerOptions(sandbox);
                const fullURL = `${document.location.protocol}//${document.location.host}${document.location.pathname}${query}`;
                const jsSection = sandbox.config.useJavaScript
                    ? ""
                    : `
<details><summary><b>Output</b></summary>

${codify(yield sandbox.getRunnableJS(), "ts")}

</details>
`;
                return `
${codify(sandbox.getText(), "ts")}

${jsSection}

<details><summary><b>Compiler Options</b></summary>

${codify(stringifiedCompilerOptions, "json")}

</details>

**Playground Link:** [Provided](${fullURL})
      `;
            });
        }
        function copyAsMarkdownIssue(e) {
            return __awaiter(this, void 0, void 0, function* () {
                e.persist();
                const markdown = yield makeMarkdown();
                ui.showModal(markdown, document.getElementById("exports-dropdown"), "Markdown Version of Playground Code for GitHub Issue", undefined, e);
                return false;
            });
        }
        function copyForChat(e) {
            const query = sandbox.createURLQueryWithCompilerOptions(sandbox);
            const fullURL = `${document.location.protocol}//${document.location.host}${document.location.pathname}${query}`;
            const chat = `[Playground Link](${fullURL})`;
            ui.showModal(chat, document.getElementById("exports-dropdown"), "Markdown for chat", undefined, e);
            return false;
        }
        function copyForChatWithPreview(e) {
            e.persist();
            const query = sandbox.createURLQueryWithCompilerOptions(sandbox);
            const fullURL = `${document.location.protocol}//${document.location.host}${document.location.pathname}${query}`;
            const ts = sandbox.getText();
            const preview = ts.length > 200 ? ts.substring(0, 200) + "..." : ts.substring(0, 200);
            const code = "```\n" + preview + "\n```\n";
            const chat = `${code}\n[Playground Link](${fullURL})`;
            ui.showModal(chat, document.getElementById("exports-dropdown"), "Markdown code", undefined, e);
            return false;
        }
        function exportAsTweet() {
            const query = sandbox.createURLQueryWithCompilerOptions(sandbox);
            const fullURL = `${document.location.protocol}//${document.location.host}${document.location.pathname}${query}`;
            document.location.assign(`http://www.twitter.com/share?url=${fullURL}`);
        }
        return {
            openProjectInStackBlitz,
            openProjectInCodeSandbox,
            copyAsMarkdownIssue,
            copyForChat,
            copyForChatWithPreview,
            openInTSAST,
            openInBugWorkbench,
            exportAsTweet,
        };
    };
    exports.createExporter = createExporter;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwb3J0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wbGF5Z3JvdW5kL3NyYy9leHBvcnRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFLTyxNQUFNLGNBQWMsR0FBRyxDQUFDLE9BQWdCLEVBQUUsTUFBc0MsRUFBRSxFQUFNLEVBQUUsRUFBRTtRQUNqRyxTQUFTLG1CQUFtQixDQUFDLE1BQVc7WUFDdEMsT0FBTyxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDekQsQ0FBQztRQUVELFNBQVMsY0FBYyxDQUFDLE1BQVc7WUFDakMsSUFBSSxNQUFNLEtBQUssTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRTtnQkFDdkQsT0FBTyxTQUFTLENBQUE7YUFDakI7WUFDRCxPQUFPLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUNwRCxDQUFDO1FBRUQsU0FBUyxpQkFBaUIsQ0FBQyxNQUFXO1lBQ3BDLElBQUksTUFBTSxLQUFLLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUU7Z0JBQzFELE9BQU8sU0FBUyxDQUFBO2FBQ2pCO1lBQ0QsT0FBTyxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDdkQsQ0FBQztRQUVELDZEQUE2RDtRQUM3RCx1Q0FBdUM7UUFDdkMsTUFBTSw0QkFBNEIsR0FBb0I7WUFDcEQsZUFBZSxFQUFFLEtBQUs7WUFDdEIsZ0JBQWdCLEVBQUUsS0FBSztZQUN2QixNQUFNLEVBQUUsS0FBSztZQUNiLG1CQUFtQixFQUFFLEtBQUs7WUFDMUIsNEJBQTRCLEVBQUUsS0FBSztZQUNuQyxtQkFBbUIsRUFBRSxLQUFLO1lBQzFCLGFBQWEsRUFBRSxLQUFLO1lBQ3BCLGNBQWMsRUFBRSxLQUFLO1lBQ3JCLGlCQUFpQixFQUFFLEtBQUs7WUFDeEIsT0FBTyxFQUFFLEtBQUs7WUFDZCxPQUFPLEVBQUUsS0FBSztZQUNkLHNCQUFzQixFQUFFLEtBQUs7WUFDN0IscUJBQXFCLEVBQUUsS0FBSztTQUM3QixDQUFBO1FBRUQsU0FBUyx1QkFBdUIsQ0FBQyxPQUF3QjtZQUN2RCxNQUFNLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxZQUFZLEtBQXFCLE9BQU8sRUFBdkIsV0FBVyxVQUFLLE9BQU8sRUFBeEYsMkJBQThFLENBQVUsQ0FBQTtZQUU5RixNQUFNLFVBQVUsR0FBRyxtQkFBbUIsQ0FBQyxZQUFZLENBQUMsQ0FBQTtZQUNwRCxNQUFNLE9BQU8sR0FBRyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUE7WUFDekMsTUFBTSxVQUFVLEdBQUcsaUJBQWlCLENBQUMsWUFBWSxDQUFDLENBQUE7WUFFbEQsTUFBTSxJQUFJLCtEQUNMLFdBQVcsR0FDWCxDQUFDLFVBQVUsSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsQ0FBQyxHQUN0QyxDQUFDLE9BQU8sSUFBSSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxHQUM3QixDQUFDLFVBQVUsSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUMxQyxDQUFBO1lBRUQsTUFBTSxtQkFBbUIsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsRUFBRSxFQUFFO2dCQUM1RSxJQUFLLElBQVksQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLElBQUksNEJBQTRCLENBQUMsR0FBRyxDQUFDLEVBQUU7b0JBQ3BFLGFBQWE7b0JBQ2IsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQTtpQkFDckI7Z0JBRUQsT0FBTyxHQUFHLENBQUE7WUFDWixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7WUFFTixPQUFPLG1CQUFtQixDQUFBO1FBQzVCLENBQUM7UUFFRCw4RUFBOEU7UUFDOUUsU0FBUyxpQkFBaUIsQ0FBQyxJQUFZLEVBQUUsS0FBYTtZQUNwRCxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQzdDLEtBQUssQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFBO1lBQ3JCLEtBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFBO1lBQ2pCLEtBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFBO1lBQ25CLE9BQU8sS0FBSyxDQUFBO1FBQ2QsQ0FBQztRQUVELFNBQVMsaUJBQWlCLENBQUMsT0FBWTtZQUNyQyxNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1lBRTNDLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFBO1lBQ3BCLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLGVBQWUsQ0FBQyxDQUFBO1lBRTNDLElBQUksQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUE7WUFDcEUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxzQkFBc0IsRUFBRSxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQTtZQUNoRixJQUFJLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLG1CQUFtQixFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFBO1lBRTFFLElBQUksT0FBTyxDQUFDLElBQUksRUFBRTtnQkFDaEIsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFXLEVBQUUsRUFBRTtvQkFDbkMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFBO2dCQUM3RCxDQUFDLENBQUMsQ0FBQTthQUNIO1lBRUQsSUFBSSxPQUFPLENBQUMsWUFBWSxFQUFFO2dCQUN4QixJQUFJLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLHVCQUF1QixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQTthQUNuRztZQUVELElBQUksT0FBTyxDQUFDLFFBQVEsRUFBRTtnQkFDcEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUE7YUFDM0Y7WUFFRCxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ3hDLElBQUksQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsa0JBQWtCLElBQUksR0FBRyxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ3JGLENBQUMsQ0FBQyxDQUFBO1lBRUYsT0FBTyxJQUFJLENBQUE7UUFDYixDQUFDO1FBRUQsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQTtRQUM1QyxrQkFBa0I7UUFDbEIsTUFBTSwwQkFBMEIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsZUFBZSxFQUFFLHVCQUF1QixDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFFekksa0JBQWtCO1FBQ2xCLFNBQVMsdUJBQXVCO1lBQzlCLE1BQU0sT0FBTyxHQUFHO2dCQUNkLEtBQUssRUFBRSxzQkFBc0I7Z0JBQzdCLFdBQVcsRUFBRSxLQUFLO2dCQUNsQixRQUFRLEVBQUUsWUFBWTtnQkFDdEIsS0FBSyxFQUFFO29CQUNMLFVBQVUsRUFBRSxPQUFPLENBQUMsT0FBTyxFQUFFO29CQUM3QixlQUFlLEVBQUUsMEJBQTBCO2lCQUM1QztnQkFDRCxZQUFZLEVBQUU7b0JBQ1osVUFBVSxFQUFFLGlCQUFpQjtpQkFDOUI7YUFDRixDQUFBO1lBQ0QsTUFBTSxJQUFJLEdBQUcsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUE7WUFDdkMsSUFBSSxDQUFDLE1BQU0sR0FBRyx3Q0FBd0MsQ0FBQTtZQUN0RCx1RUFBdUU7WUFDdkUsZ0NBQWdDO1lBQ2hDLElBQUksQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFBO1lBRXRCLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFBO1lBQy9CLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQTtZQUNiLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ2pDLENBQUM7UUFFRCxTQUFTLGtCQUFrQjtZQUN6QixNQUFNLElBQUksR0FBRyxTQUFTLE9BQU8sQ0FBQyxRQUFRLENBQUMsNkJBQTZCLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQTtZQUN6RixRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxzQkFBc0IsSUFBSSxFQUFFLENBQUMsQ0FBQTtRQUN4RCxDQUFDO1FBRUQsU0FBUyxXQUFXO1lBQ2xCLE1BQU0sSUFBSSxHQUFHLFNBQVMsT0FBTyxDQUFDLFFBQVEsQ0FBQyw2QkFBNkIsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFBO1lBQ3pGLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLDZCQUE2QixJQUFJLEVBQUUsQ0FBQyxDQUFBO1FBQy9ELENBQUM7UUFFRCxTQUFTLHdCQUF3QjtZQUMvQixNQUFNLEtBQUssR0FBRztnQkFDWixjQUFjLEVBQUU7b0JBQ2QsT0FBTyxFQUFFO3dCQUNQLElBQUksRUFBRSw4QkFBOEI7d0JBQ3BDLE9BQU8sRUFBRSxPQUFPO3dCQUNoQixXQUFXLEVBQUUsd0NBQXdDO3dCQUNyRCxZQUFZLEVBQUU7NEJBQ1osVUFBVSxFQUFFLGlCQUFpQjt5QkFDOUI7cUJBQ0Y7aUJBQ0Y7Z0JBQ0QsVUFBVSxFQUFFO29CQUNWLE9BQU8sRUFBRSxPQUFPLENBQUMsT0FBTyxFQUFFO2lCQUMzQjtnQkFDRCxlQUFlLEVBQUU7b0JBQ2YsT0FBTyxFQUFFLDBCQUEwQjtpQkFDcEM7YUFDRixDQUFBO1lBRUQsdUJBQXVCO1lBQ3ZCLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxRQUFRO2lCQUNoQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztpQkFDM0MsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQyxxQkFBcUI7aUJBQ3pDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUMscUJBQXFCO2lCQUN6QyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFBLENBQUMsb0JBQW9CO1lBRTFDLE1BQU0sR0FBRyxHQUFHLHlFQUF5RSxVQUFVLEVBQUUsQ0FBQTtZQUNqRyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUU3QixvRkFBb0Y7WUFDcEYsMkVBQTJFO1lBQzNFLDhFQUE4RTtZQUM5RSwwQ0FBMEM7WUFFMUMsbUVBQW1FO1lBQ25FLG9CQUFvQjtZQUNwQixxQ0FBcUM7WUFDckMsZUFBZTtZQUNmLGtDQUFrQztZQUNsQyx5Q0FBeUM7WUFDekMsTUFBTTtZQUNOLEtBQUs7WUFDTCx1QkFBdUI7WUFDdkIsa0JBQWtCO1lBQ2xCLDBFQUEwRTtZQUMxRSxNQUFNO1FBQ1IsQ0FBQztRQUVELFNBQVMsTUFBTSxDQUFDLElBQVksRUFBRSxHQUFXO1lBQ3ZDLE9BQU8sS0FBSyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLFNBQVMsQ0FBQTtRQUM5QyxDQUFDO1FBRUQsU0FBZSxZQUFZOztnQkFDekIsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLGlDQUFpQyxDQUFDLE9BQU8sQ0FBQyxDQUFBO2dCQUNoRSxNQUFNLE9BQU8sR0FBRyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxLQUFLLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxHQUFHLEtBQUssRUFBRSxDQUFBO2dCQUMvRyxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLGFBQWE7b0JBQzVDLENBQUMsQ0FBQyxFQUFFO29CQUNKLENBQUMsQ0FBQzs7O0VBR04sTUFBTSxDQUFDLE1BQU0sT0FBTyxDQUFDLGFBQWEsRUFBRSxFQUFFLElBQUksQ0FBQzs7O0NBRzVDLENBQUE7Z0JBRUcsT0FBTztFQUNULE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLEVBQUUsSUFBSSxDQUFDOztFQUUvQixTQUFTOzs7O0VBSVQsTUFBTSxDQUFDLDBCQUEwQixFQUFFLE1BQU0sQ0FBQzs7OztrQ0FJVixPQUFPO09BQ2xDLENBQUE7WUFDTCxDQUFDO1NBQUE7UUFDRCxTQUFlLG1CQUFtQixDQUFDLENBQW1COztnQkFDcEQsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFBO2dCQUVYLE1BQU0sUUFBUSxHQUFHLE1BQU0sWUFBWSxFQUFFLENBQUE7Z0JBQ3JDLEVBQUUsQ0FBQyxTQUFTLENBQ1YsUUFBUSxFQUNSLFFBQVEsQ0FBQyxjQUFjLENBQUMsa0JBQWtCLENBQUUsRUFDNUMsc0RBQXNELEVBQ3RELFNBQVMsRUFDVCxDQUFDLENBQ0YsQ0FBQTtnQkFDRCxPQUFPLEtBQUssQ0FBQTtZQUNkLENBQUM7U0FBQTtRQUVELFNBQVMsV0FBVyxDQUFDLENBQW1CO1lBQ3RDLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxpQ0FBaUMsQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUNoRSxNQUFNLE9BQU8sR0FBRyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxLQUFLLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxHQUFHLEtBQUssRUFBRSxDQUFBO1lBQy9HLE1BQU0sSUFBSSxHQUFHLHFCQUFxQixPQUFPLEdBQUcsQ0FBQTtZQUM1QyxFQUFFLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsY0FBYyxDQUFDLGtCQUFrQixDQUFFLEVBQUUsbUJBQW1CLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQ25HLE9BQU8sS0FBSyxDQUFBO1FBQ2QsQ0FBQztRQUVELFNBQVMsc0JBQXNCLENBQUMsQ0FBbUI7WUFDakQsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFBO1lBRVgsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLGlDQUFpQyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQ2hFLE1BQU0sT0FBTyxHQUFHLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEtBQUssUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEdBQUcsS0FBSyxFQUFFLENBQUE7WUFFL0csTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFBO1lBQzVCLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFBO1lBRXJGLE1BQU0sSUFBSSxHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsU0FBUyxDQUFBO1lBQzFDLE1BQU0sSUFBSSxHQUFHLEdBQUcsSUFBSSx1QkFBdUIsT0FBTyxHQUFHLENBQUE7WUFDckQsRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBRSxFQUFFLGVBQWUsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUE7WUFDL0YsT0FBTyxLQUFLLENBQUE7UUFDZCxDQUFDO1FBRUQsU0FBUyxhQUFhO1lBQ3BCLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxpQ0FBaUMsQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUNoRSxNQUFNLE9BQU8sR0FBRyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxLQUFLLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxHQUFHLEtBQUssRUFBRSxDQUFBO1lBRS9HLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLG9DQUFvQyxPQUFPLEVBQUUsQ0FBQyxDQUFBO1FBQ3pFLENBQUM7UUFFRCxPQUFPO1lBQ0wsdUJBQXVCO1lBQ3ZCLHdCQUF3QjtZQUN4QixtQkFBbUI7WUFDbkIsV0FBVztZQUNYLHNCQUFzQjtZQUN0QixXQUFXO1lBQ1gsa0JBQWtCO1lBQ2xCLGFBQWE7U0FDZCxDQUFBO0lBQ0gsQ0FBQyxDQUFBO0lBcFJZLFFBQUEsY0FBYyxrQkFvUjFCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVUkgfSBmcm9tIFwiLi9jcmVhdGVVSVwiXG5cbnR5cGUgU2FuZGJveCA9IGltcG9ydChcInR5cGVzY3JpcHQtc2FuZGJveFwiKS5TYW5kYm94XG50eXBlIENvbXBpbGVyT3B0aW9ucyA9IGltcG9ydChcIm1vbmFjby1lZGl0b3JcIikubGFuZ3VhZ2VzLnR5cGVzY3JpcHQuQ29tcGlsZXJPcHRpb25zXG5cbmV4cG9ydCBjb25zdCBjcmVhdGVFeHBvcnRlciA9IChzYW5kYm94OiBTYW5kYm94LCBtb25hY286IHR5cGVvZiBpbXBvcnQoXCJtb25hY28tZWRpdG9yXCIpLCB1aTogVUkpID0+IHtcbiAgZnVuY3Rpb24gZ2V0U2NyaXB0VGFyZ2V0VGV4dChvcHRpb246IGFueSkge1xuICAgIHJldHVybiBtb25hY28ubGFuZ3VhZ2VzLnR5cGVzY3JpcHQuU2NyaXB0VGFyZ2V0W29wdGlvbl1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdldEpzeEVtaXRUZXh0KG9wdGlvbjogYW55KSB7XG4gICAgaWYgKG9wdGlvbiA9PT0gbW9uYWNvLmxhbmd1YWdlcy50eXBlc2NyaXB0LkpzeEVtaXQuTm9uZSkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgIH1cbiAgICByZXR1cm4gbW9uYWNvLmxhbmd1YWdlcy50eXBlc2NyaXB0LkpzeEVtaXRbb3B0aW9uXVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0TW9kdWxlS2luZFRleHQob3B0aW9uOiBhbnkpIHtcbiAgICBpZiAob3B0aW9uID09PSBtb25hY28ubGFuZ3VhZ2VzLnR5cGVzY3JpcHQuTW9kdWxlS2luZC5Ob25lKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuICAgIHJldHVybiBtb25hY28ubGFuZ3VhZ2VzLnR5cGVzY3JpcHQuTW9kdWxlS2luZFtvcHRpb25dXG4gIH1cblxuICAvLyBUaGVzZSBhcmUgdGhlIGNvbXBpbGVyJ3MgZGVmYXVsdHMsIGFuZCB3ZSB3YW50IGEgZGlmZiBmcm9tXG4gIC8vIHRoZXNlIGJlZm9yZSBwdXR0aW5nIGl0IGluIHRoZSBpc3N1ZVxuICBjb25zdCBkZWZhdWx0Q29tcGlsZXJPcHRpb25zRm9yVFNDOiBDb21waWxlck9wdGlvbnMgPSB7XG4gICAgZXNNb2R1bGVJbnRlcm9wOiBmYWxzZSxcbiAgICBzdHJpY3ROdWxsQ2hlY2tzOiBmYWxzZSxcbiAgICBzdHJpY3Q6IGZhbHNlLFxuICAgIHN0cmljdEZ1bmN0aW9uVHlwZXM6IGZhbHNlLFxuICAgIHN0cmljdFByb3BlcnR5SW5pdGlhbGl6YXRpb246IGZhbHNlLFxuICAgIHN0cmljdEJpbmRDYWxsQXBwbHk6IGZhbHNlLFxuICAgIG5vSW1wbGljaXRBbnk6IGZhbHNlLFxuICAgIG5vSW1wbGljaXRUaGlzOiBmYWxzZSxcbiAgICBub0ltcGxpY2l0UmV0dXJuczogZmFsc2UsXG4gICAgY2hlY2tKczogZmFsc2UsXG4gICAgYWxsb3dKczogZmFsc2UsXG4gICAgZXhwZXJpbWVudGFsRGVjb3JhdG9yczogZmFsc2UsXG4gICAgZW1pdERlY29yYXRvck1ldGFkYXRhOiBmYWxzZSxcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFZhbGlkQ29tcGlsZXJPcHRpb25zKG9wdGlvbnM6IENvbXBpbGVyT3B0aW9ucykge1xuICAgIGNvbnN0IHsgdGFyZ2V0OiB0YXJnZXRPcHRpb24sIGpzeDoganN4T3B0aW9uLCBtb2R1bGU6IG1vZHVsZU9wdGlvbiwgLi4ucmVzdE9wdGlvbnMgfSA9IG9wdGlvbnNcblxuICAgIGNvbnN0IHRhcmdldFRleHQgPSBnZXRTY3JpcHRUYXJnZXRUZXh0KHRhcmdldE9wdGlvbilcbiAgICBjb25zdCBqc3hUZXh0ID0gZ2V0SnN4RW1pdFRleHQoanN4T3B0aW9uKVxuICAgIGNvbnN0IG1vZHVsZVRleHQgPSBnZXRNb2R1bGVLaW5kVGV4dChtb2R1bGVPcHRpb24pXG5cbiAgICBjb25zdCBvcHRzID0ge1xuICAgICAgLi4ucmVzdE9wdGlvbnMsXG4gICAgICAuLi4odGFyZ2V0VGV4dCAmJiB7IHRhcmdldDogdGFyZ2V0VGV4dCB9KSxcbiAgICAgIC4uLihqc3hUZXh0ICYmIHsganN4OiBqc3hUZXh0IH0pLFxuICAgICAgLi4uKG1vZHVsZVRleHQgJiYgeyBtb2R1bGU6IG1vZHVsZVRleHQgfSksXG4gICAgfVxuXG4gICAgY29uc3QgZGlmZkZyb21UU0NEZWZhdWx0cyA9IE9iamVjdC5lbnRyaWVzKG9wdHMpLnJlZHVjZSgoYWNjLCBba2V5LCB2YWx1ZV0pID0+IHtcbiAgICAgIGlmICgob3B0cyBhcyBhbnkpW2tleV0gJiYgdmFsdWUgIT0gZGVmYXVsdENvbXBpbGVyT3B0aW9uc0ZvclRTQ1trZXldKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgYWNjW2tleV0gPSBvcHRzW2tleV1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFjY1xuICAgIH0sIHt9KVxuXG4gICAgcmV0dXJuIGRpZmZGcm9tVFNDRGVmYXVsdHNcbiAgfVxuXG4gIC8vIEJhc2VkIG9uIGh0dHBzOi8vZ2l0aHViLmNvbS9zdGFja2JsaXR6L2NvcmUvYmxvYi9tYXN0ZXIvc2RrL3NyYy9nZW5lcmF0ZS50c1xuICBmdW5jdGlvbiBjcmVhdGVIaWRkZW5JbnB1dChuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpIHtcbiAgICBjb25zdCBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKVxuICAgIGlucHV0LnR5cGUgPSBcImhpZGRlblwiXG4gICAgaW5wdXQubmFtZSA9IG5hbWVcbiAgICBpbnB1dC52YWx1ZSA9IHZhbHVlXG4gICAgcmV0dXJuIGlucHV0XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVQcm9qZWN0Rm9ybShwcm9qZWN0OiBhbnkpIHtcbiAgICBjb25zdCBmb3JtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImZvcm1cIilcblxuICAgIGZvcm0ubWV0aG9kID0gXCJQT1NUXCJcbiAgICBmb3JtLnNldEF0dHJpYnV0ZShcInN0eWxlXCIsIFwiZGlzcGxheTpub25lO1wiKVxuXG4gICAgZm9ybS5hcHBlbmRDaGlsZChjcmVhdGVIaWRkZW5JbnB1dChcInByb2plY3RbdGl0bGVdXCIsIHByb2plY3QudGl0bGUpKVxuICAgIGZvcm0uYXBwZW5kQ2hpbGQoY3JlYXRlSGlkZGVuSW5wdXQoXCJwcm9qZWN0W2Rlc2NyaXB0aW9uXVwiLCBwcm9qZWN0LmRlc2NyaXB0aW9uKSlcbiAgICBmb3JtLmFwcGVuZENoaWxkKGNyZWF0ZUhpZGRlbklucHV0KFwicHJvamVjdFt0ZW1wbGF0ZV1cIiwgcHJvamVjdC50ZW1wbGF0ZSkpXG5cbiAgICBpZiAocHJvamVjdC50YWdzKSB7XG4gICAgICBwcm9qZWN0LnRhZ3MuZm9yRWFjaCgodGFnOiBzdHJpbmcpID0+IHtcbiAgICAgICAgZm9ybS5hcHBlbmRDaGlsZChjcmVhdGVIaWRkZW5JbnB1dChcInByb2plY3RbdGFnc11bXVwiLCB0YWcpKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAocHJvamVjdC5kZXBlbmRlbmNpZXMpIHtcbiAgICAgIGZvcm0uYXBwZW5kQ2hpbGQoY3JlYXRlSGlkZGVuSW5wdXQoXCJwcm9qZWN0W2RlcGVuZGVuY2llc11cIiwgSlNPTi5zdHJpbmdpZnkocHJvamVjdC5kZXBlbmRlbmNpZXMpKSlcbiAgICB9XG5cbiAgICBpZiAocHJvamVjdC5zZXR0aW5ncykge1xuICAgICAgZm9ybS5hcHBlbmRDaGlsZChjcmVhdGVIaWRkZW5JbnB1dChcInByb2plY3Rbc2V0dGluZ3NdXCIsIEpTT04uc3RyaW5naWZ5KHByb2plY3Quc2V0dGluZ3MpKSlcbiAgICB9XG5cbiAgICBPYmplY3Qua2V5cyhwcm9qZWN0LmZpbGVzKS5mb3JFYWNoKHBhdGggPT4ge1xuICAgICAgZm9ybS5hcHBlbmRDaGlsZChjcmVhdGVIaWRkZW5JbnB1dChgcHJvamVjdFtmaWxlc11bJHtwYXRofV1gLCBwcm9qZWN0LmZpbGVzW3BhdGhdKSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIGZvcm1cbiAgfVxuXG4gIGNvbnN0IHR5cGVzY3JpcHRWZXJzaW9uID0gc2FuZGJveC50cy52ZXJzaW9uXG4gIC8vIHByZXR0aWVyLWlnbm9yZVxuICBjb25zdCBzdHJpbmdpZmllZENvbXBpbGVyT3B0aW9ucyA9IEpTT04uc3RyaW5naWZ5KHsgY29tcGlsZXJPcHRpb25zOiBnZXRWYWxpZENvbXBpbGVyT3B0aW9ucyhzYW5kYm94LmdldENvbXBpbGVyT3B0aW9ucygpKSB9LCBudWxsLCAnICAnKVxuXG4gIC8vIFRPRE86IHB1bGwgZGVwc1xuICBmdW5jdGlvbiBvcGVuUHJvamVjdEluU3RhY2tCbGl0eigpIHtcbiAgICBjb25zdCBwcm9qZWN0ID0ge1xuICAgICAgdGl0bGU6IFwiUGxheWdyb3VuZCBFeHBvcnQgLSBcIixcbiAgICAgIGRlc2NyaXB0aW9uOiBcIjEyM1wiLFxuICAgICAgdGVtcGxhdGU6IFwidHlwZXNjcmlwdFwiLFxuICAgICAgZmlsZXM6IHtcbiAgICAgICAgXCJpbmRleC50c1wiOiBzYW5kYm94LmdldFRleHQoKSxcbiAgICAgICAgXCJ0c2NvbmZpZy5qc29uXCI6IHN0cmluZ2lmaWVkQ29tcGlsZXJPcHRpb25zLFxuICAgICAgfSxcbiAgICAgIGRlcGVuZGVuY2llczoge1xuICAgICAgICB0eXBlc2NyaXB0OiB0eXBlc2NyaXB0VmVyc2lvbixcbiAgICAgIH0sXG4gICAgfVxuICAgIGNvbnN0IGZvcm0gPSBjcmVhdGVQcm9qZWN0Rm9ybShwcm9qZWN0KVxuICAgIGZvcm0uYWN0aW9uID0gXCJodHRwczovL3N0YWNrYmxpdHouY29tL3J1bj92aWV3PWVkaXRvclwiXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3N0YWNrYmxpdHovY29yZS9ibG9iL21hc3Rlci9zZGsvc3JjL2hlbHBlcnMudHMjTDlcbiAgICAvLyArIGJ1aWxkUHJvamVjdFF1ZXJ5KG9wdGlvbnMpO1xuICAgIGZvcm0udGFyZ2V0ID0gXCJfYmxhbmtcIlxuXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChmb3JtKVxuICAgIGZvcm0uc3VibWl0KClcbiAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGZvcm0pXG4gIH1cblxuICBmdW5jdGlvbiBvcGVuSW5CdWdXb3JrYmVuY2goKSB7XG4gICAgY29uc3QgaGFzaCA9IGAjY29kZS8ke3NhbmRib3gubHpzdHJpbmcuY29tcHJlc3NUb0VuY29kZWRVUklDb21wb25lbnQoc2FuZGJveC5nZXRUZXh0KCkpfWBcbiAgICBkb2N1bWVudC5sb2NhdGlvbi5hc3NpZ24oYC9kZXYvYnVnLXdvcmtiZW5jaC8ke2hhc2h9YClcbiAgfVxuXG4gIGZ1bmN0aW9uIG9wZW5JblRTQVNUKCkge1xuICAgIGNvbnN0IGhhc2ggPSBgI2NvZGUvJHtzYW5kYm94Lmx6c3RyaW5nLmNvbXByZXNzVG9FbmNvZGVkVVJJQ29tcG9uZW50KHNhbmRib3guZ2V0VGV4dCgpKX1gXG4gICAgZG9jdW1lbnQubG9jYXRpb24uYXNzaWduKGBodHRwczovL3RzLWFzdC12aWV3ZXIuY29tLyR7aGFzaH1gKVxuICB9XG5cbiAgZnVuY3Rpb24gb3BlblByb2plY3RJbkNvZGVTYW5kYm94KCkge1xuICAgIGNvbnN0IGZpbGVzID0ge1xuICAgICAgXCJwYWNrYWdlLmpzb25cIjoge1xuICAgICAgICBjb250ZW50OiB7XG4gICAgICAgICAgbmFtZTogXCJUeXBlU2NyaXB0IFBsYXlncm91bmQgRXhwb3J0XCIsXG4gICAgICAgICAgdmVyc2lvbjogXCIwLjAuMFwiLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlR5cGVTY3JpcHQgcGxheWdyb3VuZCBleHBvcnRlZCBTYW5kYm94XCIsXG4gICAgICAgICAgZGVwZW5kZW5jaWVzOiB7XG4gICAgICAgICAgICB0eXBlc2NyaXB0OiB0eXBlc2NyaXB0VmVyc2lvbixcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIFwiaW5kZXgudHNcIjoge1xuICAgICAgICBjb250ZW50OiBzYW5kYm94LmdldFRleHQoKSxcbiAgICAgIH0sXG4gICAgICBcInRzY29uZmlnLmpzb25cIjoge1xuICAgICAgICBjb250ZW50OiBzdHJpbmdpZmllZENvbXBpbGVyT3B0aW9ucyxcbiAgICAgIH0sXG4gICAgfVxuXG4gICAgLy8gVXNpbmcgdGhlIHYxIGdldCBBUElcbiAgICBjb25zdCBwYXJhbWV0ZXJzID0gc2FuZGJveC5senN0cmluZ1xuICAgICAgLmNvbXByZXNzVG9CYXNlNjQoSlNPTi5zdHJpbmdpZnkoeyBmaWxlcyB9KSlcbiAgICAgIC5yZXBsYWNlKC9cXCsvZywgXCItXCIpIC8vIENvbnZlcnQgJysnIHRvICctJ1xuICAgICAgLnJlcGxhY2UoL1xcLy9nLCBcIl9cIikgLy8gQ29udmVydCAnLycgdG8gJ18nXG4gICAgICAucmVwbGFjZSgvPSskLywgXCJcIikgLy8gUmVtb3ZlIGVuZGluZyAnPSdcblxuICAgIGNvbnN0IHVybCA9IGBodHRwczovL2NvZGVzYW5kYm94LmlvL2FwaS92MS9zYW5kYm94ZXMvZGVmaW5lP3ZpZXc9ZWRpdG9yJnBhcmFtZXRlcnM9JHtwYXJhbWV0ZXJzfWBcbiAgICBkb2N1bWVudC5sb2NhdGlvbi5hc3NpZ24odXJsKVxuXG4gICAgLy8gQWx0ZXJuYXRpdmUgdXNpbmcgdGhlIGh0dHAgVVJMIEFQSSwgd2hpY2ggdXNlcyBQT1NULiBUaGlzIGhhcyB0aGUgdHJhZGUtb2ZmIHdoZXJlXG4gICAgLy8gdGhlIGFzeW5jIG5hdHVyZSBvZiB0aGUgY2FsbCBtZWFucyB0aGF0IHRoZSByZWRpcmVjdCBhdCB0aGUgZW5kIHRyaWdnZXJzXG4gICAgLy8gcG9wdXAgc2VjdXJpdHkgbWVjaGFuaXNtcyBpbiBicm93c2VycyBiZWNhdXNlIHRoZSBmdW5jdGlvbiBpc24ndCBibGVzc2VkIGFzXG4gICAgLy8gYmVpbmcgYSBkaXJlY3QgcmVzdWx0IG9mIGEgdXNlciBhY3Rpb24uXG5cbiAgICAvLyBmZXRjaChcImh0dHBzOi8vY29kZXNhbmRib3guaW8vYXBpL3YxL3NhbmRib3hlcy9kZWZpbmU/anNvbj0xXCIsIHtcbiAgICAvLyAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgLy8gICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGZpbGVzIH0pLFxuICAgIC8vICAgaGVhZGVyczoge1xuICAgIC8vICAgICBBY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgIC8vICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIlxuICAgIC8vICAgfVxuICAgIC8vIH0pXG4gICAgLy8gLnRoZW4oeCA9PiB4Lmpzb24oKSlcbiAgICAvLyAudGhlbihkYXRhID0+IHtcbiAgICAvLyAgIHdpbmRvdy5vcGVuKCdodHRwczovL2NvZGVzYW5kYm94LmlvL3MvJyArIGRhdGEuc2FuZGJveF9pZCwgJ19ibGFuaycpO1xuICAgIC8vIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gY29kaWZ5KGNvZGU6IHN0cmluZywgZXh0OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gXCJgYGBcIiArIGV4dCArIFwiXFxuXCIgKyBjb2RlICsgXCJcXG5gYGBcXG5cIlxuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24gbWFrZU1hcmtkb3duKCkge1xuICAgIGNvbnN0IHF1ZXJ5ID0gc2FuZGJveC5jcmVhdGVVUkxRdWVyeVdpdGhDb21waWxlck9wdGlvbnMoc2FuZGJveClcbiAgICBjb25zdCBmdWxsVVJMID0gYCR7ZG9jdW1lbnQubG9jYXRpb24ucHJvdG9jb2x9Ly8ke2RvY3VtZW50LmxvY2F0aW9uLmhvc3R9JHtkb2N1bWVudC5sb2NhdGlvbi5wYXRobmFtZX0ke3F1ZXJ5fWBcbiAgICBjb25zdCBqc1NlY3Rpb24gPSBzYW5kYm94LmNvbmZpZy51c2VKYXZhU2NyaXB0XG4gICAgICA/IFwiXCJcbiAgICAgIDogYFxuPGRldGFpbHM+PHN1bW1hcnk+PGI+T3V0cHV0PC9iPjwvc3VtbWFyeT5cblxuJHtjb2RpZnkoYXdhaXQgc2FuZGJveC5nZXRSdW5uYWJsZUpTKCksIFwidHNcIil9XG5cbjwvZGV0YWlscz5cbmBcblxuICAgIHJldHVybiBgXG4ke2NvZGlmeShzYW5kYm94LmdldFRleHQoKSwgXCJ0c1wiKX1cblxuJHtqc1NlY3Rpb259XG5cbjxkZXRhaWxzPjxzdW1tYXJ5PjxiPkNvbXBpbGVyIE9wdGlvbnM8L2I+PC9zdW1tYXJ5PlxuXG4ke2NvZGlmeShzdHJpbmdpZmllZENvbXBpbGVyT3B0aW9ucywgXCJqc29uXCIpfVxuXG48L2RldGFpbHM+XG5cbioqUGxheWdyb3VuZCBMaW5rOioqIFtQcm92aWRlZF0oJHtmdWxsVVJMfSlcbiAgICAgIGBcbiAgfVxuICBhc3luYyBmdW5jdGlvbiBjb3B5QXNNYXJrZG93bklzc3VlKGU6IFJlYWN0Lk1vdXNlRXZlbnQpIHtcbiAgICBlLnBlcnNpc3QoKVxuXG4gICAgY29uc3QgbWFya2Rvd24gPSBhd2FpdCBtYWtlTWFya2Rvd24oKVxuICAgIHVpLnNob3dNb2RhbChcbiAgICAgIG1hcmtkb3duLFxuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRzLWRyb3Bkb3duXCIpISxcbiAgICAgIFwiTWFya2Rvd24gVmVyc2lvbiBvZiBQbGF5Z3JvdW5kIENvZGUgZm9yIEdpdEh1YiBJc3N1ZVwiLFxuICAgICAgdW5kZWZpbmVkLFxuICAgICAgZVxuICAgIClcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvcHlGb3JDaGF0KGU6IFJlYWN0Lk1vdXNlRXZlbnQpIHtcbiAgICBjb25zdCBxdWVyeSA9IHNhbmRib3guY3JlYXRlVVJMUXVlcnlXaXRoQ29tcGlsZXJPcHRpb25zKHNhbmRib3gpXG4gICAgY29uc3QgZnVsbFVSTCA9IGAke2RvY3VtZW50LmxvY2F0aW9uLnByb3RvY29sfS8vJHtkb2N1bWVudC5sb2NhdGlvbi5ob3N0fSR7ZG9jdW1lbnQubG9jYXRpb24ucGF0aG5hbWV9JHtxdWVyeX1gXG4gICAgY29uc3QgY2hhdCA9IGBbUGxheWdyb3VuZCBMaW5rXSgke2Z1bGxVUkx9KWBcbiAgICB1aS5zaG93TW9kYWwoY2hhdCwgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleHBvcnRzLWRyb3Bkb3duXCIpISwgXCJNYXJrZG93biBmb3IgY2hhdFwiLCB1bmRlZmluZWQsIGUpXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBmdW5jdGlvbiBjb3B5Rm9yQ2hhdFdpdGhQcmV2aWV3KGU6IFJlYWN0Lk1vdXNlRXZlbnQpIHtcbiAgICBlLnBlcnNpc3QoKVxuXG4gICAgY29uc3QgcXVlcnkgPSBzYW5kYm94LmNyZWF0ZVVSTFF1ZXJ5V2l0aENvbXBpbGVyT3B0aW9ucyhzYW5kYm94KVxuICAgIGNvbnN0IGZ1bGxVUkwgPSBgJHtkb2N1bWVudC5sb2NhdGlvbi5wcm90b2NvbH0vLyR7ZG9jdW1lbnQubG9jYXRpb24uaG9zdH0ke2RvY3VtZW50LmxvY2F0aW9uLnBhdGhuYW1lfSR7cXVlcnl9YFxuXG4gICAgY29uc3QgdHMgPSBzYW5kYm94LmdldFRleHQoKVxuICAgIGNvbnN0IHByZXZpZXcgPSB0cy5sZW5ndGggPiAyMDAgPyB0cy5zdWJzdHJpbmcoMCwgMjAwKSArIFwiLi4uXCIgOiB0cy5zdWJzdHJpbmcoMCwgMjAwKVxuXG4gICAgY29uc3QgY29kZSA9IFwiYGBgXFxuXCIgKyBwcmV2aWV3ICsgXCJcXG5gYGBcXG5cIlxuICAgIGNvbnN0IGNoYXQgPSBgJHtjb2RlfVxcbltQbGF5Z3JvdW5kIExpbmtdKCR7ZnVsbFVSTH0pYFxuICAgIHVpLnNob3dNb2RhbChjaGF0LCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4cG9ydHMtZHJvcGRvd25cIikhLCBcIk1hcmtkb3duIGNvZGVcIiwgdW5kZWZpbmVkLCBlKVxuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgZnVuY3Rpb24gZXhwb3J0QXNUd2VldCgpIHtcbiAgICBjb25zdCBxdWVyeSA9IHNhbmRib3guY3JlYXRlVVJMUXVlcnlXaXRoQ29tcGlsZXJPcHRpb25zKHNhbmRib3gpXG4gICAgY29uc3QgZnVsbFVSTCA9IGAke2RvY3VtZW50LmxvY2F0aW9uLnByb3RvY29sfS8vJHtkb2N1bWVudC5sb2NhdGlvbi5ob3N0fSR7ZG9jdW1lbnQubG9jYXRpb24ucGF0aG5hbWV9JHtxdWVyeX1gXG5cbiAgICBkb2N1bWVudC5sb2NhdGlvbi5hc3NpZ24oYGh0dHA6Ly93d3cudHdpdHRlci5jb20vc2hhcmU/dXJsPSR7ZnVsbFVSTH1gKVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBvcGVuUHJvamVjdEluU3RhY2tCbGl0eixcbiAgICBvcGVuUHJvamVjdEluQ29kZVNhbmRib3gsXG4gICAgY29weUFzTWFya2Rvd25Jc3N1ZSxcbiAgICBjb3B5Rm9yQ2hhdCxcbiAgICBjb3B5Rm9yQ2hhdFdpdGhQcmV2aWV3LFxuICAgIG9wZW5JblRTQVNULFxuICAgIG9wZW5JbkJ1Z1dvcmtiZW5jaCxcbiAgICBleHBvcnRBc1R3ZWV0LFxuICB9XG59XG4iXX0=
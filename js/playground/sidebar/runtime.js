define(["require", "exports", "../createUI", "../localizeWithFallback"], function (require, exports, createUI_1, localizeWithFallback_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.runWithCustomLogs = exports.clearLogs = exports.runPlugin = void 0;
    const allLogs = [];
    let offset = 0;
    let curLog = 0;
    let addedClearAction = false;
    const runPlugin = (i, utils) => {
        const plugin = {
            id: "logs",
            displayName: i("play_sidebar_logs"),
            willMount: (sandbox, container) => {
                if (!addedClearAction) {
                    const ui = createUI_1.createUI();
                    addClearAction(sandbox, ui, i);
                    addedClearAction = true;
                }
                if (allLogs.length === 0) {
                    const noErrorsMessage = document.createElement("div");
                    noErrorsMessage.id = "empty-message-container";
                    container.appendChild(noErrorsMessage);
                    const message = document.createElement("div");
                    message.textContent = localizeWithFallback_1.localize("play_sidebar_logs_no_logs", "No logs");
                    message.classList.add("empty-plugin-message");
                    noErrorsMessage.appendChild(message);
                }
                const errorUL = document.createElement("div");
                errorUL.id = "log-container";
                container.appendChild(errorUL);
                const logs = document.createElement("div");
                logs.id = "log";
                logs.innerHTML = allLogs.join('<hr />');
                errorUL.appendChild(logs);
            },
        };
        return plugin;
    };
    exports.runPlugin = runPlugin;
    const clearLogs = () => {
        offset += allLogs.length;
        allLogs.length = 0;
        const logs = document.getElementById("log");
        if (logs) {
            logs.textContent = "";
        }
    };
    exports.clearLogs = clearLogs;
    const runWithCustomLogs = (closure, i) => {
        const noLogs = document.getElementById("empty-message-container");
        if (noLogs) {
            noLogs.style.display = "none";
        }
        rewireLoggingToElement(() => document.getElementById("log"), () => document.getElementById("log-container"), closure, true, i);
    };
    exports.runWithCustomLogs = runWithCustomLogs;
    // Thanks SO: https://stackoverflow.com/questions/20256760/javascript-console-log-to-html/35449256#35449256
    function rewireLoggingToElement(eleLocator, eleOverflowLocator, closure, autoScroll, i) {
        const rawConsole = console;
        closure.then(js => {
            try {
                const replace = {};
                bindLoggingFunc(replace, rawConsole, 'log', 'LOG', curLog);
                bindLoggingFunc(replace, rawConsole, 'debug', 'DBG', curLog);
                bindLoggingFunc(replace, rawConsole, 'warn', 'WRN', curLog);
                bindLoggingFunc(replace, rawConsole, 'error', 'ERR', curLog);
                replace['clear'] = exports.clearLogs;
                const console = Object.assign({}, rawConsole, replace);
                eval(js);
            }
            catch (error) {
                console.error(i("play_run_js_fail"));
                console.error(error);
            }
            curLog++;
        });
        function bindLoggingFunc(obj, raw, name, id, cur) {
            obj[name] = function (...objs) {
                var _a;
                const output = produceOutput(objs);
                const eleLog = eleLocator();
                const prefix = `[<span class="log-${name}">${id}</span>]: `;
                const eleContainerLog = eleOverflowLocator();
                const index = cur - offset;
                if (index >= 0) {
                    allLogs[index] = ((_a = allLogs[index]) !== null && _a !== void 0 ? _a : '') + prefix + output + "<br>";
                }
                eleLog.innerHTML = allLogs.join("<hr />");
                const scrollElement = eleContainerLog.parentElement;
                if (autoScroll && scrollElement) {
                    scrollToBottom(scrollElement);
                }
                raw[name](...objs);
            };
        }
        function scrollToBottom(element) {
            const overflowHeight = element.scrollHeight - element.clientHeight;
            const atBottom = element.scrollTop >= overflowHeight;
            if (!atBottom) {
                element.scrollTop = overflowHeight;
            }
        }
        const objectToText = (arg) => {
            const isObj = typeof arg === "object";
            let textRep = "";
            if (arg && arg.stack && arg.message) {
                // special case for err
                textRep = arg.message;
            }
            else if (arg === null) {
                textRep = "<span class='literal'>null</span>";
            }
            else if (arg === undefined) {
                textRep = "<span class='literal'>undefined</span>";
            }
            else if (Array.isArray(arg)) {
                textRep = "[" + arg.map(objectToText).join("<span class='comma'>, </span>") + "]";
            }
            else if (typeof arg === "string") {
                textRep = '"' + arg + '"';
            }
            else if (isObj) {
                const name = arg.constructor && arg.constructor.name;
                // No one needs to know an obj is an obj
                const nameWithoutObject = name && name === "Object" ? "" : name;
                const prefix = nameWithoutObject ? `${nameWithoutObject}: ` : "";
                textRep = prefix + JSON.stringify(arg, null, 2);
            }
            else {
                textRep = arg;
            }
            return textRep;
        };
        function produceOutput(args) {
            return args.reduce((output, arg, index) => {
                const textRep = objectToText(arg);
                const showComma = index !== args.length - 1;
                const comma = showComma ? "<span class='comma'>, </span>" : "";
                return output + textRep + comma + "&nbsp;";
            }, "");
        }
    }
    const addClearAction = (sandbox, ui, i) => {
        const clearLogsAction = {
            id: "clear-logs-play",
            label: "Clear Playground Logs",
            keybindings: [sandbox.monaco.KeyMod.CtrlCmd | sandbox.monaco.KeyCode.KEY_K],
            contextMenuGroupId: "run",
            contextMenuOrder: 1.5,
            run: function () {
                exports.clearLogs();
                ui.flashInfo(i("play_clear_logs"));
            },
        };
        sandbox.editor.addAction(clearLogsAction);
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVudGltZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3BsYXlncm91bmQvc3JjL3NpZGViYXIvcnVudGltZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0lBS0EsTUFBTSxPQUFPLEdBQWEsRUFBRSxDQUFBO0lBQzVCLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQTtJQUNkLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQTtJQUNkLElBQUksZ0JBQWdCLEdBQUcsS0FBSyxDQUFBO0lBRXJCLE1BQU0sU0FBUyxHQUFrQixDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRTtRQUNuRCxNQUFNLE1BQU0sR0FBcUI7WUFDL0IsRUFBRSxFQUFFLE1BQU07WUFDVixXQUFXLEVBQUUsQ0FBQyxDQUFDLG1CQUFtQixDQUFDO1lBQ25DLFNBQVMsRUFBRSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDaEMsSUFBSSxDQUFDLGdCQUFnQixFQUFFO29CQUNyQixNQUFNLEVBQUUsR0FBRyxtQkFBUSxFQUFFLENBQUE7b0JBQ3JCLGNBQWMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFBO29CQUM5QixnQkFBZ0IsR0FBRyxJQUFJLENBQUE7aUJBQ3hCO2dCQUVELElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7b0JBQ3hCLE1BQU0sZUFBZSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUE7b0JBQ3JELGVBQWUsQ0FBQyxFQUFFLEdBQUcseUJBQXlCLENBQUE7b0JBQzlDLFNBQVMsQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDLENBQUE7b0JBRXRDLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUE7b0JBQzdDLE9BQU8sQ0FBQyxXQUFXLEdBQUcsK0JBQVEsQ0FBQywyQkFBMkIsRUFBRSxTQUFTLENBQUMsQ0FBQTtvQkFD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QUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO1lBRTNFLGtCQUFrQixFQUFFLEtBQUs7WUFDekIsZ0JBQWdCLEVBQUUsR0FBRztZQUVyQixHQUFHLEVBQUU7Z0JBQ0gsaUJBQVMsRUFBRSxDQUFBO2dCQUNYLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQTtZQUNwQyxDQUFDO1NBQ0YsQ0FBQTtRQUVELE9BQU8sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxDQUFBO0lBQzNDLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFNhbmRib3ggfSBmcm9tIFwidHlwZXNjcmlwdGxhbmctb3JnL3N0YXRpYy9qcy9zYW5kYm94XCJcbmltcG9ydCB7IFBsYXlncm91bmRQbHVnaW4sIFBsdWdpbkZhY3RvcnkgfSBmcm9tIFwiLi5cIlxuaW1wb3J0IHsgY3JlYXRlVUksIFVJIH0gZnJvbSBcIi4uL2NyZWF0ZVVJXCJcbmltcG9ydCB7IGxvY2FsaXplIH0gZnJvbSBcIi4uL2xvY2FsaXplV2l0aEZhbGxiYWNrXCJcblxuY29uc3QgYWxsTG9nczogc3RyaW5nW10gPSBbXVxubGV0IG9mZnNldCA9IDBcbmxldCBjdXJMb2cgPSAwXG5sZXQgYWRkZWRDbGVhckFjdGlvbiA9IGZhbHNlXG5cbmV4cG9ydCBjb25zdCBydW5QbHVnaW46IFBsdWdpbkZhY3RvcnkgPSAoaSwgdXRpbHMpID0+IHtcbiAgY29uc3QgcGx1Z2luOiBQbGF5Z3JvdW5kUGx1Z2luID0ge1xuICAgIGlkOiBcImxvZ3NcIixcbiAgICBkaXNwbGF5TmFtZTogaShcInBsYXlfc2lkZWJhcl9sb2dzXCIpLFxuICAgIHdpbGxNb3VudDogKHNhbmRib3gsIGNvbnRhaW5lcikgPT4ge1xuICAgICAgaWYgKCFhZGRlZENsZWFyQWN0aW9uKSB7XG4gICAgICAgIGNvbnN0IHVpID0gY3JlYXRlVUkoKVxuICAgICAgICBhZGRDbGVhckFjdGlvbihzYW5kYm94LCB1aSwgaSlcbiAgICAgICAgYWRkZWRDbGVhckFjdGlvbiA9IHRydWVcbiAgICAgIH1cblxuICAgICAgaWYgKGFsbExvZ3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGNvbnN0IG5vRXJyb3JzTWVzc2FnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIilcbiAgICAgICAgbm9FcnJvcnNNZXNzYWdlLmlkID0gXCJlbXB0eS1tZXNzYWdlLWNvbnRhaW5lclwiXG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChub0Vycm9yc01lc3NhZ2UpXG5cbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIilcbiAgICAgICAgbWVzc2FnZS50ZXh0Q29udGVudCA9IGxvY2FsaXplKFwicGxheV9zaWRlYmFyX2xvZ3Nfbm9fbG9nc1wiLCBcIk5vIGxvZ3NcIilcbiAgICAgICAgbWVzc2FnZS5jbGFzc0xpc3QuYWRkKFwiZW1wdHktcGx1Z2luLW1lc3NhZ2VcIilcbiAgICAgICAgbm9FcnJvcnNNZXNzYWdlLmFwcGVuZENoaWxkKG1lc3NhZ2UpXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGVycm9yVUwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpXG4gICAgICBlcnJvclVMLmlkID0gXCJsb2ctY29udGFpbmVyXCJcbiAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChlcnJvclVMKVxuXG4gICAgICBjb25zdCBsb2dzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKVxuICAgICAgbG9ncy5pZCA9IFwibG9nXCJcbiAgICAgIGxvZ3MuaW5uZXJIVE1MID0gYWxsTG9ncy5qb2luKCc8aHIgLz4nKVxuICAgICAgZXJyb3JVTC5hcHBlbmRDaGlsZChsb2dzKVxuICAgIH0sXG4gIH1cblxuICByZXR1cm4gcGx1Z2luXG59XG5cbmV4cG9ydCBjb25zdCBjbGVhckxvZ3MgPSAoKSA9PiB7XG4gIG9mZnNldCArPSBhbGxMb2dzLmxlbmd0aFxuICBhbGxMb2dzLmxlbmd0aCA9IDBcbiAgY29uc3QgbG9ncyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibG9nXCIpXG4gIGlmIChsb2dzKSB7XG4gICAgbG9ncy50ZXh0Q29udGVudCA9IFwiXCJcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgcnVuV2l0aEN1c3RvbUxvZ3MgPSAoY2xvc3VyZTogUHJvbWlzZTxzdHJpbmc+LCBpOiBGdW5jdGlvbikgPT4ge1xuICBjb25zdCBub0xvZ3MgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImVtcHR5LW1lc3NhZ2UtY29udGFpbmVyXCIpXG4gIGlmIChub0xvZ3MpIHtcbiAgICBub0xvZ3Muc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiXG4gIH1cblxuICByZXdpcmVMb2dnaW5nVG9FbGVtZW50KFxuICAgICgpID0+IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibG9nXCIpISxcbiAgICAoKSA9PiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxvZy1jb250YWluZXJcIikhLFxuICAgIGNsb3N1cmUsXG4gICAgdHJ1ZSxcbiAgICBpXG4gIClcbn1cblxuLy8gVGhhbmtzIFNPOiBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yMDI1Njc2MC9qYXZhc2NyaXB0LWNvbnNvbGUtbG9nLXRvLWh0bWwvMzU0NDkyNTYjMzU0NDkyNTZcblxuZnVuY3Rpb24gcmV3aXJlTG9nZ2luZ1RvRWxlbWVudChcbiAgZWxlTG9jYXRvcjogKCkgPT4gRWxlbWVudCxcbiAgZWxlT3ZlcmZsb3dMb2NhdG9yOiAoKSA9PiBFbGVtZW50LFxuICBjbG9zdXJlOiBQcm9taXNlPHN0cmluZz4sXG4gIGF1dG9TY3JvbGw6IGJvb2xlYW4sXG4gIGk6IEZ1bmN0aW9uXG4pIHtcblxuICBjb25zdCByYXdDb25zb2xlID0gY29uc29sZVxuXG4gIGNsb3N1cmUudGhlbihqcyA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcGxhY2UgPSB7fSBhcyBhbnlcbiAgICAgIGJpbmRMb2dnaW5nRnVuYyhyZXBsYWNlLCByYXdDb25zb2xlLCAnbG9nJywgJ0xPRycsIGN1ckxvZylcbiAgICAgIGJpbmRMb2dnaW5nRnVuYyhyZXBsYWNlLCByYXdDb25zb2xlLCAnZGVidWcnLCAnREJHJywgY3VyTG9nKVxuICAgICAgYmluZExvZ2dpbmdGdW5jKHJlcGxhY2UsIHJhd0NvbnNvbGUsICd3YXJuJywgJ1dSTicsIGN1ckxvZylcbiAgICAgIGJpbmRMb2dnaW5nRnVuYyhyZXBsYWNlLCByYXdDb25zb2xlLCAnZXJyb3InLCAnRVJSJywgY3VyTG9nKVxuICAgICAgcmVwbGFjZVsnY2xlYXInXSA9IGNsZWFyTG9nc1xuICAgICAgY29uc3QgY29uc29sZSA9IE9iamVjdC5hc3NpZ24oe30sIHJhd0NvbnNvbGUsIHJlcGxhY2UpXG4gICAgICBldmFsKGpzKVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGkoXCJwbGF5X3J1bl9qc19mYWlsXCIpKVxuICAgICAgY29uc29sZS5lcnJvcihlcnJvcilcbiAgICB9XG4gICAgY3VyTG9nKytcbiAgfSlcblxuICBmdW5jdGlvbiBiaW5kTG9nZ2luZ0Z1bmMob2JqOiBhbnksIHJhdzogYW55LCBuYW1lOiBzdHJpbmcsIGlkOiBzdHJpbmcsIGN1cjogbnVtYmVyKSB7XG4gICAgb2JqW25hbWVdID0gZnVuY3Rpb24gKC4uLm9ianM6IGFueVtdKSB7XG4gICAgICBjb25zdCBvdXRwdXQgPSBwcm9kdWNlT3V0cHV0KG9ianMpXG4gICAgICBjb25zdCBlbGVMb2cgPSBlbGVMb2NhdG9yKClcbiAgICAgIGNvbnN0IHByZWZpeCA9IGBbPHNwYW4gY2xhc3M9XCJsb2ctJHtuYW1lfVwiPiR7aWR9PC9zcGFuPl06IGBcbiAgICAgIGNvbnN0IGVsZUNvbnRhaW5lckxvZyA9IGVsZU92ZXJmbG93TG9jYXRvcigpXG4gICAgICBjb25zdCBpbmRleCA9IGN1ciAtIG9mZnNldFxuICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgYWxsTG9nc1tpbmRleF0gPSAoYWxsTG9nc1tpbmRleF0gPz8gJycpICsgcHJlZml4ICsgb3V0cHV0ICsgXCI8YnI+XCJcbiAgICAgIH1cbiAgICAgIGVsZUxvZy5pbm5lckhUTUwgPSBhbGxMb2dzLmpvaW4oXCI8aHIgLz5cIilcbiAgICAgIGNvbnN0IHNjcm9sbEVsZW1lbnQgPSBlbGVDb250YWluZXJMb2cucGFyZW50RWxlbWVudFxuICAgICAgaWYgKGF1dG9TY3JvbGwgJiYgc2Nyb2xsRWxlbWVudCkge1xuICAgICAgICBzY3JvbGxUb0JvdHRvbShzY3JvbGxFbGVtZW50KVxuICAgICAgfVxuICAgICAgcmF3W25hbWVdKC4uLm9ianMpXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2Nyb2xsVG9Cb3R0b20oZWxlbWVudDogRWxlbWVudCkge1xuICAgIGNvbnN0IG92ZXJmbG93SGVpZ2h0ID0gZWxlbWVudC5zY3JvbGxIZWlnaHQgLSBlbGVtZW50LmNsaWVudEhlaWdodFxuICAgIGNvbnN0IGF0Qm90dG9tID0gZWxlbWVudC5zY3JvbGxUb3AgPj0gb3ZlcmZsb3dIZWlnaHRcbiAgICBpZiAoIWF0Qm90dG9tKSB7XG4gICAgICBlbGVtZW50LnNjcm9sbFRvcCA9IG92ZXJmbG93SGVpZ2h0XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgb2JqZWN0VG9UZXh0ID0gKGFyZzogYW55KTogc3RyaW5nID0+IHtcbiAgICBjb25zdCBpc09iaiA9IHR5cGVvZiBhcmcgPT09IFwib2JqZWN0XCJcbiAgICBsZXQgdGV4dFJlcCA9IFwiXCJcbiAgICBpZiAoYXJnICYmIGFyZy5zdGFjayAmJiBhcmcubWVzc2FnZSkge1xuICAgICAgLy8gc3BlY2lhbCBjYXNlIGZvciBlcnJcbiAgICAgIHRleHRSZXAgPSBhcmcubWVzc2FnZVxuICAgIH0gZWxzZSBpZiAoYXJnID09PSBudWxsKSB7XG4gICAgICB0ZXh0UmVwID0gXCI8c3BhbiBjbGFzcz0nbGl0ZXJhbCc+bnVsbDwvc3Bhbj5cIlxuICAgIH0gZWxzZSBpZiAoYXJnID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRleHRSZXAgPSBcIjxzcGFuIGNsYXNzPSdsaXRlcmFsJz51bmRlZmluZWQ8L3NwYW4+XCJcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkge1xuICAgICAgdGV4dFJlcCA9IFwiW1wiICsgYXJnLm1hcChvYmplY3RUb1RleHQpLmpvaW4oXCI8c3BhbiBjbGFzcz0nY29tbWEnPiwgPC9zcGFuPlwiKSArIFwiXVwiXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgYXJnID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB0ZXh0UmVwID0gJ1wiJyArIGFyZyArICdcIidcbiAgICB9IGVsc2UgaWYgKGlzT2JqKSB7XG4gICAgICBjb25zdCBuYW1lID0gYXJnLmNvbnN0cnVjdG9yICYmIGFyZy5jb25zdHJ1Y3Rvci5uYW1lXG4gICAgICAvLyBObyBvbmUgbmVlZHMgdG8ga25vdyBhbiBvYmogaXMgYW4gb2JqXG4gICAgICBjb25zdCBuYW1lV2l0aG91dE9iamVjdCA9IG5hbWUgJiYgbmFtZSA9PT0gXCJPYmplY3RcIiA/IFwiXCIgOiBuYW1lXG4gICAgICBjb25zdCBwcmVmaXggPSBuYW1lV2l0aG91dE9iamVjdCA/IGAke25hbWVXaXRob3V0T2JqZWN0fTogYCA6IFwiXCJcbiAgICAgIHRleHRSZXAgPSBwcmVmaXggKyBKU09OLnN0cmluZ2lmeShhcmcsIG51bGwsIDIpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRleHRSZXAgPSBhcmcgYXMgYW55XG4gICAgfVxuICAgIHJldHVybiB0ZXh0UmVwXG4gIH1cblxuICBmdW5jdGlvbiBwcm9kdWNlT3V0cHV0KGFyZ3M6IGFueVtdKSB7XG4gICAgcmV0dXJuIGFyZ3MucmVkdWNlKChvdXRwdXQ6IGFueSwgYXJnOiBhbnksIGluZGV4KSA9PiB7XG4gICAgICBjb25zdCB0ZXh0UmVwID0gb2JqZWN0VG9UZXh0KGFyZylcbiAgICAgIGNvbnN0IHNob3dDb21tYSA9IGluZGV4ICE9PSBhcmdzLmxlbmd0aCAtIDFcbiAgICAgIGNvbnN0IGNvbW1hID0gc2hvd0NvbW1hID8gXCI8c3BhbiBjbGFzcz0nY29tbWEnPiwgPC9zcGFuPlwiIDogXCJcIlxuICAgICAgcmV0dXJuIG91dHB1dCArIHRleHRSZXAgKyBjb21tYSArIFwiJm5ic3A7XCJcbiAgICB9LCBcIlwiKVxuICB9XG59XG5cbmNvbnN0IGFkZENsZWFyQWN0aW9uID0gKHNhbmRib3g6IFNhbmRib3gsIHVpOiBVSSwgaTogYW55KSA9PiB7XG4gIGNvbnN0IGNsZWFyTG9nc0FjdGlvbiA9IHtcbiAgICBpZDogXCJjbGVhci1sb2dzLXBsYXlcIixcbiAgICBsYWJlbDogXCJDbGVhciBQbGF5Z3JvdW5kIExvZ3NcIixcbiAgICBrZXliaW5kaW5nczogW3NhbmRib3gubW9uYWNvLktleU1vZC5DdHJsQ21kIHwgc2FuZGJveC5tb25hY28uS2V5Q29kZS5LRVlfS10sXG5cbiAgICBjb250ZXh0TWVudUdyb3VwSWQ6IFwicnVuXCIsXG4gICAgY29udGV4dE1lbnVPcmRlcjogMS41LFxuXG4gICAgcnVuOiBmdW5jdGlvbiAoKSB7XG4gICAgICBjbGVhckxvZ3MoKVxuICAgICAgdWkuZmxhc2hJbmZvKGkoXCJwbGF5X2NsZWFyX2xvZ3NcIikpXG4gICAgfSxcbiAgfVxuXG4gIHNhbmRib3guZWRpdG9yLmFkZEFjdGlvbihjbGVhckxvZ3NBY3Rpb24pXG59XG4iXX0=
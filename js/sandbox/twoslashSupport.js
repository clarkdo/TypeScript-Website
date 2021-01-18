define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.twoslashCompletions = exports.parsePrimitive = exports.extractTwoSlashComplierOptions = void 0;
    const booleanConfigRegexp = /^\/\/\s?@(\w+)$/;
    // https://regex101.com/r/8B2Wwh/1
    const valuedConfigRegexp = /^\/\/\s?@(\w+):\s?(.+)$/;
    /**
     * This is a port of the twoslash bit which grabs compiler options
     * from the source code
     */
    const extractTwoSlashComplierOptions = (ts) => {
        let optMap = new Map();
        // @ts-ignore - optionDeclarations is not public API
        for (const opt of ts.optionDeclarations) {
            optMap.set(opt.name.toLowerCase(), opt);
        }
        return (code) => {
            const codeLines = code.split("\n");
            const options = {};
            codeLines.forEach(line => {
                let match;
                if ((match = booleanConfigRegexp.exec(line))) {
                    if (optMap.has(match[1].toLowerCase())) {
                        options[match[1]] = true;
                        setOption(match[1], "true", options, optMap);
                    }
                }
                else if ((match = valuedConfigRegexp.exec(line))) {
                    if (optMap.has(match[1].toLowerCase())) {
                        setOption(match[1], match[2], options, optMap);
                    }
                }
            });
            return options;
        };
    };
    exports.extractTwoSlashComplierOptions = extractTwoSlashComplierOptions;
    function setOption(name, value, opts, optMap) {
        const opt = optMap.get(name.toLowerCase());
        if (!opt)
            return;
        switch (opt.type) {
            case "number":
            case "string":
            case "boolean":
                opts[opt.name] = parsePrimitive(value, opt.type);
                break;
            case "list":
                opts[opt.name] = value.split(",").map(v => parsePrimitive(v, opt.element.type));
                break;
            default:
                opts[opt.name] = opt.type.get(value.toLowerCase());
                if (opts[opt.name] === undefined) {
                    const keys = Array.from(opt.type.keys());
                    console.log(`Invalid value ${value} for ${opt.name}. Allowed values: ${keys.join(",")}`);
                }
        }
    }
    function parsePrimitive(value, type) {
        switch (type) {
            case "number":
                return +value;
            case "string":
                return value;
            case "boolean":
                return value.toLowerCase() === "true" || value.length === 0;
        }
        console.log(`Unknown primitive type ${type} with - ${value}`);
    }
    exports.parsePrimitive = parsePrimitive;
    // Function to generate autocompletion results
    const twoslashCompletions = (ts, monaco) => (model, position, _token) => {
        // Split everything the user has typed on the current line up at each space, and only look at the last word
        const thisLine = model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: 0,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
        });
        // Not a comment
        if (!thisLine.startsWith("//")) {
            return { suggestions: [] };
        }
        const words = thisLine.replace("\t", "").split(" ");
        // Not the right amount of
        if (words.length !== 2) {
            return { suggestions: [] };
        }
        const word = words[1];
        // Not a @ at the first word
        if (!word.startsWith("@")) {
            return { suggestions: [] };
        }
        const result = [];
        const knowns = [
            "noErrors",
            "errors",
            "showEmit",
            "showEmittedFile",
            "noStaticSemanticInfo",
            "emit",
            "noErrorValidation",
        ];
        // @ts-ignore - ts.optionDeclarations is private
        const optsNames = ts.optionDeclarations.map(o => o.name);
        knowns.concat(optsNames).forEach(name => {
            if (name.startsWith(word.slice(1))) {
                // @ts-ignore - somehow adding the range seems to not give autocomplete results?
                result.push({
                    label: name,
                    kind: 14,
                    detail: "Twoslash comment",
                    insertText: name,
                });
            }
        });
        return {
            suggestions: result,
        };
    };
    exports.twoslashCompletions = twoslashCompletions;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHdvc2xhc2hTdXBwb3J0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc2FuZGJveC9zcmMvdHdvc2xhc2hTdXBwb3J0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7SUFBQSxNQUFNLG1CQUFtQixHQUFHLGlCQUFpQixDQUFBO0lBRTdDLGtDQUFrQztJQUNsQyxNQUFNLGtCQUFrQixHQUFHLHlCQUF5QixDQUFBO0lBS3BEOzs7T0FHRztJQUVJLE1BQU0sOEJBQThCLEdBQUcsQ0FBQyxFQUFNLEVBQUUsRUFBRTtRQUN2RCxJQUFJLE1BQU0sR0FBRyxJQUFJLEdBQUcsRUFBZSxDQUFBO1FBRW5DLG9EQUFvRDtRQUNwRCxLQUFLLE1BQU0sR0FBRyxJQUFJLEVBQUUsQ0FBQyxrQkFBa0IsRUFBRTtZQUN2QyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUE7U0FDeEM7UUFFRCxPQUFPLENBQUMsSUFBWSxFQUFFLEVBQUU7WUFDdEIsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTtZQUNsQyxNQUFNLE9BQU8sR0FBRyxFQUFTLENBQUE7WUFFekIsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDdkIsSUFBSSxLQUFLLENBQUE7Z0JBQ1QsSUFBSSxDQUFDLEtBQUssR0FBRyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTtvQkFDNUMsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUFFO3dCQUN0QyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFBO3dCQUN4QixTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxPQUFP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QUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2xDLGdGQUFnRjtnQkFDaEYsTUFBTSxDQUFDLElBQUksQ0FBQztvQkFDVixLQUFLLEVBQUUsSUFBSTtvQkFDWCxJQUFJLEVBQUUsRUFBRTtvQkFDUixNQUFNLEVBQUUsa0JBQWtCO29CQUMxQixVQUFVLEVBQUUsSUFBSTtpQkFDakIsQ0FBQyxDQUFBO2FBQ0g7UUFDSCxDQUFDLENBQUMsQ0FBQTtRQUVGLE9BQU87WUFDTCxXQUFXLEVBQUUsTUFBTTtTQUNwQixDQUFBO0lBQ0gsQ0FBQyxDQUFBO0lBMURZLFFBQUEsbUJBQW1CLHVCQTBEL0IiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBib29sZWFuQ29uZmlnUmVnZXhwID0gL15cXC9cXC9cXHM/QChcXHcrKSQvXG5cbi8vIGh0dHBzOi8vcmVnZXgxMDEuY29tL3IvOEIyV3doLzFcbmNvbnN0IHZhbHVlZENvbmZpZ1JlZ2V4cCA9IC9eXFwvXFwvXFxzP0AoXFx3Kyk6XFxzPyguKykkL1xuXG50eXBlIFRTID0gdHlwZW9mIGltcG9ydChcInR5cGVzY3JpcHRcIilcbnR5cGUgQ29tcGlsZXJPcHRpb25zID0gaW1wb3J0KFwidHlwZXNjcmlwdFwiKS5Db21waWxlck9wdGlvbnNcblxuLyoqXG4gKiBUaGlzIGlzIGEgcG9ydCBvZiB0aGUgdHdvc2xhc2ggYml0IHdoaWNoIGdyYWJzIGNvbXBpbGVyIG9wdGlvbnNcbiAqIGZyb20gdGhlIHNvdXJjZSBjb2RlXG4gKi9cblxuZXhwb3J0IGNvbnN0IGV4dHJhY3RUd29TbGFzaENvbXBsaWVyT3B0aW9ucyA9ICh0czogVFMpID0+IHtcbiAgbGV0IG9wdE1hcCA9IG5ldyBNYXA8c3RyaW5nLCBhbnk+KClcblxuICAvLyBAdHMtaWdub3JlIC0gb3B0aW9uRGVjbGFyYXRpb25zIGlzIG5vdCBwdWJsaWMgQVBJXG4gIGZvciAoY29uc3Qgb3B0IG9mIHRzLm9wdGlvbkRlY2xhcmF0aW9ucykge1xuICAgIG9wdE1hcC5zZXQob3B0Lm5hbWUudG9Mb3dlckNhc2UoKSwgb3B0KVxuICB9XG5cbiAgcmV0dXJuIChjb2RlOiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBjb2RlTGluZXMgPSBjb2RlLnNwbGl0KFwiXFxuXCIpXG4gICAgY29uc3Qgb3B0aW9ucyA9IHt9IGFzIGFueVxuXG4gICAgY29kZUxpbmVzLmZvckVhY2gobGluZSA9PiB7XG4gICAgICBsZXQgbWF0Y2hcbiAgICAgIGlmICgobWF0Y2ggPSBib29sZWFuQ29uZmlnUmVnZXhwLmV4ZWMobGluZSkpKSB7XG4gICAgICAgIGlmIChvcHRNYXAuaGFzKG1hdGNoWzFdLnRvTG93ZXJDYXNlKCkpKSB7XG4gICAgICAgICAgb3B0aW9uc1ttYXRjaFsxXV0gPSB0cnVlXG4gICAgICAgICAgc2V0T3B0aW9uKG1hdGNoWzFdLCBcInRydWVcIiwgb3B0aW9ucywgb3B0TWFwKVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKChtYXRjaCA9IHZhbHVlZENvbmZpZ1JlZ2V4cC5leGVjKGxpbmUpKSkge1xuICAgICAgICBpZiAob3B0TWFwLmhhcyhtYXRjaFsxXS50b0xvd2VyQ2FzZSgpKSkge1xuICAgICAgICAgIHNldE9wdGlvbihtYXRjaFsxXSwgbWF0Y2hbMl0sIG9wdGlvbnMsIG9wdE1hcClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG4gICAgcmV0dXJuIG9wdGlvbnNcbiAgfVxufVxuXG5mdW5jdGlvbiBzZXRPcHRpb24obmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nLCBvcHRzOiBDb21waWxlck9wdGlvbnMsIG9wdE1hcDogTWFwPHN0cmluZywgYW55Pikge1xuICBjb25zdCBvcHQgPSBvcHRNYXAuZ2V0KG5hbWUudG9Mb3dlckNhc2UoKSlcbiAgaWYgKCFvcHQpIHJldHVyblxuICBzd2l0Y2ggKG9wdC50eXBlKSB7XG4gICAgY2FzZSBcIm51bWJlclwiOlxuICAgIGNhc2UgXCJzdHJpbmdcIjpcbiAgICBjYXNlIFwiYm9vbGVhblwiOlxuICAgICAgb3B0c1tvcHQubmFtZV0gPSBwYXJzZVByaW1pdGl2ZSh2YWx1ZSwgb3B0LnR5cGUpXG4gICAgICBicmVha1xuXG4gICAgY2FzZSBcImxpc3RcIjpcbiAgICAgIG9wdHNbb3B0Lm5hbWVdID0gdmFsdWUuc3BsaXQoXCIsXCIpLm1hcCh2ID0+IHBhcnNlUHJpbWl0aXZlKHYsIG9wdC5lbGVtZW50IS50eXBlIGFzIHN0cmluZykpXG4gICAgICBicmVha1xuXG4gICAgZGVmYXVsdDpcbiAgICAgIG9wdHNbb3B0Lm5hbWVdID0gb3B0LnR5cGUuZ2V0KHZhbHVlLnRvTG93ZXJDYXNlKCkpXG5cbiAgICAgIGlmIChvcHRzW29wdC5uYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnN0IGtleXMgPSBBcnJheS5mcm9tKG9wdC50eXBlLmtleXMoKSBhcyBhbnkpXG4gICAgICAgIGNvbnNvbGUubG9nKGBJbnZhbGlkIHZhbHVlICR7dmFsdWV9IGZvciAke29wdC5uYW1lfS4gQWxsb3dlZCB2YWx1ZXM6ICR7a2V5cy5qb2luKFwiLFwiKX1gKVxuICAgICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVByaW1pdGl2ZSh2YWx1ZTogc3RyaW5nLCB0eXBlOiBzdHJpbmcpOiBhbnkge1xuICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlIFwibnVtYmVyXCI6XG4gICAgICByZXR1cm4gK3ZhbHVlXG4gICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgcmV0dXJuIHZhbHVlXG4gICAgY2FzZSBcImJvb2xlYW5cIjpcbiAgICAgIHJldHVybiB2YWx1ZS50b0xvd2VyQ2FzZSgpID09PSBcInRydWVcIiB8fCB2YWx1ZS5sZW5ndGggPT09IDBcbiAgfVxuICBjb25zb2xlLmxvZyhgVW5rbm93biBwcmltaXRpdmUgdHlwZSAke3R5cGV9IHdpdGggLSAke3ZhbHVlfWApXG59XG5cbi8vIEZ1bmN0aW9uIHRvIGdlbmVyYXRlIGF1dG9jb21wbGV0aW9uIHJlc3VsdHNcbmV4cG9ydCBjb25zdCB0d29zbGFzaENvbXBsZXRpb25zID0gKHRzOiBUUywgbW9uYWNvOiB0eXBlb2YgaW1wb3J0KFwibW9uYWNvLWVkaXRvclwiKSkgPT4gKFxuICBtb2RlbDogaW1wb3J0KFwibW9uYWNvLWVkaXRvclwiKS5lZGl0b3IuSVRleHRNb2RlbCxcbiAgcG9zaXRpb246IGltcG9ydChcIm1vbmFjby1lZGl0b3JcIikuUG9zaXRpb24sXG4gIF90b2tlbjogYW55XG4pID0+IHtcbiAgLy8gU3BsaXQgZXZlcnl0aGluZyB0aGUgdXNlciBoYXMgdHlwZWQgb24gdGhlIGN1cnJlbnQgbGluZSB1cCBhdCBlYWNoIHNwYWNlLCBhbmQgb25seSBsb29rIGF0IHRoZSBsYXN0IHdvcmRcbiAgY29uc3QgdGhpc0xpbmUgPSBtb2RlbC5nZXRWYWx1ZUluUmFuZ2Uoe1xuICAgIHN0YXJ0TGluZU51bWJlcjogcG9zaXRpb24ubGluZU51bWJlcixcbiAgICBzdGFydENvbHVtbjogMCxcbiAgICBlbmRMaW5lTnVtYmVyOiBwb3NpdGlvbi5saW5lTnVtYmVyLFxuICAgIGVuZENvbHVtbjogcG9zaXRpb24uY29sdW1uLFxuICB9KVxuXG4gIC8vIE5vdCBhIGNvbW1lbnRcbiAgaWYgKCF0aGlzTGluZS5zdGFydHNXaXRoKFwiLy9cIikpIHtcbiAgICByZXR1cm4geyBzdWdnZXN0aW9uczogW10gfVxuICB9XG5cbiAgY29uc3Qgd29yZHMgPSB0aGlzTGluZS5yZXBsYWNlKFwiXFx0XCIsIFwiXCIpLnNwbGl0KFwiIFwiKVxuICAvLyBOb3QgdGhlIHJpZ2h0IGFtb3VudCBvZlxuICBpZiAod29yZHMubGVuZ3RoICE9PSAyKSB7XG4gICAgcmV0dXJuIHsgc3VnZ2VzdGlvbnM6IFtdIH1cbiAgfVxuXG4gIGNvbnN0IHdvcmQgPSB3b3Jkc1sxXVxuICAvLyBOb3QgYSBAIGF0IHRoZSBmaXJzdCB3b3JkXG4gIGlmICghd29yZC5zdGFydHNXaXRoKFwiQFwiKSkge1xuICAgIHJldHVybiB7IHN1Z2dlc3Rpb25zOiBbXSB9XG4gIH1cblxuICBjb25zdCByZXN1bHQ6IGltcG9ydChcIm1vbmFjby1lZGl0b3JcIikubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtW10gPSBbXVxuXG4gIGNvbnN0IGtub3ducyA9IFtcbiAgICBcIm5vRXJyb3JzXCIsXG4gICAgXCJlcnJvcnNcIixcbiAgICBcInNob3dFbWl0XCIsXG4gICAgXCJzaG93RW1pdHRlZEZpbGVcIixcbiAgICBcIm5vU3RhdGljU2VtYW50aWNJbmZvXCIsXG4gICAgXCJlbWl0XCIsXG4gICAgXCJub0Vycm9yVmFsaWRhdGlvblwiLFxuICBdXG4gIC8vIEB0cy1pZ25vcmUgLSB0cy5vcHRpb25EZWNsYXJhdGlvbnMgaXMgcHJpdmF0ZVxuICBjb25zdCBvcHRzTmFtZXMgPSB0cy5vcHRpb25EZWNsYXJhdGlvbnMubWFwKG8gPT4gby5uYW1lKVxuICBrbm93bnMuY29uY2F0KG9wdHNOYW1lcykuZm9yRWFjaChuYW1lID0+IHtcbiAgICBpZiAobmFtZS5zdGFydHNXaXRoKHdvcmQuc2xpY2UoMSkpKSB7XG4gICAgICAvLyBAdHMtaWdub3JlIC0gc29tZWhvdyBhZGRpbmcgdGhlIHJhbmdlIHNlZW1zIHRvIG5vdCBnaXZlIGF1dG9jb21wbGV0ZSByZXN1bHRzP1xuICAgICAgcmVzdWx0LnB1c2goe1xuICAgICAgICBsYWJlbDogbmFtZSxcbiAgICAgICAga2luZDogMTQsXG4gICAgICAgIGRldGFpbDogXCJUd29zbGFzaCBjb21tZW50XCIsXG4gICAgICAgIGluc2VydFRleHQ6IG5hbWUsXG4gICAgICB9KVxuICAgIH1cbiAgfSlcblxuICByZXR1cm4ge1xuICAgIHN1Z2dlc3Rpb25zOiByZXN1bHQsXG4gIH1cbn1cbiJdfQ==
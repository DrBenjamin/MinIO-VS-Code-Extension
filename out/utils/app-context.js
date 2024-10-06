"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppContext = void 0;
let _extContext;
class AppContext {
    static init(context) {
        _extContext = context;
    }
    static get extContext() {
        return _extContext;
    }
    static get extName() {
        return this.extContext.extension.packageJSON.name;
    }
}
exports.AppContext = AppContext;
//# sourceMappingURL=app-context.js.map
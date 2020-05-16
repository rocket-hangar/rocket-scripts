"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebstormWebpackConfig = void 0;
const getWebpackAlias_1 = require("./webpackConfigs/getWebpackAlias");
function createWebstormWebpackConfig({ cwd = process.cwd() } = {}) {
    return {
        resolve: {
            alias: getWebpackAlias_1.getWebpackAlias({ cwd }),
        },
    };
}
exports.createWebstormWebpackConfig = createWebstormWebpackConfig;
//# sourceMappingURL=createWebstormWebpackConfig.js.map
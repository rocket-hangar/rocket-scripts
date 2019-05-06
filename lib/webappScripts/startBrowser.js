"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const webpack_plugin_1 = __importDefault(require("@loadable/webpack-plugin"));
const browser_sync_1 = __importDefault(require("browser-sync"));
const compression_1 = __importDefault(require("compression"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const html_webpack_plugin_1 = __importDefault(require("html-webpack-plugin"));
const http_proxy_middleware_1 = __importDefault(require("http-proxy-middleware"));
const path_1 = __importDefault(require("path"));
const webpack_1 = __importStar(require("webpack"));
const webpack_dev_middleware_1 = __importDefault(require("webpack-dev-middleware"));
const webpack_hot_middleware_1 = __importDefault(require("webpack-hot-middleware"));
const webpack_merge_1 = __importDefault(require("webpack-merge"));
const sayTitle_1 = require("../utils/sayTitle");
const createBaseWebpackConfig_1 = require("../webpackConfigs/createBaseWebpackConfig");
const createBrowserAppWebpackConfig_1 = require("../webpackConfigs/createBrowserAppWebpackConfig");
const createWebappWebpackConfig_1 = require("../webpackConfigs/createWebappWebpackConfig");
// work
// - [x] serve js, css files by webpack middlewares
// - [x] serve static files by browser-sync
// - [x] create loadable-stats.json when server side rendering is enabled
// - [x] serve html files when templates are exists
// staticFileDirectories
// - [x] serve static file directories by browser-sync
// sizeReport
// - none of effect to this task
// mode
// - none of effect to this task
// output
// - [x] loadable-stats.json
// - [x] serve static files
// - [x] mkdirp before create loadable-stats.json
// appFileName
// - [x] entry name
// vendorFileName
// - [x] using on chunks2-webpack-plugin
// - [x] pass to createBrowserAppWebpackConfig
// styleFileName
// - [x] using on chunks2-webpack-plugin
// - [x] pass to createBrowserAppWebpackConfig
// chunkPath
// - [x] pass to createBrowserAppWebpackConfig
// publicPath
// - [x] webpack public path
// - [x] process.env.PUBLIC_PATH
// port
// - [x] browser-sync port
// serverPort
// - [x] process.env.SERVER_PORT
// https
// - [x] browser-sync https
// extend.serverSideRendering
// - [x] create output directory for create loadable-stats.json
// - [x] create loadable-stats.json
// extend.templateFiles
// - [x] create html files
async function startBrowser({ cwd, app, output, port, https, serverPort, staticFileDirectories, chunkPath, publicPath, appFileName, vendorFileName, styleFileName, extend, zeroconfigPath, }) {
    const webpackConfig = webpack_merge_1.default(createBaseWebpackConfig_1.createBaseWebpackConfig({ zeroconfigPath }), {
        mode: 'development',
        devtool: 'cheap-module-eval-source-map',
        output: {
            path: cwd,
            publicPath,
        },
        entry: {
            [appFileName]: [
                `${path_1.default.dirname(require.resolve('webpack-hot-middleware/package.json'))}/client?http://localhost:${port}`,
                `${path_1.default.dirname(require.resolve('webpack/package.json'))}/hot/only-dev-server`,
                path_1.default.join(cwd, 'src', app),
            ],
        },
        optimization: {
            namedModules: true,
            noEmitOnErrors: true,
        },
        plugins: [
            new webpack_1.HotModuleReplacementPlugin(),
            // create loadable-stats.json when server side rendering enabled
            ...(extend.serverSideRendering ? [
                new webpack_plugin_1.default({
                    filename: path_1.default.join(output, 'loadable-stats.json'),
                    writeToDisk: true,
                }),
            ] : []),
            // create html files
            ...(extend.templateFiles.length > 0 ? extend.templateFiles.map(templateFile => {
                const extname = path_1.default.extname(templateFile);
                const filename = path_1.default.basename(templateFile, extname);
                return new html_webpack_plugin_1.default({
                    template: path_1.default.join(cwd, 'src', app, templateFile),
                    filename: filename + '.html',
                });
            }) : []),
        ],
    }, createWebappWebpackConfig_1.createWebappWebpackConfig({
        extractCss: false,
        cwd,
        serverPort,
        publicPath,
    }), createBrowserAppWebpackConfig_1.createBrowserAppWebpackConfig({
        chunkPath,
        vendorFileName,
        styleFileName,
        hash: '',
    }));
    const compiler = webpack_1.default(webpackConfig);
    const middleware = [
        webpack_dev_middleware_1.default(compiler, {
            publicPath: publicPath,
            stats: { colors: true },
        }),
        webpack_hot_middleware_1.default(compiler),
        compression_1.default(),
    ];
    if (extend.serverSideRendering) {
        middleware.push(http_proxy_middleware_1.default(['**', '!**/*.*'], {
            target: `http://localhost:${serverPort}`,
        }));
    }
    else {
        middleware.push(function (req, res, next) {
            if (req.url && !/\.[a-zA-Z0-9]+$/.test(req.url)) {
                req.url = '/index.html';
            }
            return next();
        });
    }
    const browserSyncConfig = {
        port,
        open: false,
        ghostMode: false,
        //@ts-ignore missing type
        https,
        server: {
            baseDir: staticFileDirectories,
            middleware,
        },
        files: staticFileDirectories,
    };
    // create output directory if not exists for loadable-stats.json
    if (extend.serverSideRendering)
        await fs_extra_1.default.mkdirp(path_1.default.join(output));
    // run browser-sync
    sayTitle_1.sayTitle('START BROWSER-SYNC + WEBPACK');
    browser_sync_1.default(browserSyncConfig, error => {
        if (error)
            console.error(error);
    });
}
exports.startBrowser = startBrowser;
//# sourceMappingURL=startBrowser.js.map
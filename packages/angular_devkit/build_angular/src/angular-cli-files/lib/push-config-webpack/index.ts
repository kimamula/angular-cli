// tslint:disable
import { Compiler } from 'webpack';
// tslint:enable

const SOURCEMAP_REGEXP = /\.map$/;
const REQUEST_SUFFIX_REGEXP = /\.ngfactory$/;

export class PushConfigWebpackPlugin {
  apply(compiler: Compiler) {
    compiler.hooks.emit.tap(PushConfigWebpackPlugin.name, compilation => {
      const pushConfig: { [loadPath: string]: { [resource: string]: string } } = { '': {} };
      for (const chunkGroup of compilation.chunkGroups) {
        const files = (chunkGroup.getFiles() as string[])
          .filter(file => !SOURCEMAP_REGEXP.test(file));
        for (const origin of chunkGroup.origins) {
          const loadPath = origin.request ? origin.request.replace(REQUEST_SUFFIX_REGEXP, '') : '';
          if (!pushConfig[loadPath]) {
            pushConfig[loadPath] = {};
          }
          files.forEach((file) => {
            if (pushConfig[loadPath][file]) {
              return;
            }
            let type: string | undefined;
            if (file.endsWith('.js')) {
              type = 'script';
            } else if (file.endsWith('.css')) {
              type = 'style';
            }
            if (type) {
              pushConfig[loadPath][file] = type;
            }
          });
        }
      }
      const output = JSON.stringify(pushConfig);
      compilation.assets['ngpush-config.json'] = {
        source() {
          return output;
        },
        size() {
          return output.length;
        },
      };
    });
  }
}

// SPDX-License-Identifier: AGPL-3.0-only
module.exports = process.env.AUREA_TARGET === 'remote' ? {} : {
  project: {android: {sourceDir: __dirname, appName: 'app', packageName: 'io.github.jqssun.airplay'}},
};

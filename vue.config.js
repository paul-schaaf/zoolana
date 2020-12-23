module.exports = {
  chainWebpack: config => {
    // title that shows up in different places e.g. the tab title
    config.plugin("html").tap(args => {
      args[0].title = "Zoolana";
      return args;
    });

    // setting custom font name so it can be imported inside index.html
    config.module
      .rule("fonts")
      .use("url-loader")
      .loader("url-loader")
      .tap(options => {
        options.fallback.options.name = "fonts/[name].[ext]";
        // modify the options...
        return options;
      });
  }
};
